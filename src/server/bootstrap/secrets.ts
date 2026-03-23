import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function fetchSecret(
  client: SecretsManagerClient,
  arn: string
): Promise<Record<string, string>> {
  const response = await client.send(new GetSecretValueCommand({ SecretId: arn }));

  if (!response.SecretString) {
    throw new Error(`Secret ${arn} has no SecretString value`);
  }

  return JSON.parse(response.SecretString) as Record<string, string>;
}

export async function loadSecrets(): Promise<void> {
  const dbSecretArn = process.env.DB_SECRET_ARN;
  const appSecretArn = process.env.APP_SECRET_ARN;

  if (!dbSecretArn || !appSecretArn) {
    // Not running in Lambda -- local dev uses .env.local directly
    return;
  }

  // Client gotta instantiate here only, after confirming we're in Lambda.
  // Top-level instantiation causes CredentialsProviderError in CI/local
  // because the SDK tries to resolve credentials immediately on import.
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION ?? 'eu-west-2',
  });

  const [dbSecret, appSecret] = await Promise.all([
    fetchSecret(client, dbSecretArn),
    fetchSecret(client, appSecretArn),
  ]);

  process.env.DB_USER = dbSecret.username;
  process.env.DB_PASSWORD = dbSecret.password;
  process.env.SESSION_SECRET = appSecret.SESSION_SECRET;
  process.env.JWT_SECRET = appSecret.JWT_SECRET;
  process.env.SMTP_HOST = appSecret.SMTP_HOST;
  process.env.SMTP_PORT = appSecret.SMTP_PORT;
  process.env.SMTP_SECURE = appSecret.SMTP_SECURE;
  process.env.SMTP_USER = appSecret.SMTP_USER;
  process.env.SMTP_PASSWORD = appSecret.SMTP_PASSWORD;
}
