import { AUTH_ROLES, PERMISSIONS } from '../../../shared/constants/index.js';
import type { InsertData, TransactionContext, UpdateData } from '../../daos/base/types.js';
import type { SlaPoliciesDAO } from '../../daos/children/sla.policies.dao.js';
import type { OrganizationMembersDAO } from '../../daos/children/organizations.domain.dao.js';
import type { UsersDAO } from '../../daos/children/users.dao.js';
import type { RolesDAO } from '../../daos/children/roles.dao.js';
import type { SlaPolicyId, UserId } from '../../database/types/ids.js';
import type { SlaPolicy, User } from '../../database/types/tables.js';
import type { RBACService } from '../rbac/rbac.service.js';
import { SlaError, SlaForbiddenError, SLA_ERROR_MSGS } from './sla.errors.js';
import type { CreateSlaPolicyData, UpdateSlaPolicyData } from './sla.service.types.js';

export class SlaService {
  private slaPoliciesDAO: SlaPoliciesDAO;
  private orgMembersDAO: OrganizationMembersDAO;
  private usersDAO: UsersDAO;
  private rolesDAO: RolesDAO;
  private rbacService: RBACService;

  constructor(
    slaPoliciesDAO: SlaPoliciesDAO,
    orgMembersDAO: OrganizationMembersDAO,
    usersDAO: UsersDAO,
    rolesDAO: RolesDAO,
    rbacService: RBACService
  ) {
    this.slaPoliciesDAO = slaPoliciesDAO;
    this.orgMembersDAO = orgMembersDAO;
    this.usersDAO = usersDAO;
    this.rolesDAO = rolesDAO;
    this.rbacService = rbacService;
  }

  /**
   * Create an SLA policy scoped to either a user or an organization.
   *
   * Rules:
   *   - Actor must have SLA_POLICIES_CREATE (Manager or Admin only via seed)
   *   - User-scoped policies: target user must be a Customer with no org membership
   *   - Org-scoped policies: organization must exist (enforced by FK)
   *
   * @param data Policy fields
   * @param actorId Actor performing the action
   * @param options Optional transaction context
   * @returns Created SlaPolicy
   * @throws SlaForbiddenError if actor lacks permission
   * @throws SlaError if user-scoping rules are violated
   */
  async createPolicy(
    data: CreateSlaPolicyData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<SlaPolicy> {
    const canCreate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.SLA_POLICIES_CREATE,
      options
    );
    if (!canCreate) throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);

    if (data.userId !== null) {
      await this.assertValidUserScope(data.userId, options);
    }

