import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { loginRateLimiter } from '../middleware/rate.limit.middleware.js';
import { AUTH_ENDPOINTS } from '../../shared/constants';

export function createAuthRoutes(authController: AuthController, authService: AuthService): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(authService);

  router.post(AUTH_ENDPOINTS.LOGIN, loginRateLimiter, authController.login);

  router.post(AUTH_ENDPOINTS.LOGOUT, authenticate, authController.logout);

  router.get(AUTH_ENDPOINTS.ME, authenticate, authController.getCurrentUser);

  router.get(AUTH_ENDPOINTS.PERMISSIONS, authenticate, authController.getPermissions);

  router.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, authenticate, authController.changePassword);

  return router;
}
