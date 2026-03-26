// src/server/controllers/analytics.controller.ts

import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateOrThrow } from '../validators/validation-utils.js';
import { analyticsDateRangeSchema } from '../validators/analytics.validator.js';
import { success, error } from '../lib/respond.js';
import type { AnalyticsService } from '../services/analytics/analytics.service.js';
import type { UserId } from '../database/types/ids.js';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
  }

  getResolutionTime = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const query = validateOrThrow(analyticsDateRangeSchema, req.query);

      const result = await this.analyticsService.getResolutionTime(
        new Date(query.from),
        new Date(query.to),
        actor.id as UserId
      );

      success(res, result, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getTicketVolume = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const query = validateOrThrow(analyticsDateRangeSchema, req.query);

      const result = await this.analyticsService.getTicketVolume(
        new Date(query.from),
        new Date(query.to),
        actor.id as UserId
      );

      success(res, result, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getQuoteAccuracy = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const query = validateOrThrow(analyticsDateRangeSchema, req.query);

      const result = await this.analyticsService.getQuoteAccuracy(
        new Date(query.from),
        new Date(query.to),
        actor.id as UserId
      );

      success(res, result, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };
}

function handleError(res: Response, err: unknown): void {
  if (!(err instanceof Error)) {
    error(res, 500, 'Internal server error');
    return;
  }

  if (err.name === 'AnalyticsError') {
    const e = err as Error & { statusCode: number };
    error(res, e.statusCode, e.message);
    return;
  }

  if (err.name === 'ForbiddenError') {
    const e = err as Error & { statusCode: number };
    error(res, e.statusCode, e.message);
    return;
  }

  if (err.name === 'ValidationError' || err.message.includes(':')) {
    error(res, 400, err.message);
    return;
  }

  console.error('Unhandled analytics controller error:', err);
  error(res, 500, 'Internal server error');
}