    return this.slaPoliciesDAO.create(
      {
        name: data.name,
        user_id: data.userId,
        organization_id: data.organizationId,
        contract: data.contract,
        effective_from: data.effectiveFrom,
        effective_to: data.effectiveTo,
        is_active: true,
      } satisfies InsertData<SlaPolicy>,
      options
    );
  }

  /**
   * Get a single SLA policy by ID.
   *
   * Visibility:
   *   - Staff (any role with SLA_POLICIES_READ) always pass
   *   - Customers: may only see a policy scoped to themselves or their org
   *
   * Returns 403 (not 404) when a customer requests a policy that exists but
   * does not belong to them, to avoid leaking existence.
   *
   * @param slaPolicyId Policy to retrieve
   * @param actorId Actor requesting
   * @param options Optional transaction context
   * @returns SlaPolicy
   * @throws SlaError if not found
   * @throws SlaForbiddenError if actor cannot see the policy
   */
  async getPolicy(
    slaPolicyId: SlaPolicyId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<SlaPolicy> {
    const policy = await this.slaPoliciesDAO.getById(slaPolicyId, options);
    if (!policy) throw new SlaError(SLA_ERROR_MSGS.NOT_FOUND, 404);

    await this.assertReadAccess(policy, actorId, options);

    return policy;
  }

  /**
   * List SLA policies.
   *
   * Visibility:
   *   - Staff: all policies
   *   - Customer with org membership: only their org's policy
   *   - Customer without org membership: only their user-scoped policy
   *
   * @param actorId Actor requesting
   * @param options Optional transaction context
   * @returns Array of visible SlaPolicy rows
   */
  async listPolicies(actorId: UserId, options?: TransactionContext): Promise<SlaPolicy[]> {
    const canReadAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.SLA_POLICIES_READ,
      options
    );

    if (canReadAll) {
      return this.slaPoliciesDAO.getAll(options);
    }

    // Customer path: return only the policy that applies to them
    return this.getCustomerPolicies(actorId, options);
  }

  /**
   * Update an SLA policy.
   * Requires SLA_POLICIES_UPDATE (Manager or Admin).
   * If both effectiveFrom and effectiveTo are being updated, validates the range.
   * If only one is supplied, it is validated against the persisted value of the other.
   *
   * @param slaPolicyId Policy to update
   * @param data Fields to update
   * @param actorId Actor performing the action
   * @param options Optional transaction context
   * @returns Updated SlaPolicy
   * @throws SlaForbiddenError if actor lacks permission
   * @throws SlaError if not found or date range is invalid
   */
  async updatePolicy(
    slaPolicyId: SlaPolicyId,
    data: UpdateSlaPolicyData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<SlaPolicy> {
    const canUpdate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.SLA_POLICIES_UPDATE,
      options
    );
    if (!canUpdate) throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);

    const existing = await this.slaPoliciesDAO.getById(slaPolicyId, {
      ...options,
      includeInactive: true,
    });
    if (!existing) throw new SlaError(SLA_ERROR_MSGS.NOT_FOUND, 404);

    const resolvedFrom = data.effectiveFrom ?? existing.effective_from;
    const resolvedTo = data.effectiveTo ?? existing.effective_to;
    if (resolvedTo < resolvedFrom) {
      throw new SlaError(SLA_ERROR_MSGS.EFFECTIVE_DATE_CONFLICT, 422);
    }

    const patch: UpdateData<SlaPolicy> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.contract !== undefined) patch.contract = data.contract;
    if (data.effectiveFrom !== undefined) patch.effective_from = data.effectiveFrom;
    if (data.effectiveTo !== undefined) patch.effective_to = data.effectiveTo;
    if (data.isActive !== undefined) patch.is_active = data.isActive;

    await this.slaPoliciesDAO.update({ id: slaPolicyId }, patch, options);

    const updated = await this.slaPoliciesDAO.getById(slaPolicyId, {
      ...options,
      includeInactive: true,
    });
    if (!updated) throw new SlaError(SLA_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
   * Soft-delete an SLA policy by deactivating it.
   * Requires SLA_POLICIES_DELETE (Manager or Admin).
   *
   * @param slaPolicyId Policy to deactivate
   * @param actorId Actor performing the action
   * @param options Optional transaction context
   * @throws SlaForbiddenError if actor lacks permission
   * @throws SlaError if not found
   */
  async deletePolicy(
    slaPolicyId: SlaPolicyId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const canDelete = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.SLA_POLICIES_DELETE,
      options
    );
    if (!canDelete) throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);

    const existing = await this.slaPoliciesDAO.getById(slaPolicyId, options);
    if (!existing) throw new SlaError(SLA_ERROR_MSGS.NOT_FOUND, 404);

    await this.slaPoliciesDAO.deactivate(slaPolicyId, options);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Assert that a user-scoped target is a Customer with no org membership.
   */
  private async assertValidUserScope(userId: UserId, options?: TransactionContext): Promise<void> {
    const user = await this.usersDAO.getById(userId, options);
    if (!user) throw new SlaError(SLA_ERROR_MSGS.TARGET_USER_NOT_FOUND, 404);

    await this.assertIsCustomer(user);

    const memberships = await this.orgMembersDAO.findByUser(userId, options);
    const hasOrg = memberships !== null && memberships.length > 0;
    if (hasOrg) throw new SlaError(SLA_ERROR_MSGS.TARGET_USER_HAS_ORG, 422);
  }

  /**
   * Assert that a User row carries the Customer system role.
   * Resolves role name via RolesDAO to avoid hardcoding the integer role ID.
   */
  private async assertIsCustomer(user: User): Promise<void> {
    const role = await this.rolesDAO.getById(user.role_id);
    if (!role || role.name !== AUTH_ROLES.CUSTOMER) {
      throw new SlaError(SLA_ERROR_MSGS.TARGET_USER_NOT_CUSTOMER, 422);
    }
  }

  /**
   * Assert that the actor can read the given policy.
   * Staff always pass via SLA_POLICIES_READ permission.
   * Customers must own the policy (user_id match) or be a member of the scoped org.
   */
  private async assertReadAccess(
    policy: SlaPolicy,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const canReadAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.SLA_POLICIES_READ,
      options
    );
    if (canReadAll) return;

    // User-scoped policy: must be the exact user
    if (policy.user_id !== null) {
      if ((policy.user_id as string) === (actorId as string)) return;
      throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);
    }

    // Org-scoped policy: actor must be a member of the org
    if (policy.organization_id !== null) {
      const isMember = await this.orgMembersDAO.isMember(actorId, policy.organization_id, options);
      if (isMember) return;
      throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);
    }

    // Should never reach here given the DB check constraint, but be safe
    throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);
  }

  /**
   * Return the SLA policies visible to a customer.
   * Checks org membership first; falls back to user-scoped lookup.
   */
  private async getCustomerPolicies(
    actorId: UserId,
    options?: TransactionContext
  ): Promise<SlaPolicy[]> {
    const memberships = await this.orgMembersDAO.findByUser(actorId, options);

    if (memberships !== null && memberships.length > 0) {
      // Customers are single-org -- take the first membership
      return this.slaPoliciesDAO.findByOrg(memberships[0].organization_id, options);
    }

    return this.slaPoliciesDAO.findByUser(actorId, options);
  }
}
