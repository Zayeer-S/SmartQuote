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
    certTemplate: Template.fromStack(certificateStack),
  };
}

describe('CertificateStack', () => {
  let certTemplate: Template;

  beforeAll(() => {
    ({ certTemplate } = buildStacks());
  });

  it('includes the ws subdomain as a SAN', () => {
    certTemplate.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: infraConfig.domain.hostname,
      SubjectAlternativeNames: Match.arrayWith([infraConfig.domain.wsHostname]),
    });
  });

  it('uses DNS validation', () => {
    certTemplate.hasResourceProperties('AWS::CertificateManager::Certificate', {
      ValidationMethod: 'DNS',
    });
  });
});

describe('DatabaseStack', () => {
  let dbTemplate: Template;

  beforeAll(() => {
    ({ dbTemplate } = buildStacks());
  });

  describe('VPC endpoints', () => {
    it('has exactly 4 VPC endpoints (S3 gateway, Secrets Manager interface, Lambda interface, Simple Email Service interface)', () => {
      dbTemplate.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
    });

    it('has an S3 gateway endpoint', () => {
      dbTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([Match.arrayWith([Match.stringLikeRegexp('s3')])]),
        }),
      });
    });

    it('has a Secrets Manager interface endpoint', () => {
      dbTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: Match.stringLikeRegexp('secretsmanager'),
      });
    });

    it('has a Lambda interface endpoint', () => {
      dbTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: Match.stringLikeRegexp('lambda'),
      });
    });

    it('has a Simple Email Service interface endpoint', () => {
      dbTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: Match.stringLikeRegexp('email-smtp'),
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

  describe('ML Lambda', () => {
    it('has the correct function name from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.mlLambda.functionName,
      });
    });

    it('has the correct memory size from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.mlLambda.functionName,
        MemorySize: infraConfig.mlLambda.memoryMb,
      });
    });

    it('has the correct timeout from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.mlLambda.functionName,
        Timeout: infraConfig.mlLambda.timeoutSeconds,
      });
    });

    it('has MODEL_DIR environment variable set from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.mlLambda.functionName,
        Environment: {
          Variables: Match.objectLike({ MODEL_DIR: infraConfig.mlLambda.modelDir }),
        },
      });
    });

    it('has a Function URL with auth type NONE', () => {
      appTemplate.resourceCountIs('AWS::Lambda::Url', 2);
    });
  });

  describe('Embedder Lambda', () => {
    it('has the correct function name from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.embedderLambda.functionName,
      });
    });

    it('has the correct memory size from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.embedderLambda.functionName,
        MemorySize: infraConfig.embedderLambda.memoryMb,
      });
    });

    it('has the correct timeout from config', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: infraConfig.embedderLambda.functionName,
        Timeout: infraConfig.embedderLambda.timeoutSeconds,
      });
    });

    it('has a Function URL with auth type NONE', () => {
      appTemplate.hasResourceProperties('AWS::Lambda::Url', {
        AuthType: 'NONE',
      });
    });
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
        'ML_QUOTE_SERVICE_URL',
        'EMBEDDING_SERVICE_URL',
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

    it('has ML_QUOTE_SERVICE_URL set', () => {
      const functions = appTemplate.findResources('AWS::Lambda::Function', {
        Properties: { FunctionName: infraConfig.lambda.functionName },
      });
      const fnResource = Object.values(functions)[0];
      const envVars = fnResource.Properties.Environment.Variables;
      expect(envVars).toHaveProperty('ML_QUOTE_SERVICE_URL');
      expect(envVars['ML_QUOTE_SERVICE_URL']).toBeTruthy();
    });
  });

  describe('API Gateway', () => {
    it('includes multipart/form-data as a binary media type', () => {
      appTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
        BinaryMediaTypes: Match.arrayWith(['multipart/form-data']),
      });
    });
  });

  describe('WS Fargate service', () => {
    it('creates an ECS cluster named smartquote-ws', () => {
      appTemplate.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'smartquote-ws',
      });
    });

    it('task definition has the correct cpu and memory from config', () => {
      appTemplate.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: String(infraConfig.wsServer.cpu),
        Memory: String(infraConfig.wsServer.memoryMb),
      });
    });

    it('task definition container exposes the correct port from config', () => {
      appTemplate.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            PortMappings: Match.arrayWith([
              Match.objectLike({ ContainerPort: infraConfig.wsServer.containerPort }),
            ]),
          }),
        ]),
      });
    });

    it('Fargate service has the correct desired count from config', () => {
      appTemplate.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: infraConfig.wsServer.desiredCount,
        LaunchType: 'FARGATE',
      });
    });

    it('Fargate service does not assign a public IP (private isolated)', () => {
      appTemplate.hasResourceProperties('AWS::ECS::Service', {
        NetworkConfiguration: Match.objectLike({
          AwsvpcConfiguration: Match.objectLike({
            AssignPublicIp: 'DISABLED',
          }),
        }),
      });
    });

    it('ALB is internet-facing', () => {
      appTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Name: 'smartquote-ws',
      });
    });

    it('HTTPS listener is on port 443', () => {
      appTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS',
      });
    });

    it('target group health check hits /health', () => {
      appTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/health',
        TargetType: 'ip',
      });
    });

    it('ALB security group accepts inbound HTTPS from anywhere', () => {
      appTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'WS ALB - accepts HTTPS/WSS from internet',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    it('task security group only accepts inbound from the ALB on the container port', () => {
      appTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'WS Fargate task - accepts traffic from ALB only',
      });
    });

    it('has ECR API VPC endpoint', () => {
      appTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: Match.stringLikeRegexp('ecr\\.api'),
      });
    });

    it('has ECR DKR VPC endpoint', () => {
      appTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: Match.stringLikeRegexp('ecr\\.dkr'),
      });
    });

    it('has CloudWatch Logs VPC endpoint', () => {
      appTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: Match.stringLikeRegexp('logs'),
      });
    });

    it('log group has one week retention', () => {
      appTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/smartquote-ws',
        RetentionInDays: 7,
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

    it('outputs MlQuoteFunctionName', () => {
      appTemplate.hasOutput('MlQuoteFunctionName', {});
    });

    it('outputs EmbedderFunctionUrl', () => {
      appTemplate.hasOutput('EmbedderFunctionUrl', {});
    });

    it('outputs MlQuoteFunctionUrl', () => {
      appTemplate.hasOutput('MlQuoteFunctionUrl', {});
    });

    it('outputs WsAlbDnsName', () => {
      appTemplate.hasOutput('WsAlbDnsName', {});
    });

    it('outputs WsClusterName', () => {
      appTemplate.hasOutput('WsClusterName', {});
    });

    it('outputs WsServiceName', () => {
      appTemplate.hasOutput('WsServiceName', {});
    });
  });
});
