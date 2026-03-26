/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Request, Response } from 'express';
import type { AuthService } from '../services/auth/auth.service.js';
import type { RBACService } from '../services/rbac/rbac.service.js';
import { validateOrThrow } from '../validators/validation-utils.js';
import { changePasswordSchema, loginSchema } from '../validators/auth.validator.js';
import type { ChangePasswordRequest, LoginRequest } from '../../shared/contracts/auth-contracts.js';
import { success, error } from '../lib/respond.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { UserId } from '../database/types/ids.js';

export class AuthController {
  private authService: AuthService;
  private rbacService: RBACService;

  constructor(authService: AuthService, rbacService: RBACService) {
    this.authService = authService;
    this.rbacService = rbacService;
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials = validateOrThrow(loginSchema, req.body) as LoginRequest;

      const result = await this.authService.login(credentials);

      success(res, result, 200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === 'AuthError') {
        error(res, err.statusCode ?? 401, err.message);
        return;
      }

      if (err.name === 'ValidationError') {
        error(res, err.statusCode ?? 400, err.message);
        return;
      }

      if (err.message.includes(':')) {
        error(res, 400, err.message);
        return;
      }

      console.error('Login error:', err);
      error(res, 500, 'Internal server error');
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      if (!token) {
        error(res, 401, 'Authentication token required');
        return;
      }

      await this.authService.logout(token);

      success(res, { message: 'Logged out successfully' }, 200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === 'AuthError') {
        error(res, err.statusCode ?? 401, err.message);
        return;
      }
      console.error('Logout error:', err);
      error(res, 500, 'Internal server error');
    }
  };

  getCurrentUser = (req: Request, res: Response): void => {
    try {
      const authReq = req as AuthenticatedRequest;

      success(res, authReq.user, 200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Get current user error:', err);
      error(res, 500, 'Internal server error');
    }
  };

  getPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      const permissions = await this.rbacService.getUserPermissions(authReq.user.id as UserId);

      success(res, { permissions }, 200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Get permissions error:', err);
      error(res, 500, 'Internal server error');
    }
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      const passwordData = validateOrThrow(changePasswordSchema, req.body) as ChangePasswordRequest;

      await this.authService.changePassword(authReq.user.id as UserId, passwordData);

      success(res, { message: 'Password changed successfully' }, 200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === 'AuthError') {
        error(res, err.statusCode ?? 401, err.message);
        return;
      }

      if (err.name === 'ValidationError') {
        error(res, err.statusCode ?? 400, err.message);
        return;
      }

      if (err.message.includes(':')) {
        error(res, 400, err.message);
        return;
      }

      console.error('Change password error:', err);
      error(res, 500, 'Internal server error');
    }
  };
}
