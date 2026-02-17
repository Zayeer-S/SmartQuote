import type { NextFunction, Request, Response } from 'express';
import type { GetCurrentUserResponse } from '../../shared/contracts/auth-contracts';
import type { AuthService } from '../services/auth/auth.service';
import { error } from '../lib/respond';

export interface AuthenticatedRequest extends Request {
  user: GetCurrentUserResponse;
}

/** Type guard to check if request is authenticated */
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}

/**
 * Authentication Middleware Factory
 * Returns middleware that validates session and attaches user to request
 *
 * @param authService - Auth service instance
 * @returns Express middleware function
 */
export function createAuthMiddleware(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        error(res, 401, 'Authentication required');
        return;
      }

      // Check for Bearer token format
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        error(res, 401, 'Invalid authorization format. Expected: Bearer <token>');
        return;
      }

      const token = parts[1];

      if (!token) {
        error(res, 401, 'Authentication token is missing');
        return;
      }

      // Validate session and get user
      const user = await authService.getCurrentUser(token);

      // Attach user to request
      (req as AuthenticatedRequest).user = user;

      next();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err.name === 'AuthError') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error(res, err.statusCode ?? 401, err.message);
        return;
      }

      console.error('Authentication error:', err);
      error(res, 500, 'Internal server error during authentication');
    }
  };
}
