import { Router } from 'express';
import type { AdminController } from '../controllers/admin.controller';
import type { AuthService } from '../services/auth/auth.service';
import type { RBACService } from '../services/rbac/rbac.service';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../../shared/constants';

export function createAdminRoutes(
  adminController: AdminController,
  authService: AuthService,
  rbacService: RBACService
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(authService);

  router.post(
    '/users',
    authenticate,
    requirePermission(rbacService, PERMISSIONS.USERS_CREATE),
    adminController.createUser
  );

  router.get(
    '/users',
    authenticate,
    requirePermission(rbacService, PERMISSIONS.USERS_READ),
    adminController.listUsers
  );

  return router;
}
