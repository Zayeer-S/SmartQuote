import { PERMISSIONS } from '../../../shared/constants/index.js';
import type { TransactionContext } from '../../daos/base/types.js';
import type { OrganizationsDAO } from '../../daos/children/organizations-domain.dao.js';
import type { OrganizationId, UserId } from '../../database/types/ids.js';
import type { Organization } from '../../database/types/tables.js';
import type { RBACService } from '../rbac/rbac.service.js';
import { ORG_ERROR_MSGS, OrgError, OrgForbiddenError } from './org.errors.js';
import { CreateOrgData, UpdateOrgData } from './org.service.types.js';

export class OrgService {
  private orgsDAO: OrganizationsDAO;
  private rbacService: RBACService;

  constructor(orgsDAO: OrganizationsDAO, rbacService: RBACService) {
    this.orgsDAO = orgsDAO;
    this.rbacService = rbacService;
  }

  /**
   * Create a new organization.
   *
   * @param data Organization fields
   * @param actorId User performing the action
   * @param options Optional transaction context
   * @returns Created organization
   * @throws OrgForbiddenError if actor lacks organizations:create
   */
  async createOrg(
    data: CreateOrgData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Organization> {
    const canCreate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.ORGANIZATIONS_CREATE,
      options
    );
    if (!canCreate) throw new OrgForbiddenError(ORG_ERROR_MSGS.FORBIDDEN);

    return this.orgsDAO.create({ name: data.name, is_active: true }, options);
  }

  /**
   * Get a single organization by ID.
   *
   * @param orgId Organization to retrieve
   * @param actorId User performing the action
   * @param options Optional transaction context
   * @returns Organization
   * @throws OrgForbiddenError if actor lacks organizations:read
   * @throws OrgError if not found
   */
  async getOrg(
    orgId: OrganizationId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Organization> {
    const canRead = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.ORGANIZATIONS_READ,
      options
    );
    if (!canRead) throw new OrgForbiddenError(ORG_ERROR_MSGS.FORBIDDEN);

    const org = await this.orgsDAO.getById(orgId, options);
    if (!org) throw new OrgError(ORG_ERROR_MSGS.NOT_FOUND, 404);

    return org;
  }

  /**
   * List all organizations.
   *
   * @param actorId User performing the action
   * @param options Optional transaction context
   * @returns Array of organizations
   * @throws OrgForbiddenError if actor lacks organizations:read
   */
  async listOrgs(actorId: UserId, options?: TransactionContext): Promise<Organization[]> {
    const canRead = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.ORGANIZATIONS_READ,
      options
    );
    if (!canRead) throw new OrgForbiddenError(ORG_ERROR_MSGS.FORBIDDEN);

    return this.orgsDAO.getAll(options);
  }

  /**
   * Update an organization's name or active status.
   *
   * @param orgId Organization to update
   * @param data Fields to update
   * @param actorId User performing the action
   * @param options Optional transaction context
   * @returns Updated organization
   * @throws OrgForbiddenError if actor lacks organizations:update
   * @throws OrgError if not found
   */
  async updateOrg(
    orgId: OrganizationId,
    data: UpdateOrgData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Organization> {
    const canUpdate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.ORGANIZATIONS_UPDATE,
      options
    );
    if (!canUpdate) throw new OrgForbiddenError(ORG_ERROR_MSGS.FORBIDDEN);

    const org = await this.orgsDAO.getById(orgId, options);
    if (!org) throw new OrgError(ORG_ERROR_MSGS.NOT_FOUND, 404);

    await this.orgsDAO.update({ id: orgId }, data, options);

    const updated = await this.orgsDAO.getById(orgId, options);
    if (!updated) throw new OrgError(ORG_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
   * Soft-delete an organization by deactivating it.
   *
   * @param orgId Organization to deactivate
   * @param actorId User performing the action
   * @param options Optional transaction context
   * @throws OrgForbiddenError if actor lacks organizations:delete
   * @throws OrgError if not found
   */
  async deleteOrg(
    orgId: OrganizationId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const canDelete = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.ORGANIZATIONS_DELETE,
      options
    );
    if (!canDelete) throw new OrgForbiddenError(ORG_ERROR_MSGS.FORBIDDEN);

    const org = await this.orgsDAO.getById(orgId, options);
    if (!org) throw new OrgError(ORG_ERROR_MSGS.NOT_FOUND, 404);

    await this.orgsDAO.deactivate(orgId, options);
  }
}
