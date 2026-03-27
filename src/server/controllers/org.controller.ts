import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateOrThrow } from '../validators/validation.utils.js';
import {
  addOrgMemberSchema,
  createOrgSchema,
  orgIdParamSchema,
  orgMemberParamSchema,
  updateOrgSchema,
} from '../validators/org.validator.js';
import { success, error } from '../lib/respond.js';
import type {
  ListOrgMembersResponse,
  ListOrgsResponse,
  OrgMemberResponse,
  OrgResponse,
} from '../../shared/contracts/org-contracts.js';
import type { OrganizationId, UserId } from '../database/types/ids.js';
import type { Organization, OrganizationMember } from '../database/types/tables.js';
import type { OrgService } from '../services/org/org.service.js';
import type { OrgMembersService } from '../services/org/org-members.service.js';

export class OrgController {
  private orgService: OrgService;
  private orgMembersService: OrgMembersService;

  constructor(orgService: OrgService, orgMembersService: OrgMembersService) {
    this.orgService = orgService;
    this.orgMembersService = orgMembersService;
  }

  createOrg = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(createOrgSchema, req.body);

      const org = await this.orgService.createOrg({ name: body.name }, actor.id as UserId);

      success(res, this.mapOrg(org), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getOrg = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const params = validateOrThrow(orgIdParamSchema, req.params);

      const org = await this.orgService.getOrg(params.orgId as OrganizationId, actor.id as UserId);

      success(res, this.mapOrg(org), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  listOrgs = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const orgs = await this.orgService.listOrgs(actor.id as UserId);

      const response: ListOrgsResponse = { organizations: orgs.map((o) => this.mapOrg(o)) };
      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  updateOrg = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const params = validateOrThrow(orgIdParamSchema, req.params);
      const body = validateOrThrow(updateOrgSchema, req.body);

      const org = await this.orgService.updateOrg(
        params.orgId as OrganizationId,
        { name: body.name, is_active: body.isActive },
        actor.id as UserId
      );

      success(res, this.mapOrg(org), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  deleteOrg = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const params = validateOrThrow(orgIdParamSchema, req.params);

      await this.orgService.deleteOrg(params.orgId as OrganizationId, actor.id as UserId);

      success(res, { message: 'Organization deleted successfully' }, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  listMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const params = validateOrThrow(orgIdParamSchema, req.params);

      const members = await this.orgMembersService.listMembers(
        params.orgId as OrganizationId,
        actor.id as UserId
      );

      let response: ListOrgMembersResponse | null;
      if (members)
        response = {
          members: members.map((m) => this.mapMember(m)),
        };
      else response = null;

      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  addMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const params = validateOrThrow(orgIdParamSchema, req.params);
      const body = validateOrThrow(addOrgMemberSchema, req.body);

      const member = await this.orgMembersService.addMember(
        {
          orgId: params.orgId as OrganizationId,
          targetUserId: body.userId as UserId,
        },
        actor.id as UserId
      );

      success(res, this.mapMember(member), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const params = validateOrThrow(orgMemberParamSchema, req.params);

      await this.orgMembersService.removeMember(
        {
          orgId: params.orgId as OrganizationId,
          targetUserId: params.userId as UserId,
        },
        actor.id as UserId
      );

      success(res, { message: 'Member removed successfully' }, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getMyOrg = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const org = await this.orgMembersService.getMyOrg(actor.id as UserId);

      success(res, org ? this.mapOrg(org) : null, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  private mapOrg(org: Organization): OrgResponse {
    return {
      id: org.id as string,
      name: org.name,
      isActive: org.is_active,
      createdAt: org.created_at.toISOString(),
      updatedAt: org.updated_at.toISOString(),
    };
  }

  private mapMember(member: OrganizationMember): OrgMemberResponse {
    return {
      organizationId: member.organization_id as string,
      userId: member.user_id as string,
      orgRoleId: member.org_role_id as unknown as number,
      createdAt: member.created_at.toISOString(),
      updatedAt: member.updated_at.toISOString(),
    };
  }
}

function handleError(res: Response, err: unknown): void {
  if (!(err instanceof Error)) {
    error(res, 500, 'Internal server error');
    return;
  }

  if (err.name === 'OrgError') {
    const e = err as Error & { statusCode: number };
    error(res, e.statusCode, e.message);
    return;
  }

  if (err.name === 'OrgForbiddenError') {
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
