import * as dotenv from 'dotenv';
import z from 'zod';

dotenv.config({ path: '.env.local' });

const optionalStr = z
  .string()
  .optional()
  .transform((val) => (val === '' ? undefined : val));

const optionalNum = z
  .string()
  .optional()
  .transform((val) => (val === '' || val === undefined ? undefined : Number(val)));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),

  PORT: z.string().transform(Number),
  HOST: z.string(),

  DB_HOST: z.string(),
  DB_PORT: z.string().transform(Number),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),

  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  SESSION_EXPIRY_HOURS: z.string().transform(Number),
  BCRYPT_SALT_ROUNDS: z.string().transform(Number),
  MAX_LOGIN_ATTEMPTS: z.string().transform(Number),
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.string().transform(Number),

  JWT_SECRET: z.string(),

  CORS_ORIGIN: z.string(),

  AWS_REGION: optionalStr,
  AWS_ACCESS_KEY_ID: optionalStr,
  AWS_SECRET_ACCESS_KEY: optionalStr,
  AWS_S3_BUCKET: optionalStr,

  REDIS_HOST: optionalStr,
  REDIS_PORT: optionalNum,
  REDIS_PASSWORD: optionalStr,

  SMTP_HOST: optionalStr,
  SMTP_PORT: optionalNum,
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : val === 'true')),
  SMTP_USER: optionalStr,
  SMTP_PASSWORD: optionalStr,
});

/** Validated env vars */
export const backEnv = envSchema.parse(process.env);

export type BackEnv = z.infer<typeof envSchema>;
