import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller';
import type { AuthService } from '../services/auth/auth.service';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { loginRateLimiter } from '../middleware/rate.limit.middleware';

export function createAuthRoutes(authController: AuthController, authService: AuthService): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(authService);

  router.post('/login', loginRateLimiter, authController.login);

  router.post('/logout', authenticate, authController.logout);

  router.get('/me', authenticate, authController.getCurrentUser);

  router.post('/change-password', authenticate, authController.changePassword);

  return router;
}
