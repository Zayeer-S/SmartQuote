/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import z from 'zod';

const envSchema = z.object({
  VITE_APP_URL: z.url(),
  VITE_FRONTEND_URL: z.url(),
  VITE_WS_URL: z.string().min(1),
});

const rawSchema = {
  VITE_APP_URL: import.meta.env.VITE_APP_URL,
  VITE_FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
};

export const frontEnv = envSchema.parse(rawSchema);

export type FrontEnv = z.infer<typeof envSchema>;
