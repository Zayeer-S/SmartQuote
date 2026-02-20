import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION ?? 'eu-west-2',
});

async function fetchSecret(arn: string): Promise<Record<string, string>> {
  const response = await client.send(new GetSecretValueCommand({ SecretId: arn }));

  if (!response.SecretString) {
    throw new Error(`Secret ${arn} has no SecretString value`);
  }

  return JSON.parse(response.SecretString) as Record<string, string>;
}

/**
 * Fetches all required secrets from Secrets Manager and injects them into
 * process.env so that env.backend.ts can parse them synchronously at import time.
 *
 * Must be called before any server config module is imported.
 * Only runs when both ARN env vars are present (i.e. in Lambda — not local dev).
 */
export async function loadSecrets(): Promise<void> {
  const dbSecretArn = process.env.DB_SECRET_ARN;
  const appSecretArn = process.env.APP_SECRET_ARN;

  if (!dbSecretArn || !appSecretArn) {
    // Not running in Lambda — local dev uses .env.local directly
    return;
  }

  const [dbSecret, appSecret] = await Promise.all([
    fetchSecret(dbSecretArn),
    fetchSecret(appSecretArn),
  ]);

  // DB credentials — RDS secret uses 'username' key, backEnv expects DB_USER
  process.env.DB_USER = dbSecret.username;
  process.env.DB_PASSWORD = dbSecret.password;

  // App secrets
  process.env.SESSION_SECRET = appSecret.SESSION_SECRET;
  process.env.JWT_SECRET = appSecret.JWT_SECRET;
  process.env.SMTP_HOST = appSecret.SMTP_HOST;
  process.env.SMTP_PORT = appSecret.SMTP_PORT;
  process.env.SMTP_SECURE = appSecret.SMTP_SECURE;
  process.env.SMTP_USER = appSecret.SMTP_USER;
  process.env.SMTP_PASSWORD = appSecret.SMTP_PASSWORD;
}
