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
import * as iam from 'aws-cdk-lib/aws-iam';
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

    const appSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'AppSecret',
      'smartquote/app-secrets'
    );

    const lambdaSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'LambdaSg',
      cdk.Fn.importValue('LambdaSecurityGroupId')
    );

    const apiFunction = new lambdaNodejs.NodejsFunction(this, 'ApiFunction', {
      functionName: infraConfig.lambda.functionName,
      entry: path.join(__dirname, '../../', infraConfig.lambda.entryPoint),
      handler: infraConfig.lambda.handler,
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: infraConfig.lambda.memoryMb,
      timeout: cdk.Duration.seconds(infraConfig.lambda.timeoutSeconds),
      vpc: databaseStack.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      bundling: {
        target: 'node22',
        format: OutputFormat.ESM,
        banner:
          'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
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
        DB_SECRET_ARN: databaseStack.dbSecret.secretArn,
        APP_SECRET_ARN: appSecret.secretArn,
        // Storage - credentials are intentionally omitted; Lambda uses its execution role. AWS_REGION is needed by the S3 client constructor.
        AWS_REGION: infraConfig.region,
        AWS_S3_BUCKET: infraConfig.attachments.bucketName,
      },
    });

    databaseStack.dbSecret.grantRead(apiFunction);
    appSecret.grantRead(apiFunction);

    // Import the pre-existing attachments bucket - CDK references it for IAM grants only. Ownership and lifecycle remain outside CDK.
    const attachmentsBucket = s3.Bucket.fromBucketName(
      this,
      'AttachmentsBucket',
      infraConfig.attachments.bucketName
    );
    attachmentsBucket.grantReadWrite(apiFunction);

    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`,
        ],
      })
    );

    // Invoked manually via AWS CLI when migrations need to run.
    // Lives in the same VPC as RDS so it can reach the private DB endpoint.
    const migrateFunction = new lambdaNodejs.NodejsFunction(this, 'MigrateFunction', {
      functionName: 'smartquote-migrate',
      entry: path.join(__dirname, '../../', 'src/server/bootstrap/lambda.migrate.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: cdk.Duration.minutes(5),
      vpc: databaseStack.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      bundling: {
        target: 'node22',
        format: OutputFormat.ESM,
        banner:
          'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
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
          afterBundling: (inputDir: string, outputDir: string) => [
            `cp -r ${inputDir}/../dist-db/server/database/migrations ${outputDir}/migrations`,
          ],
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

    // Invoked manually via AWS CLI to populate the database with seed data.
    const seedFunction = new lambdaNodejs.NodejsFunction(this, 'SeedFunction', {
      functionName: 'smartquote-seed',
      entry: path.join(__dirname, '../../', 'src/server/bootstrap/lambda.seed.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: cdk.Duration.minutes(5),
      vpc: databaseStack.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      bundling: {
        target: 'node22',
        format: OutputFormat.ESM,
        banner:
          'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
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
          afterBundling: (inputDir: string, outputDir: string) => [
            `mkdir -p ${outputDir}/server/database`,
            `cp -r ${inputDir}/../dist-db/server/database/seeds ${outputDir}/server/database/seeds`,
            `cp -r ${inputDir}/../dist-db/shared ${outputDir}/shared`,
            `echo '{"type":"module"}' > ${outputDir}/server/database/seeds/package.json`,
            `echo '{"type":"module","exports":{".":" ./index.js"}}' > ${outputDir}/shared/constants/package.json`,
          ],
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

    databaseStack.dbSecret.grantRead(seedFunction);
    appSecret.grantRead(seedFunction);

    new cdk.CfnOutput(this, 'SeedFunctionName', {
      value: seedFunction.functionName,
      description:
        'Invoke this Lambda to seed the database: aws lambda invoke --function-name smartquote-seed --region eu-west-2 response.json',
    });

    const api = new apigateway.LambdaRestApi(this, 'ApiGateway', {
      handler: apiFunction,
      proxy: true,
      deployOptions: { stageName: 'prod' },
      // multipart/form-data must be listed here so API Gateway treats upload
      // bodies as binary and passes them through to Lambda intact.
      binaryMediaTypes: ['multipart/form-data'],
      defaultCorsPreflightOptions: {
        allowOrigins: [infraConfig.cors.origin],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    api.addGatewayResponse('Default4xx', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': `'${infraConfig.cors.origin}'`,
        'Access-Control-Allow-Headers': "'*'",
      },
    });

    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: infraConfig.s3.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

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

    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../', infraConfig.s3.assetsPath))],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${infraConfig.domain.hostname}`,
      description: 'Frontend URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: 'Add this as a CNAME in Cloudflare pointing to smartquote.zayeer.dev',
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
