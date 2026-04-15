import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
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

    // -------------------------------------------------------------------------
    // ML Lambda
    // -------------------------------------------------------------------------

    const mlEcrRepo = ecr.Repository.fromRepositoryName(
      this,
      'MlQuoteEcrRepo',
      infraConfig.mlLambda.ecrRepoName
    );

    const mlFunction = new lambda.DockerImageFunction(this, 'MlQuoteFunction', {
      functionName: infraConfig.mlLambda.functionName,
      code: lambda.DockerImageCode.fromEcr(mlEcrRepo, {
        tagOrDigest: infraConfig.mlLambda.imageTag,
      }),
      memorySize: infraConfig.mlLambda.memoryMb,
      timeout: cdk.Duration.seconds(infraConfig.mlLambda.timeoutSeconds),
      vpc: databaseStack.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        MODEL_DIR: infraConfig.mlLambda.modelDir,
      },
    });

    new cdk.CfnOutput(this, 'MlQuoteFunctionName', {
      value: mlFunction.functionName,
      description:
        'ML quote Lambda -- invoke manually to smoke test: aws lambda invoke --function-name smartquote-ml-quote --region eu-west-2 --payload ... response.json',
    });

    const mlFunctionUrl = mlFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: { allowedOrigins: ['*'] },
    });

    new cdk.CfnOutput(this, 'MlQuoteFunctionUrl', {
      value: mlFunctionUrl.url,
      description: 'ML quote service Function URL -- set as ML_QUOTE_SERVICE_URL in API Lambda env',
    });

    // Embedder Lambda (all-MiniLM-L6-v2)
    const embedderEcrRepo = ecr.Repository.fromRepositoryName(
      this,
      'EmbedderEcrRepo',
      infraConfig.embedderLambda.ecrRepoName
    );

    const embedderFunction = new lambda.DockerImageFunction(this, 'EmbedderFunction', {
      functionName: infraConfig.embedderLambda.functionName,
      code: lambda.DockerImageCode.fromEcr(embedderEcrRepo, {
        tagOrDigest: infraConfig.embedderLambda.imageTag,
      }),
      memorySize: infraConfig.embedderLambda.memoryMb,
      timeout: cdk.Duration.seconds(infraConfig.embedderLambda.timeoutSeconds),
      vpc: databaseStack.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
    });

    // Function URL so the API Lambda (and local dev) can call it over plain HTTPS
    // with no AWS SDK / SigV4 required. Auth is NONE -- the function is only
    // reachable from within the VPC via the Lambda interface endpoint.
    const embedderFunctionUrl = embedderFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: { allowedOrigins: ['*'] },
    });

    new cdk.CfnOutput(this, 'EmbedderFunctionUrl', {
      value: embedderFunctionUrl.url,
      description:
        'Embedding service Function URL -- set as EMBEDDING_SERVICE_URL in API Lambda env',
    });

    // API Lambda (Node.js zip)
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
        AWS_S3_BUCKET: infraConfig.attachments.bucketName,
        ATTACHMENT_PRESIGN_EXPIRY_SECONDS: String(infraConfig.attachments.presignExpirySeconds),
        ML_QUOTE_SERVICE_URL: mlFunctionUrl.url,
        EMBEDDING_SERVICE_URL: embedderFunctionUrl.url,
      },
    });

    databaseStack.dbSecret.grantRead(apiFunction);
    appSecret.grantRead(apiFunction);

    const attachmentsBucket = s3.Bucket.fromBucketName(
      this,
      'AttachmentsBucket',
      infraConfig.attachments.bucketName
    );
    attachmentsBucket.grantReadWrite(apiFunction);

    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      })
    );

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
            `cp ${inputDir}/../dist-db/server/database/migration.utils.js ${outputDir}/migration.utils.js`,
            `echo '{"type":"module"}' > ${outputDir}/migrations/package.json`,
            `echo '{"type":"module"}' > ${outputDir}/package.json`,
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

    // Security group for the ALB - accepts HTTPS from anywhere
    const albSecurityGroup = new ec2.SecurityGroup(this, 'WsAlbSg', {
      vpc: databaseStack.vpc,
      description: 'WS ALB - accepts HTTPS/WSS from internet',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS/WSS from internet'
    );

    // Security group for the Fargate task - only accepts traffic from the ALB
    const wsTaskSecurityGroup = new ec2.SecurityGroup(this, 'WsTaskSg', {
      vpc: databaseStack.vpc,
      description: 'WS Fargate task - accepts traffic from ALB only',
      allowAllOutbound: true,
    });

    wsTaskSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(infraConfig.wsServer.containerPort),
      'WS traffic from ALB'
    );

    // Allow ALB to reach the task
    albSecurityGroup.addEgressRule(
      wsTaskSecurityGroup,
      ec2.Port.tcp(infraConfig.wsServer.containerPort),
      'Forward to WS task'
    );

    const wsEcrRepo = ecr.Repository.fromRepositoryName(
      this,
      'WsEcrRepo',
      infraConfig.wsServer.ecrRepoName
    );

    const cluster = new ecs.Cluster(this, 'WsCluster', {
      vpc: databaseStack.vpc,
      clusterName: 'smartquote-ws',
    });

    const wsLogGroup = new logs.LogGroup(this, 'WsLogGroup', {
      logGroupName: '/ecs/smartquote-ws',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const wsExecutionRole = new iam.Role(this, 'WsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    wsExecutionRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:BatchCheckLayerAvailability',
          // ecr:GetAuthorizationToken is account-level, cannot scope to repo ARN
          'ecr:GetAuthorizationToken',
        ],
        resources: ['*'],
      })
    );

    const wsTaskDef = new ecs.FargateTaskDefinition(this, 'WsTaskDef', {
      cpu: infraConfig.wsServer.cpu,
      memoryLimitMiB: infraConfig.wsServer.memoryMb,
      executionRole: wsExecutionRole,
    });

    appSecret.grantRead(wsTaskDef.taskRole);
    databaseStack.dbSecret.grantRead(wsTaskDef.taskRole);

    wsTaskDef.addContainer('WsContainer', {
      image: ecs.ContainerImage.fromEcrRepository(wsEcrRepo, infraConfig.wsServer.imageTag),
      portMappings: [{ containerPort: infraConfig.wsServer.containerPort }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ws',
        logGroup: wsLogGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: String(infraConfig.wsServer.containerPort),
        HOST: '0.0.0.0',
        DB_HOST: databaseStack.dbEndpoint,
        DB_PORT: String(infraConfig.db.port),
        DB_NAME: infraConfig.db.databaseName,
        CORS_ORIGIN: infraConfig.cors.origin,
      },
      secrets: {
        // Pulls individual keys from Secrets Manager at task start
        DB_SECRET_ARN: ecs.Secret.fromSecretsManager(databaseStack.dbSecret),
        APP_SECRET_ARN: ecs.Secret.fromSecretsManager(appSecret),
      },
    });

    const wsService = new ecs.FargateService(this, 'WsService', {
      cluster,
      taskDefinition: wsTaskDef,
      desiredCount: infraConfig.wsServer.desiredCount,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [wsTaskSecurityGroup, lambdaSecurityGroup],
      assignPublicIp: false,
    });

    // ALB - internet-facing, lives in public subnets
    const wsAlb = new elbv2.ApplicationLoadBalancer(this, 'WsAlb', {
      vpc: databaseStack.vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: albSecurityGroup,
      idleTimeout: cdk.Duration.seconds(infraConfig.wsServer.albIdleTimeoutSeconds),
      loadBalancerName: 'smartquote-ws',
    });

    const wsTargetGroup = new elbv2.ApplicationTargetGroup(this, 'WsTargetGroup', {
      vpc: databaseStack.vpc,
      port: infraConfig.wsServer.containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      // WebSocket connections are long-lived - set a generous deregistration delay
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    wsTargetGroup.addTarget(wsService);

    // HTTPS listener - terminates TLS, forwards to task over plain HTTP inside VPC
    wsAlb.addListener('WsHttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificateStack.certificate],
      defaultTargetGroups: [wsTargetGroup],
    });

    new cdk.CfnOutput(this, 'WsAlbDnsName', {
      value: wsAlb.loadBalancerDnsName,
      description: 'Add this as a CNAME in Cloudflare pointing to ws.smartquote.zayeer.dev',
    });

    new cdk.CfnOutput(this, 'WsClusterName', {
      value: cluster.clusterName,
      description: 'ECS cluster name for the WS Fargate service',
    });

    new cdk.CfnOutput(this, 'WsServiceName', {
      value: wsService.serviceName,
      description: 'ECS service name - use to force new deployments via CLI',
    });

    // -------------------------------------------------------------------------
    // CloudFront + frontend S3 bucket (unchanged)
    // -------------------------------------------------------------------------

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
