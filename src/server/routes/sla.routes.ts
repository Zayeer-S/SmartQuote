import { Router } from 'express';
import type { SlaController } from '../controllers/sla.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import type { RBACService } from '../services/rbac/rbac.service.js';
import { SLA_ENDPOINTS } from '../../shared/constants/endpoints.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../shared/constants/lookup-values.js';

export function createSlaRoutes(
  slaController: SlaController,
  authService: AuthService,
  rbacService: RBACService
): Router {
  const router = Router();

  const authenticate = createAuthMiddleware(authService);

  router.use(authenticate);

  router.get(SLA_ENDPOINTS.LIST, slaController.listPolicies);
  router.get(SLA_ENDPOINTS.GET(), slaController.getPolicy);

  router.post(
    SLA_ENDPOINTS.CREATE,
    requirePermission(rbacService, PERMISSIONS.SLA_POLICIES_CREATE),
    slaController.createPolicy
  );
  router.patch(
    SLA_ENDPOINTS.UPDATE(),
    requirePermission(rbacService, PERMISSIONS.SLA_POLICIES_UPDATE),
    slaController.updatePolicy
  );
  router.delete(
    SLA_ENDPOINTS.DELETE(),
    requirePermission(rbacService, PERMISSIONS.SLA_POLICIES_DELETE),
    slaController.deletePolicy
  );

  return router;
}
