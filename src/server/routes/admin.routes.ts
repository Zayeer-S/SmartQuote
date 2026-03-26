import { Router } from 'express';
import type { AdminController } from '../controllers/admin.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import type { RBACService } from '../services/rbac/rbac.service.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { ADMIN_ENDPOINTS, PERMISSIONS } from '../../shared/constants';

export function createAdminRoutes(
  adminController: AdminController,
  authService: AuthService,
  rbacService: RBACService
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(authService);

  router.post(
    ADMIN_ENDPOINTS.USERS,
    authenticate,
    requirePermission(rbacService, PERMISSIONS.USERS_CREATE),
    adminController.createUser
  );

  router.get(
    ADMIN_ENDPOINTS.USERS,
    authenticate,
    requirePermission(rbacService, PERMISSIONS.USERS_READ),
    adminController.listUsers
  );

  return router;
}
