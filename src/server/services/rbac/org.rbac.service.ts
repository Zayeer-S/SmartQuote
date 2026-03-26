import { PERMISSIONS } from '../../../shared/constants/index.js';
import type { TransactionContext } from '../../daos/base/types.js';
import type { OrganizationMembersDAO } from '../../daos/children/organizations.domain.dao.js';
import type { OrgPermissionsDAO } from '../../daos/children/permissions.dao.js';
import type { OrganizationId, UserId } from '../../database/types/ids.js';
import type { RBACService } from './rbac.service.js';

export class OrgRBACService {
  private orgMembersDAO: OrganizationMembersDAO;
  private orgPermissionsDAO: OrgPermissionsDAO;
  private rbacService: RBACService;

  constructor(
    orgMembersDAO: OrganizationMembersDAO,
    orgPermissionsDAO: OrgPermissionsDAO,
    rbacService: RBACService
  ) {
    this.orgMembersDAO = orgMembersDAO;
    this.orgPermissionsDAO = orgPermissionsDAO;
    this.rbacService = rbacService;
  }

  /**
   * Check if a user has a specific org-scoped permission within a given org.
   *
   * System-role Admins bypass org membership entirely -- if the actor holds
   * the system-level organizations:read permission they are treated as having
   * all org-scoped permissions. This keeps admin oversight unconditional
   * without coupling OrgRBACService to role name strings.
   *
   * @param userId User to check
   * @param orgId Org the permission is scoped to
   * @param permissionName Org-scoped permission to check (e.g. org:view_members)
   * @param options Optional transaction context
   * @returns True if the user has the permission in this org
   */
  async hasOrgPermission(
    userId: UserId,
    orgId: OrganizationId,
    permissionName: string,
    options?: TransactionContext
  ): Promise<boolean> {
    // System-level admins/managers bypass org membership checks
    const isSystemPrivileged = await this.rbacService.hasPermission(
      userId,
      PERMISSIONS.ORGANIZATIONS_READ,
      options
    );
    if (isSystemPrivileged) return true;

    const membership = await this.orgMembersDAO.findMembership(userId, orgId, options);
    if (!membership) return false;

    const permissions = await this.orgPermissionsDAO.findByOrgRoleId(
      membership.org_role_id,
      options
    );

    return permissions.some((p) => p.name === permissionName);
  }

  /**
   * Check if a user is a member of a specific org (any org role).
   *
   * System-role Admins are treated as implicit members of every org.
   *
   * @param userId User to check
   * @param orgId Org to check membership in
   * @param options Optional transaction context
   * @returns True if the user is a member of this org
   */
  async isOrgMember(
    userId: UserId,
    orgId: OrganizationId,
    options?: TransactionContext
  ): Promise<boolean> {
    const isSystemPrivileged = await this.rbacService.hasPermission(
      userId,
      PERMISSIONS.ORGANIZATIONS_READ,
      options
    );
    if (isSystemPrivileged) return true;

    return this.orgMembersDAO.isMember(userId, orgId, options);
  }
}
