import rateLimit from 'express-rate-limit';
import { type NextFunction, type Request, type Response } from 'express';
import { authRateLimitConfig } from '../config/auth-config.js';

function makeRateLimiter(options: Parameters<typeof rateLimit>[0]) {
  if (authRateLimitConfig.disabled)
    return (_req: Request, _res: Response, next: NextFunction) => {
      next();
    };
  return rateLimit(options);
}

export const loginRateLimiter = makeRateLimiter({
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
