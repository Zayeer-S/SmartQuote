import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { DatabaseStack } from '../lib/database-stack';
import { AppStack } from '../lib/app-stack';
import { CertificateStack } from '../lib/certificate-stack';
import { infraConfig } from '../lib/config';

function buildStacks() {
  const app = new cdk.App();

  const euWest2 = { account: infraConfig.account, region: infraConfig.region };

  const certificateStack = new CertificateStack(app, 'TestCertStack', {
    env: { account: infraConfig.account, region: 'us-east-1' },
    crossRegionReferences: true,
  });

  const databaseStack = new DatabaseStack(app, 'TestDbStack', { env: euWest2 });

  const appStack = new AppStack(app, 'TestAppStack', {
    env: euWest2,
    crossRegionReferences: true,
    databaseStack,
    certificateStack,
  });

  return {
    dbTemplate: Template.fromStack(databaseStack),
    appTemplate: Template.fromStack(appStack),
  };
}

describe('DatabaseStack', () => {
  let dbTemplate: Template;

  beforeAll(() => {
    ({ dbTemplate } = buildStacks());
  });

  describe('VPC endpoints', () => {
    it('has exactly 3 VPC endpoints (S3 gateway, Secrets Manager interface, Bedrock interface)', () => {
      dbTemplate.resourceCountIs('AWS::EC2::VPCEndpoint', 3);
    });

    it('has an S3 gateway endpoint', () => {
      dbTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: Match.stringLikeRegexp('s3'),
      });
    });

    it('has a Secrets Manager interface endpoint', () => {
      dbTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: Match.stringLikeRegexp('secretsmanager'),
      });
    });

    it('has a Bedrock runtime interface endpoint', () => {
      dbTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: Match.stringLikeRegexp('bedrock-runtime'),
      });
    });
  });

  describe('RDS instance', () => {
    it('is not publicly accessible', () => {
      dbTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    it('uses the correct instance identifier from config', () => {
      dbTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: infraConfig.db.instanceIdentifier,
      });
    });

    it('uses the correct database name from config', () => {
      dbTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: infraConfig.db.databaseName,
      });
    });

    it('has deletion protection enabled', () => {
      dbTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: infraConfig.db.deletionProtection,
      });
    });

    it('has the correct allocated storage from config', () => {
      dbTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        AllocatedStorage: String(infraConfig.db.allocatedStorageGb),
      });
    });
  });

  describe('Security groups', () => {
    it('Lambda SG allows all outbound traffic', () => {
      dbTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Attached to Lambda - allows outbound to RDS',
        SecurityGroupEgress: Match.arrayWith([Match.objectLike({ CidrIp: '0.0.0.0/0' })]),
      });
    });

    it('DB SG only accepts inbound on the Postgres port', () => {
      dbTemplate.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: infraConfig.db.port,
        ToPort: infraConfig.db.port,
        IpProtocol: 'tcp',
      });
    });
  });

  describe('Outputs', () => {
    it('exports LambdaSecurityGroupId', () => {
      dbTemplate.hasOutput('*', { Export: { Name: 'LambdaSecurityGroupId' } });
    });

    it('exports DbEndpoint', () => {
      dbTemplate.hasOutput('*', { Export: { Name: 'DbEndpoint' } });
    });

    it('exports VpcId', () => {
      dbTemplate.hasOutput('*', { Export: { Name: 'VpcId' } });
    });
  });
});

describe('AppStack', () => {
  let appTemplate: Template;

  beforeAll(() => {
    ({ appTemplate } = buildStacks());
  });

  describe('API Lambda', () => {
    it('has the correct function name from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.lambda.functionName,
      });
    });

    it('has the correct memory size from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.lambda.functionName,
        MemorySize: infraConfig.lambda.memoryMb,
      });
    });

    it('has the correct timeout from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.lambda.functionName,
        Timeout: infraConfig.lambda.timeoutSeconds,
      });
    });

    it('has all required environment variables', () => {
      const requiredEnvKeys = [
        'NODE_ENV',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'CORS_ORIGIN',
        'DB_SECRET_ARN',
        'APP_SECRET_ARN',
        'AWS_S3_BUCKET',
        'ATTACHMENT_PRESIGN_EXPIRY_SECONDS',
        'SESSION_EXPIRY_HOURS',
        'BCRYPT_SALT_ROUNDS',
        'MAX_LOGIN_ATTEMPTS',
        'LOGIN_RATE_LIMIT_WINDOW_MINUTES',
      ];

      const functions = appTemplate.findResources('AWS::Lambda::Function', {
        Properties: { FunctionName: infraConfig.lambda.functionName },
      });

      const fnResource = Object.values(functions)[0];
      const envVars = fnResource.Properties.Environment.Variables;

      for (const key of requiredEnvKeys) {
        expect(envVars).toHaveProperty(key);
      }
    });

    it('has NODE_ENV set to production', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.lambda.functionName,
        Environment: {
          Variables: Match.objectLike({ NODE_ENV: infraConfig.lambda.nodeEnv }),
        },
      });
    });

    it('has Bedrock InvokeModel permission', () => {
      appTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'bedrock:InvokeModel',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway', () => {
    it('includes multipart/form-data as a binary media type', () => {
      appTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
        BinaryMediaTypes: Match.arrayWith(['multipart/form-data']),
      });
    });
  });

  describe('CloudFront distribution', () => {
    it('has the /api/* behavior configured', () => {
      appTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: Match.arrayWith([Match.objectLike({ PathPattern: '/api/*' })]),
        },
      });
    });

    it('redirects HTTP to HTTPS on the default behavior', () => {
      appTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        },
      });
    });

    it('has SPA fallback error responses for 404 and 403', () => {
      appTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CustomErrorResponses: Match.arrayWith([
            Match.objectLike({ ErrorCode: 404, ResponsePagePath: '/index.html' }),
            Match.objectLike({ ErrorCode: 403, ResponsePagePath: '/index.html' }),
          ]),
        },
      });
    });

    it('uses the correct domain name from config', () => {
      appTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Aliases: Match.arrayWith([infraConfig.domain.hostname]),
        },
      });
    });
  });

  describe('S3 frontend bucket', () => {
    it('has public access blocked', () => {
      appTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: infraConfig.s3.bucketName,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('Outputs', () => {
    it('outputs CloudFrontUrl', () => {
      appTemplate.hasOutput('CloudFrontUrl', {});
    });

    it('outputs ApiGatewayUrl', () => {
      appTemplate.hasOutput('ApiGatewayUrl', {});
    });
  });
});
