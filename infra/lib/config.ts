export const infraConfig = {
  account: '149195855178',
  region: 'eu-west-2',

  domain: {
    hostname: 'smartquote.zayeer.dev',
    wsHostname: 'ws.smartquote.zayeer.dev',
  },

  cors: {
    origin: 'https://smartquote.zayeer.dev',
  },

  db: {
    instanceIdentifier: 'smartquote-db',
    databaseName: 'smartquote',
    port: 5432,
    instanceType: 'T3_MICRO',
    allocatedStorageGb: 20,
    backupRetentionDays: 1,
    deletionProtection: true,
    /** Secret name in Secrets Manager - holds username + password */
    secretName: 'smartquote/db-credentials',
  },

  lambda: {
    functionName: 'smartquote-api',
    /** Path to server entry point, relative to repo root */
    entryPoint: 'src/server/bootstrap/lambda.handler.ts',
    handler: 'handler',
    memoryMb: 1024,
    timeoutSeconds: 29, // API Gateway hard limit is 30s
    nodeEnv: 'production',
    // Non-secret config - injected directly as env vars, not stored in Secrets Manager
    sessionExpiryHours: '168',
    bcryptSaltRounds: '12',
    maxLoginAttempts: '10',
    loginRateLimitWindowMinutes: '1',
    port: '3000',
    host: '0.0.0.0',
  },

  mlLambda: {
    functionName: 'smartquote-ml-quote',
    ecrRepoName: 'smartquote-ml-quote',
    imageTag: 'latest',
    memoryMb: 1024,
    timeoutSeconds: 29,
    /** Path inside the container where model artifacts are mounted */
    modelDir: '/opt/ml',
  },

  embedderLambda: {
    functionName: 'smartquote-embedder',
    ecrRepoName: 'smartquote-embedder',
    imageTag: 'latest',
    memoryMb: 512,
    timeoutSeconds: 29,
  },

  wsServer: {
    ecrRepoName: 'smartquote-ws',
    imageTag: 'latest',
    cpu: 256,
    memoryMb: 512,
    containerPort: 3001,
    desiredCount: 1,
    albIdleTimeoutSeconds: 120,
  },

  s3: {
    bucketName: 'smartquote-frontend',
    /** Path to built frontend assets, relative to repo root */
    assetsPath: 'dist',
  },

  attachments: {
    bucketName: 'smartquote-attachments',
    /** Presigned upload URL TTL in seconds. Browser must PUT within this window. */
    presignExpirySeconds: 300,
  },

  cloudfront: {
    comment: 'SmartQuote CDN',
    defaultRootObject: 'index.html',
    staticAssetsTtlSeconds: 31536000,
    htmlTtlSeconds: 0,
  },

  tags: {
    Project: 'SmartQuote',
    Environment: 'production',
  },
} as const;
