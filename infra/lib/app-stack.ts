import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as path from 'path';
import { Construct } from 'constructs';
import { infraConfig } from './config';
import { DatabaseStack } from './database-stack';
import { CertificateStack } from './certificate-stack';

interface AppStackProps extends cdk.StackProps {
  databaseStack: DatabaseStack;
  certificateStack: CertificateStack;
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const { databaseStack, certificateStack } = props;

    // ── Secrets ────────────────────────────────────────────────────────────
    // Must be created manually in Secrets Manager before first deploy.
    // See docs/TEAM_GUIDE.md for setup instructions.
    const appSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'AppSecret',
      'smartquote/app-secrets'
    );

    // ── Lambda security group ──────────────────────────────────────────────
    const lambdaSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'LambdaSg',
      cdk.Fn.importValue('LambdaSecurityGroupId')
    );

    // ── Lambda function ────────────────────────────────────────────────────
    const apiFunction = new lambdaNodejs.NodejsFunction(this, 'ApiFunction', {
      functionName: infraConfig.lambda.functionName,
      entry: path.join(__dirname, '../../', infraConfig.lambda.entryPoint),
      handler: infraConfig.lambda.handler,
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: infraConfig.lambda.memoryMb,
      timeout: cdk.Duration.seconds(infraConfig.lambda.timeoutSeconds),
      vpc: databaseStack.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [lambdaSecurityGroup],
      allowPublicSubnet: true,
      bundling: {
        target: 'node22',
        format: OutputFormat.ESM,
        externalModules: [
          'pg-native',
          'better-sqlite3',
          'mysql',
          'mysql2',
          'sqlite3',
          'pg-query-stream',
          'oracledb',
          'tedious',
        ],
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_ENV: infraConfig.lambda.nodeEnv,
        PORT: infraConfig.lambda.port,
        HOST: String(infraConfig.lambda.host),
        DB_HOST: databaseStack.dbEndpoint,
        DB_PORT: String(infraConfig.db.port),
        DB_NAME: infraConfig.db.databaseName,
        CORS_ORIGIN: infraConfig.cors.origin,
        SESSION_EXPIRY_HOURS: infraConfig.lambda.sessionExpiryHours,
        BCRYPT_SALT_ROUNDS: infraConfig.lambda.bcryptSaltRounds,
        MAX_LOGIN_ATTEMPTS: infraConfig.lambda.maxLoginAttempts,
        LOGIN_RATE_LIMIT_WINDOW_MINUTES: infraConfig.lambda.loginRateLimitWindowMinutes,
        // Secret ARNs — actual values fetched at runtime by secrets.ts
        DB_SECRET_ARN: databaseStack.dbSecret.secretArn,
        APP_SECRET_ARN: appSecret.secretArn,
      },
    });

    databaseStack.dbSecret.grantRead(apiFunction);
    appSecret.grantRead(apiFunction);

    // ── Migration Lambda ───────────────────────────────────────────────────
    // Invoked manually via AWS CLI when migrations need to run.
    // Lives in the same VPC as RDS so it can reach the private DB endpoint.
    const migrationsSourceDir = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'server',
      'database',
      'migrations'
    );

    const migrateFunction = new lambdaNodejs.NodejsFunction(this, 'MigrateFunction', {
      functionName: 'smartquote-migrate',
      entry: path.join(__dirname, '../../', 'src/server/bootstrap/lambda.migrate.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: cdk.Duration.minutes(5),
      vpc: databaseStack.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [lambdaSecurityGroup],
      allowPublicSubnet: true,
      bundling: {
        target: 'node22',
        format: OutputFormat.ESM,
        externalModules: [
          'pg-native',
          'better-sqlite3',
          'mysql',
          'mysql2',
          'sqlite3',
          'pg-query-stream',
          'oracledb',
          'tedious',
        ],
        minify: true,
        sourceMap: true,
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_inputDir: string, outputDir: string) => {
            // JSON.stringify produces properly escaped path strings that survive
            // shell interpolation on both Windows (backslashes) and Unix.
            const src = JSON.stringify(migrationsSourceDir);
            const dest = JSON.stringify(path.join(outputDir, 'migrations'));
            return [`node -e "require('fs').cpSync(${src},${dest},{recursive:true})"`];
          },
        },
      },
      environment: {
        NODE_ENV: infraConfig.lambda.nodeEnv,
        DB_HOST: databaseStack.dbEndpoint,
        DB_PORT: String(infraConfig.db.port),
        DB_NAME: infraConfig.db.databaseName,
        DB_SECRET_ARN: databaseStack.dbSecret.secretArn,
        APP_SECRET_ARN: appSecret.secretArn,
      },
    });

    databaseStack.dbSecret.grantRead(migrateFunction);
    appSecret.grantRead(migrateFunction);

    new cdk.CfnOutput(this, 'MigrateFunctionName', {
      value: migrateFunction.functionName,
      description:
        'Invoke this Lambda to run DB migrations: aws lambda invoke --function-name smartquote-migrate --region eu-west-2 response.json',
    });

    // ── API Gateway ────────────────────────────────────────────────────────
    const api = new apigateway.LambdaRestApi(this, 'ApiGateway', {
      handler: apiFunction,
      proxy: true,
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: [infraConfig.cors.origin],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // ── S3 bucket (frontend) ───────────────────────────────────────────────
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: infraConfig.s3.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // ── CloudFront ─────────────────────────────────────────────────────────
    const distribution = new cloudfront.Distribution(this, 'CfDistribution', {
      comment: infraConfig.cloudfront.comment,
      defaultRootObject: infraConfig.cloudfront.defaultRootObject,
      domainNames: [infraConfig.domain.hostname],
      certificate: certificateStack.certificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(
            `${api.restApiId}.execute-api.${this.region}.amazonaws.com`,
            { originPath: '/prod' }
          ),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
    });

    // ── Deploy frontend assets to S3 ───────────────────────────────────────
    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../', infraConfig.s3.assetsPath))],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // ── Outputs ────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${infraConfig.domain.hostname}`,
      description: 'Frontend URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: 'Add this as a CNAME in Cloudflare pointing to giacom.zayeer.dev',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL (proxied via CloudFront at /api/*)',
    });

    Object.entries(infraConfig.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
