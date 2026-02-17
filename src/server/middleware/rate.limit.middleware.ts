/* eslint-disable @typescript-eslint/no-non-null-assertion */
import rateLimit, { type Store } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { backEnv } from '../config/env.backend.js';
import { authRateLimitConfig } from '../config/auth-config';

const redisEnvPresent =
  backEnv.REDIS_HOST !== undefined &&
  backEnv.REDIS_PORT !== undefined &&
  backEnv.REDIS_PASSWORD !== undefined;

let redisClient: ReturnType<typeof createClient> | null = null;

if (redisEnvPresent) {
  redisClient = createClient({
    socket: {
      host: backEnv.REDIS_HOST,
      port: backEnv.REDIS_PORT,
    },
    password: backEnv.REDIS_PASSWORD,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error for rate limiting:', err);
  });

  void (async () => {
    try {
      await redisClient.connect();
      console.log('Redis client connected for rate limiting');
    } catch (err) {
      console.error('Failed to connect to Redis for rate limiting:', err);
    }
  })();

  process.on('SIGTERM', () => void redisClient!.quit());
  process.on('SIGINT', () => void redisClient!.quit());
} else {
  console.warn(
    '[rate-limit] REDIS_HOST / REDIS_PORT / REDIS_PASSWORD are not set. ' +
      'Falling back to in-process MemoryStore. ' +
      'Rate limits will NOT be shared across multiple server instances.'
  );
}

function makeStore(prefix: string): Store | undefined {
  if (!redisClient) return undefined;

  return new RedisStore({
    sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
    prefix,
  });
}

/**
 * Login Rate Limiter
 */
export const loginRateLimiter = rateLimit({
  store: makeStore('rate_limit:login:'),
  windowMs: authRateLimitConfig.login.windowMs,
  max: authRateLimitConfig.login.maxAttempts,
  message: {
    success: false,
    data: null,
    error: 'Too many login attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

export const apiRateLimiter = rateLimit({
  store: makeStore('rate_limit:api:'),
  windowMs: authRateLimitConfig.api.windowMs,
  max: authRateLimitConfig.api.maxAttempts,
  message: {
    success: false,
    data: null,
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export { redisClient };
