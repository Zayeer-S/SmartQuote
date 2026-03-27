import { AUTH_ROLES, PERMISSIONS, ORG_ROLES } from '../../../shared/constants/index.js';
import type { TransactionContext } from '../../daos/base/types.js';
import type {
  OrganizationMembersDAO,
  OrganizationsDAO,
} from '../../daos/children/organizations-domain.dao.js';
import type { OrgRolesDAO, RolesDAO } from '../../daos/children/roles-domain.dao.js';
import type { UsersDAO } from '../../daos/children/users-domain.dao.js';
import type { OrganizationId, UserId } from '../../database/types/ids.js';
import type { Organization, OrganizationMember } from '../../database/types/tables.js';
import type { OrgRBACService } from '../rbac/org-rbac.service.js';
import {
  OrgError,
  OrgForbiddenError,
  ORG_ERROR_MSGS,
  ORG_MEMBERS_ERROR_MSGS,
} from './org.errors.js';
import type { AddMemberData, RemoveMemberData } from './org-members.service.types.js';

export class OrgMembersService {
  private orgMembersDAO: OrganizationMembersDAO;
  private orgsDAO: OrganizationsDAO;
  private usersDAO: UsersDAO;
  private rolesDAO: RolesDAO;
  orgRolesDAO: OrgRolesDAO;
  private orgRBACService: OrgRBACService;

  constructor(
    orgMembersDAO: OrganizationMembersDAO,
    orgsDAO: OrganizationsDAO,
    usersDAO: UsersDAO,
    rolesDAO: RolesDAO,
    orgRolesDAO: OrgRolesDAO,
    orgRBACService: OrgRBACService
  ) {
    this.orgMembersDAO = orgMembersDAO;
    this.orgsDAO = orgsDAO;
    this.usersDAO = usersDAO;
    this.rolesDAO = rolesDAO;
    this.orgRolesDAO = orgRolesDAO;
    this.orgRBACService = orgRBACService;
  }

  /**
   * Add a customer to an org.
   *
   * Only org managers (org:manage_members) may add members.
   * Enforces the single-org constraint for customers at the service layer:
   * a customer already belonging to any org (including this one) is rejected.
   * New members are always assigned the MEMBER org role.
   *
   * @param data Target user and org
   * @param actorId User performing the action
   * @param options Optional transaction context
   * @returns Created membership row
   * @throws OrgForbiddenError if actor lacks org:manage_members in this org
   * @throws OrgError if org not found, target not found, target not a customer,
   *         or target already belongs to any org
   */
  async addMember(
    data: AddMemberData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<OrganizationMember> {
    const canManage = await this.orgRBACService.hasOrgPermission(
      actorId,
      data.orgId,
      PERMISSIONS.ORG_MANAGE_MEMBERS,
      options
    );
    if (!canManage) throw new OrgForbiddenError(ORG_ERROR_MSGS.FORBIDDEN);

    const org = await this.orgsDAO.getById(data.orgId, options);
    if (!org) throw new OrgError(ORG_ERROR_MSGS.NOT_FOUND, 404);

    const target = await this.usersDAO.getById(data.targetUserId, options);
    if (!target) throw new OrgError(ORG_MEMBERS_ERROR_MSGS.TARGET_NOT_FOUND, 404);

    // Resolve the customer role ID to compare against the target's role_id
    const customerRole = await this.rolesDAO.findByName(AUTH_ROLES.CUSTOMER, options);
    if (target.role_id !== customerRole?.id) {
      throw new OrgError(ORG_MEMBERS_ERROR_MSGS.TARGET_NOT_CUSTOMER, 422);
    }

    // Single-org constraint: customers may not belong to more than one org
    const existingMemberships = await this.orgMembersDAO.findByUser(data.targetUserId, options);

    if (existingMemberships && existingMemberships.length > 0) {
      const alreadyInThisOrg = existingMemberships.some((m) => m.organization_id === data.orgId);
      const msg = alreadyInThisOrg
        ? ORG_MEMBERS_ERROR_MSGS.ALREADY_MEMBER_THIS_ORG
        : ORG_MEMBERS_ERROR_MSGS.ALREADY_MEMBER_OTHER_ORG;
      throw new OrgError(msg, 422);
    }

    // Resolve the MEMBER org role ID
    const memberOrgRole = await this.orgRolesDAO.findByName(ORG_ROLES.MEMBER, options);
    if (!memberOrgRole) throw new OrgError('Member org role not found', 500);

    return this.orgMembersDAO.create(
      {
        organization_id: data.orgId,
        user_id: data.targetUserId,
        org_role_id: memberOrgRole.id,
      },
      options
    );
  }

  /**
   * Remove a customer from an org.
   *
   * Only org managers (org:manage_members) may remove members.
   *
   * @param data Target user and org
   * @param actorId User performing the action
   * @param options Optional transaction context
   * @throws OrgForbiddenError if actor lacks org:manage_members in this org
   * @throws OrgError if org not found, or target is not a member of this org
   */
  async removeMember(
    data: RemoveMemberData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const canManage = await this.orgRBACService.hasOrgPermission(
      actorId,
      data.orgId,
      PERMISSIONS.ORG_MANAGE_MEMBERS,
      options
    );
    if (!canManage) throw new OrgForbiddenError(ORG_ERROR_MSGS.FORBIDDEN);

    const org = await this.orgsDAO.getById(data.orgId, options);
    if (!org) throw new OrgError(ORG_ERROR_MSGS.NOT_FOUND, 404);

    const membership = await this.orgMembersDAO.findMembership(
      data.targetUserId,
      data.orgId,
      options
    );
    if (!membership) throw new OrgError(ORG_MEMBERS_ERROR_MSGS.NOT_A_MEMBER, 404);

    await this.orgMembersDAO.delete(
      { organization_id: data.orgId, user_id: data.targetUserId },
      options
    );
  }

  /**
   * List all members of an org.
   *
   * Requires org:view_members for the given org. System admins/managers
   * are handled transparently by OrgRBACService.
   *
   * @param orgId Org to list members for
   * @param actorId User performing the action
   * @param options Optional transaction context
   * @returns Array of membership rows
   * @throws OrgForbiddenError if actor lacks org:view_members in this org
   * @throws OrgError if org not found
   */
  async listMembers(
    orgId: OrganizationId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<OrganizationMember[] | null> {
    const canView = await this.orgRBACService.hasOrgPermission(
      actorId,
      orgId,
      PERMISSIONS.ORG_VIEW_MEMBERS,
      options
    );
    if (!canView) throw new OrgForbiddenError(ORG_ERROR_MSGS.FORBIDDEN);

    const org = await this.orgsDAO.getById(orgId, options);
    if (!org) throw new OrgError(ORG_ERROR_MSGS.NOT_FOUND, 404);

    return await this.orgMembersDAO.findByOrganization(orgId, options);
  }

  /**
   * Get the org the calling customer belongs to, if any.
   *
   * Customers are constrained to a single org so this returns at most one.
   * Returns null if the user has no org membership.
   *
   * @param actorId User performing the action
   * @param options Optional transaction context
   * @returns Organization or null
   */
  async getMyOrg(actorId: UserId, options?: TransactionContext): Promise<Organization | null> {
    const memberships = await this.orgMembersDAO.findByUser(actorId, options);
    if (!memberships) return null;
    if (memberships.length === 0) return null;

    return this.orgsDAO.getById(memberships[0].organization_id, options);
  }
}

// TODO ADD FUNC TO ADD/REMOVE ORG MANAGER STATUS
