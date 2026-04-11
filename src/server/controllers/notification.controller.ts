import type { Request, Response } from 'express';
import type { NotificationService } from '../services/notification/notification.service.js';
import { validateOrThrow } from '../validators/validation.utils.js';
import { updateNotificationPreferencesSchema } from '../validators/notification.validator.js';
import type { UpdateNotificationPreferencesRequest } from '../../shared/contracts/notification-contracts.js';
import { success, error } from '../lib/respond.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { UserId } from '../database/types/ids.js';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  getMyPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await this.notificationService.getPreferences(authReq.user.id as UserId);
      success(res, result, 200);
    } catch (err: unknown) {
      console.error('getMyPreferences error:', err);
      error(res, 500, 'Internal server error');
    }
  };

  updateMyPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const body = validateOrThrow(
        updateNotificationPreferencesSchema,
        req.body
      ) as UpdateNotificationPreferencesRequest;

      const result = await this.notificationService.updatePreferences(
        authReq.user.id as UserId,
        body
      );
      success(res, result, 200);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'ValidationError') {
        const e = err as Error & { statusCode?: number };
        error(res, e.statusCode ?? 400, e.message);
        return;
      }
      console.error('updateMyPreferences error:', err);
      error(res, 500, 'Internal server error');
    }
  };
}
