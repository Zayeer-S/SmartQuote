import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateOrThrow } from '../validators/validation-utils.js';
import { success, error } from '../lib/respond.js';
import type { UserId } from '../database/types/ids.js';
import type { RateProfileId } from '../database/types/ids.js';
import type { RateProfile } from '../database/types/tables.js';
import type { RateProfileService } from '../services/rate-profiles/rate.profiles.service.js';
import type { LookupResolver } from '../lib/lookup-resolver.js';
import {
  createRateProfileSchema,
  updateRateProfileSchema,
} from '../validators/rate.profile.validator.js';
import type {
  ListRateProfilesResponse,
  RateProfileResponse,
} from '../../shared/contracts/rate-profile-contracts.js';
import {
  BusinessImpact,
  TicketSeverity,
  TicketType,
} from '../../shared/constants/lookup-values.js';

export class RateProfileController {
  private rateProfileService: RateProfileService;
  private lookup: LookupResolver;

  constructor(rateProfileService: RateProfileService, lookup: LookupResolver) {
    this.rateProfileService = rateProfileService;
    this.lookup = lookup;
  }

  listRateProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const profiles = await this.rateProfileService.listRateProfiles(actor.id as UserId);

      const response: ListRateProfilesResponse = {
        rateProfiles: profiles.map((p) => this.mapRateProfile(p)),
      };
      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getRateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const profile = await this.rateProfileService.getRateProfile(
        req.params.rateProfileId as unknown as RateProfileId,
        actor.id as UserId
      );

      success(res, this.mapRateProfile(profile), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  createRateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(createRateProfileSchema, req.body);

      const profile = await this.rateProfileService.createRateProfile(
        {
          ticket_type_id: this.lookup.ticketTypeId(body.ticketType as TicketType) as number,
          ticket_severity_id: this.lookup.ticketSeverityId(
            body.ticketSeverity as TicketSeverity
          ) as number,
          business_impact_id: this.lookup.businessImpactId(
            body.businessImpact as BusinessImpact
          ) as number,
          business_hours_rate: body.businessHoursRate,
          after_hours_rate: body.afterHoursRate,
          multiplier: body.multiplier,
          effective_from: new Date(body.effectiveFrom),
          effective_to: new Date(body.effectiveTo),
        },
        actor.id as UserId
      );

      success(res, this.mapRateProfile(profile), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  updateRateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(updateRateProfileSchema, req.body);

      const profile = await this.rateProfileService.updateRateProfile(
        req.params.rateProfileId as unknown as RateProfileId,
        {
          business_hours_rate: body.businessHoursRate,
          after_hours_rate: body.afterHoursRate,
          multiplier: body.multiplier,
          effective_from:
            body.effectiveFrom !== undefined ? new Date(body.effectiveFrom) : undefined,
          effective_to: body.effectiveTo !== undefined ? new Date(body.effectiveTo) : undefined,
          is_active: body.isActive,
        },
        actor.id as UserId
      );

      success(res, this.mapRateProfile(profile), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  deleteRateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      await this.rateProfileService.deleteRateProfile(
        req.params.rateProfileId as unknown as RateProfileId,
        actor.id as UserId
      );

      success(res, null, 204);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  private mapRateProfile(profile: RateProfile): RateProfileResponse {
    return {
      id: profile.id as unknown as number,
      ticketType: this.lookup.ticketTypeName(profile.ticket_type_id as unknown as number),
      ticketSeverity: this.lookup.ticketSeverityName(
        profile.ticket_severity_id as unknown as number
      ),
      businessImpact: this.lookup.businessImpactName(
        profile.business_impact_id as unknown as number
      ),
      businessHoursRate: profile.business_hours_rate as unknown as number,
      afterHoursRate: profile.after_hours_rate as unknown as number,
      multiplier: profile.multiplier as unknown as number,
      effectiveFrom: profile.effective_from.toISOString(),
      effectiveTo: profile.effective_to.toISOString(),
      isActive: profile.is_active,
      createdAt: profile.created_at.toISOString(),
      updatedAt: profile.updated_at.toISOString(),
    };
  }
}

function handleError(res: Response, err: unknown): void {
  if (!(err instanceof Error)) {
    error(res, 500, 'Internal server error');
    return;
  }

  if (err.name === 'RateProfileError') {
    const e = err as Error & { statusCode: number };
    error(res, e.statusCode, e.message);
    return;
  }

  if (err.name === 'RateProfileForbiddenError') {
    const e = err as Error & { statusCode: number };
    error(res, e.statusCode, e.message);
    return;
  }

  if (err.name === 'ValidationError' || err.message.includes(':')) {
    error(res, 400, err.message);
    return;
  }

  console.error('Unhandled controller error:', err);
  error(res, 500, 'Internal server error');
}
