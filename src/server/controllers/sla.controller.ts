import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateOrThrow } from '../validators/validation-utils.js';
import {
  createSlaPolicySchema,
  slaPolicyIdParamSchema,
  updateSlaPolicySchema,
} from '../validators/sla.validator.js';
import { success, error } from '../lib/respond.js';
import type {
  SlaPolicyResponse,
  ListSlaPoliciesResponse,
  SlaContract,
} from '../../shared/contracts/sla-contracts.js';
import type { OrganizationId, SlaPolicyId, UserId } from '../database/types/ids.js';
import type { SlaPolicy } from '../database/types/tables.js';
import type { SlaService } from '../services/sla/sla.service.js';

export class SlaController {
  private slaService: SlaService;

  constructor(slaService: SlaService) {
    this.slaService = slaService;
  }

  createPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(createSlaPolicySchema, req.body);

      const policy = await this.slaService.createPolicy(
        {
          name: body.name,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          userId: (body.userId as UserId) ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          organizationId: (body.organizationId as OrganizationId) ?? null,
          contract: body.contract as SlaContract,
          effectiveFrom: new Date(body.effectiveFrom),
          effectiveTo: new Date(body.effectiveTo),
        },
        actor.id as UserId
      );

      success(res, this.mapPolicy(policy), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const params = validateOrThrow(slaPolicyIdParamSchema, req.params);

      const policy = await this.slaService.getPolicy(
        params.slaPolicyId as unknown as SlaPolicyId,
        actor.id as UserId
      );

      success(res, this.mapPolicy(policy), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  listPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const policies = await this.slaService.listPolicies(actor.id as UserId);

      const response: ListSlaPoliciesResponse = {
        policies: policies.map((p) => this.mapPolicy(p)),
      };
      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  updatePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const params = validateOrThrow(slaPolicyIdParamSchema, req.params);
      const body = validateOrThrow(updateSlaPolicySchema, req.body);

      const policy = await this.slaService.updatePolicy(
        params.slaPolicyId as unknown as SlaPolicyId,
        {
          name: body.name,
          contract: body.contract as SlaContract,
          effectiveFrom:
            body.effectiveFrom !== undefined ? new Date(body.effectiveFrom) : undefined,
          effectiveTo: body.effectiveTo !== undefined ? new Date(body.effectiveTo) : undefined,
          isActive: body.isActive,
        },
        actor.id as UserId
      );

      success(res, this.mapPolicy(policy), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  deletePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const params = validateOrThrow(slaPolicyIdParamSchema, req.params);

      await this.slaService.deletePolicy(
        params.slaPolicyId as unknown as SlaPolicyId,
        actor.id as UserId
      );

      success(res, { message: 'SLA policy deactivated successfully' }, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  private mapPolicy(policy: SlaPolicy): SlaPolicyResponse {
    return {
      id: policy.id as unknown as number,
      name: policy.name,
      userId: policy.user_id as string | null,
      organizationId: policy.organization_id as string | null,
      contract: policy.contract as SlaPolicyResponse['contract'],
      effectiveFrom: policy.effective_from.toISOString(),
      effectiveTo: policy.effective_to.toISOString(),
      isActive: policy.is_active,
      createdAt: policy.created_at.toISOString(),
      updatedAt: policy.updated_at.toISOString(),
    };
  }
}

function handleError(res: Response, err: unknown): void {
  if (!(err instanceof Error)) {
    error(res, 500, 'Internal server error');
    return;
  }

  if (err.name === 'SlaError') {
    const e = err as Error & { statusCode: number };
    error(res, e.statusCode, e.message);
    return;
  }

  if (err.name === 'SlaForbiddenError') {
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
