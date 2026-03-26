import { Router } from 'express';
import type { AnalyticsController } from '../controllers/analytics.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import type { RBACService } from '../services/rbac/rbac.service.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../shared/constants/index.js';
import { ANALYTICS_ENDPOINTS } from '../../shared/constants/endpoints.js';

export function createAnalyticsRoutes(
  analyticsController: AnalyticsController,
  authService: AuthService,
  rbacService: RBACService
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(authService);

  const can = (...perms: Parameters<typeof requirePermission>[1][]) =>
    requirePermission(rbacService, ...perms);

  router.get(
    ANALYTICS_ENDPOINTS.RESOLUTION_TIME,
    authenticate,
    can(PERMISSIONS.ANALYTICS_READ),
    analyticsController.getResolutionTime
  );

  router.get(
    ANALYTICS_ENDPOINTS.TICKET_VOLUME,
    authenticate,
    can(PERMISSIONS.ANALYTICS_READ),
    analyticsController.getTicketVolume
  );

  router.get(
    ANALYTICS_ENDPOINTS.QUOTE_ACCURACY,
    authenticate,
    can(PERMISSIONS.ANALYTICS_READ),
    analyticsController.getQuoteAccuracy
  );

  return router;
}
