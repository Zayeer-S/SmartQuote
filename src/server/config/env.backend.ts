import * as dotenv from 'dotenv';
import z from 'zod';

dotenv.config({ path: '.env.local' });

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

  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_SECURE: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

/** Validated env vars */
export const backEnv = envSchema.parse(process.env);

export type BackEnv = z.infer<typeof envSchema>;
