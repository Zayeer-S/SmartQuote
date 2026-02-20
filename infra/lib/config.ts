export const infraConfig = {
  account: '149195855178',
  region: 'eu-west-2',

  domain: {
    hostname: 'giacom.zayeer.dev',
    // After first deploy, add a CNAME in Cloudflare:
    // giacom.zayeer.dev -> <distribution>.cloudfront.net
  },

  cors: {
    origin: 'https://giacom.zayeer.dev',
  },

  db: {
    instanceIdentifier: 'smartquote-db',
    databaseName: 'smartquote',
    port: 5432,
    instanceType: 'T3_MICRO',
    allocatedStorageGb: 20,
    backupRetentionDays: 7,
    deletionProtection: true,
    /** Secret name in Secrets Manager — holds username + password */
    secretName: 'smartquote/db-credentials',
  },

  lambda: {
    functionName: 'smartquote-api',
    /** Path to server entry point, relative to repo root */
    entryPoint: 'src/server/bootstrap/lambda.handler.ts',
    handler: 'handler',
    memoryMb: 512,
    timeoutSeconds: 29, // API Gateway hard limit is 30s
    nodeEnv: 'production',
    // Non-secret config — injected directly as env vars, not stored in Secrets Manager
    sessionExpiryHours: '168',
    bcryptSaltRounds: '12',
    maxLoginAttempts: '10',
    loginRateLimitWindowMinutes: '1',
    port: '3000',
    host: '0.0.0.0',
  },

  s3: {
    bucketName: 'smartquote-frontend',
    /** Path to built frontend assets, relative to repo root */
    assetsPath: 'dist',
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
