import type { AuthConfig, AuthRateLimitConfig, PasswordConfig } from '../services/auth/index';
import { backEnv } from './env.backend';

export const passwordConfig: PasswordConfig = {
  saltRounds: backEnv.BCRYPT_SALT_ROUNDS,
  minLength: 8,
  maxLength: 8,
  requireSpecialChar: true,
  requireNumber: true,
  requireUppercase: true,
  requireLowercase: true,
  generatedPasswordLength: 8,
};

export const authRateLimitConfig: AuthRateLimitConfig = {
  login: {
    windowMs: backEnv.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    maxAttempts: backEnv.MAX_LOGIN_ATTEMPTS,
  },
  api: {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 100,
  },
};

export const authConfig: AuthConfig = {
  /** Session expiry time in hours */
  expiryHours: backEnv.SESSION_EXPIRY_HOURS,
  /** Secret for signing session tokens */
  secret: backEnv.SESSION_SECRET,
  /** How often to clean up expired sessions (in minutes) */
  cleanupIntervalMinutes: 60,
  /** Session token length in bytes (before base64 encoding) */
  tokenBytes: 32,
} as const;
