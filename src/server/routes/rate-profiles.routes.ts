import { Router } from 'express';
import type { RateProfileController } from '../controllers/rate-profiles.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import { RATE_PROFILE_ENDPOINTS } from '../../shared/constants/endpoints.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';

export function createRateProfileRoutes(
  rateProfileController: RateProfileController,
  authService: AuthService
): Router {
  const router = Router();

  const authenticate = createAuthMiddleware(authService);

  router.use(authenticate);

  router.get(RATE_PROFILE_ENDPOINTS.LIST, rateProfileController.listRateProfiles);
  router.post(RATE_PROFILE_ENDPOINTS.CREATE, rateProfileController.createRateProfile);
  router.get(RATE_PROFILE_ENDPOINTS.GET(), rateProfileController.getRateProfile);
  router.patch(RATE_PROFILE_ENDPOINTS.UPDATE(), rateProfileController.updateRateProfile);
  router.delete(RATE_PROFILE_ENDPOINTS.DELETE(), rateProfileController.deleteRateProfile);

  return router;
}
