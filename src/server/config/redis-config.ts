import type { RedisClientOptions } from 'redis';
import { backEnv } from './env.backend';

const baseConfig: RedisClientOptions = {
  socket: {
    host: backEnv.REDIS_HOST,
    port: backEnv.REDIS_PORT,
    reconnectStrategy: (retries: number) => {
      // Exponential backoff with max 3 seconds
      const delay = Math.min(retries * 50, 3000);
      console.log(`Redis reconnecting in ${String(delay)}ms (attempt ${String(retries)})`);
      return delay;
    },
  },
  password: backEnv.REDIS_PASSWORD,
};

const developmentConfig: RedisClientOptions = {
  ...baseConfig,
  // No password required for local development on purpose
  password: backEnv.REDIS_PASSWORD ?? undefined,
};

const testConfig: RedisClientOptions = {
  ...baseConfig,
  password: backEnv.REDIS_PASSWORD ?? undefined,
  // Use different database for tests
  database: 1,
};

const stagingConfig: RedisClientOptions = {
  ...baseConfig,
  socket: {
    ...baseConfig.socket,
    tls: true,
  },
};

const productionConfig: RedisClientOptions = {
  ...baseConfig,
  socket: {
    ...baseConfig.socket,
    tls: true,
  },
};

export const redisConfig: Record<string, RedisClientOptions> = {
  development: developmentConfig,
  test: testConfig,
  staging: stagingConfig,
  production: productionConfig,
};

export function getRedisConfig(environment?: string): RedisClientOptions {
  const targetEnv = environment ?? backEnv.NODE_ENV;
  const envConfig = redisConfig[targetEnv];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!envConfig) throw new Error(`No Redis configuration found for environment: ${targetEnv}`);

  return envConfig;
}

export default redisConfig;
