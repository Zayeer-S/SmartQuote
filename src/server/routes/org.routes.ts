import { Router } from 'express';
import type { OrgController } from '../controllers/org.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import { ORG_ENDPOINTS } from '../../shared/constants/endpoints.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';

export function createOrgRoutes(orgController: OrgController, authService: AuthService): Router {
  const router = Router();

  const authenticate = createAuthMiddleware(authService);

  router.use(authenticate);

  // /me must be registered before /:orgId to prevent Express matching 'me' as an orgId
  router.get(ORG_ENDPOINTS.MY_ORG, orgController.getMyOrg);

  router.get(ORG_ENDPOINTS.LIST, orgController.listOrgs);
  router.post(ORG_ENDPOINTS.CREATE, orgController.createOrg);
  router.get(ORG_ENDPOINTS.GET(), orgController.getOrg);
  router.patch(ORG_ENDPOINTS.UPDATE(), orgController.updateOrg);
  router.delete(ORG_ENDPOINTS.DELETE(), orgController.deleteOrg);

  router.get(ORG_ENDPOINTS.LIST_MEMBERS(), orgController.listMembers);
  router.post(ORG_ENDPOINTS.ADD_MEMBER(), orgController.addMember);
  router.delete(ORG_ENDPOINTS.REMOVE_MEMBER(), orgController.removeMember);

  return router;
}
