import { Router } from 'express';
import type { NotificationController } from '../controllers/notification.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { USER_ENDPOINTS } from '../../shared/constants/index.js';

export function createUserRoutes(
  notificationController: NotificationController,
  authService: AuthService
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(authService);

  router.get(
    USER_ENDPOINTS.MY_NOTIFICATION_PREFERENCES,
    authenticate,
    notificationController.getMyPreferences
  );

  router.put(
    USER_ENDPOINTS.MY_NOTIFICATION_PREFERENCES,
    authenticate,
    notificationController.updateMyPreferences
  );

  return router;
}
