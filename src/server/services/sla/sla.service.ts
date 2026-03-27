import { AUTH_ROLES, PERMISSIONS } from '../../../shared/constants/index.js';
import type { InsertData, TransactionContext, UpdateData } from '../../daos/base/types.js';
import type { SlaPoliciesDAO } from '../../daos/children/sla.policies.dao.js';
import type {
  OrganizationMembersDAO,
  OrganizationsDAO,
} from '../../daos/children/organizations.domain.dao.js';
import type { UsersDAO } from '../../daos/children/users.domain.dao.js';
import type { RolesDAO } from '../../daos/children/roles-domain.dao.js';
import type { OrganizationId, SlaPolicyId, UserId } from '../../database/types/ids.js';
import type { SlaPolicy, Ticket, User } from '../../database/types/tables.js';
import type { RBACService } from '../rbac/rbac.service.js';
import { SlaError, SlaForbiddenError, SLA_ERROR_MSGS } from './sla.errors.js';
import type { CreateSlaPolicyData, UpdateSlaPolicyData } from './sla.service.types.js';
import type { SlaContract, SlaStatusResponse } from '../../../shared/contracts/sla-contracts.js';

export interface SlaPolicyWithDisplayName extends SlaPolicy {
  scopeDisplayName: string;
}

export class SlaService {
  private slaPoliciesDAO: SlaPoliciesDAO;
  private orgsDAO: OrganizationsDAO;
  private orgMembersDAO: OrganizationMembersDAO;
  private usersDAO: UsersDAO;
  private rolesDAO: RolesDAO;
  private rbacService: RBACService;

  constructor(
    slaPoliciesDAO: SlaPoliciesDAO,
    orgsDAO: OrganizationsDAO,
    orgMembersDAO: OrganizationMembersDAO,
    usersDAO: UsersDAO,
    rolesDAO: RolesDAO,
    rbacService: RBACService
  ) {
    this.slaPoliciesDAO = slaPoliciesDAO;
    this.orgsDAO = orgsDAO;
    this.orgMembersDAO = orgMembersDAO;
    this.usersDAO = usersDAO;
    this.rolesDAO = rolesDAO;
    this.rbacService = rbacService;
  }

  /**
   * Resolve the SLA status for a single ticket.
   *
   * Lookup order:
   *   1. If the ticket has an organization_id, find an active policy for that org.
   *   2. Otherwise, find an active user-scoped policy for the ticket creator.
   *
   * Breach is deadline-driven per client guidance -- the estimated_resolution_time
   * represents dev effort spread over time, not a countdown. The deadline field is
   * the correct signal for breach alerting.
   *
   * Returns null when no active policy covers this ticket.
   *
   * @param ticket Ticket row (must include organization_id, creator_user_id,
   *               ticket_severity_id resolved to a name, and deadline)
   * @param ticketSeverityName Resolved severity name for contract lookup
   * @param options Optional transaction context
   */
  async resolveForTicket(
    ticket: Ticket,
    ticketSeverityName: string,
    options?: TransactionContext
  ): Promise<SlaStatusResponse | null> {
    const policy = await this.findPolicyForTicket(ticket, options);
    if (!policy) return null;

    const contract = policy.contract as SlaContract;
    const allSeverityTargets = contract.severityTargets;

    const matchedTarget = allSeverityTargets.find((t) => t.severity === ticketSeverityName) ?? null;

    const now = new Date();
    const deadlineMs = ticket.deadline.getTime();
    const hoursUntilDeadline = (deadlineMs - now.getTime()) / (1000 * 60 * 60);

    return {
      policyName: policy.name,
      severityTarget: matchedTarget
        ? {
            responseTimeHours: matchedTarget.responseTimeHours,
            resolutionTimeHours: matchedTarget.resolutionTimeHours,
          }
        : null,
      allSeverityTargets,
      deadlineBreached: hoursUntilDeadline < 0,
      hoursUntilDeadline,
    };
  }

  /**
   * Resolve SLA status for a batch of tickets in O(unique orgs + unique users)
   * queries rather than one query per ticket.
   *
   * Returns a Map keyed by ticket ID (as string). Tickets with no matching
   * policy are absent from the map (callers should treat missing keys as null).
   *
   * @param tickets Array of tickets with their resolved severity names
   * @param options Optional transaction context
   */
  async resolveForTickets(
    tickets: { ticket: Ticket; ticketSeverityName: string }[],
    options?: TransactionContext
  ): Promise<Map<string, SlaStatusResponse>> {
    if (tickets.length === 0) return new Map();

    // Collect distinct org IDs and creator user IDs
    const orgIds = [
      ...new Set(
        tickets
          .filter((e) => e.ticket.organization_id !== null)
          .map((e) => e.ticket.organization_id as string)
      ),
    ];

    const creatorIds = [
      ...new Set(
        tickets
          .filter((e) => e.ticket.organization_id === null)
          .map((e) => e.ticket.creator_user_id as string)
      ),
    ];

    // Fetch all relevant policies in two queries
    const [orgPolicies, userPolicies] = await Promise.all([
      orgIds.length > 0
        ? Promise.all(
            orgIds.map((id) => this.slaPoliciesDAO.findByOrg(id as OrganizationId, options))
          ).then((arrays) => arrays.flat())
        : Promise.resolve([]),
      creatorIds.length > 0
        ? Promise.all(
            creatorIds.map((id) => this.slaPoliciesDAO.findByUser(id as UserId, options))
          ).then((arrays) => arrays.flat())
        : Promise.resolve([]),
    ]);

    // Build lookup maps: orgId -> first active policy, userId -> first active policy
    const now = new Date();
    const orgPolicyMap = new Map<string, SlaPolicy>();
    for (const p of orgPolicies) {
      if (
        p.is_active &&
        p.effective_from <= now &&
        p.effective_to >= now &&
        p.organization_id !== null &&
        !orgPolicyMap.has(p.organization_id as string)
      ) {
        orgPolicyMap.set(p.organization_id as string, p);
      }
    }

    const userPolicyMap = new Map<string, SlaPolicy>();
    for (const p of userPolicies) {
      if (
        p.is_active &&
        p.effective_from <= now &&
        p.effective_to >= now &&
        p.user_id !== null &&
        !userPolicyMap.has(p.user_id as string)
      ) {
        userPolicyMap.set(p.user_id as string, p);
      }
    }

    // Compute SLA status per ticket
    const result = new Map<string, SlaStatusResponse>();

    for (const { ticket, ticketSeverityName } of tickets) {
      const policy =
        ticket.organization_id !== null
          ? (orgPolicyMap.get(ticket.organization_id as string) ?? null)
          : (userPolicyMap.get(ticket.creator_user_id as string) ?? null);

      if (!policy) continue;

      const contract = policy.contract as SlaContract;
      const allSeverityTargets = contract.severityTargets;
      const matchedTarget =
        allSeverityTargets.find((t) => t.severity === ticketSeverityName) ?? null;

      const deadlineMs = ticket.deadline.getTime();
      const hoursUntilDeadline = (deadlineMs - now.getTime()) / (1000 * 60 * 60);

      result.set(ticket.id as string, {
        policyName: policy.name,
        severityTarget: matchedTarget
          ? {
              responseTimeHours: matchedTarget.responseTimeHours,
              resolutionTimeHours: matchedTarget.resolutionTimeHours,
            }
          : null,
        allSeverityTargets,
        deadlineBreached: hoursUntilDeadline < 0,
        hoursUntilDeadline,
      });
    }

    return result;
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
   * @returns Created SlaPolicyWithDisplayName
   * @throws SlaForbiddenError if actor lacks permission
   * @throws SlaError if user-scoping rules are violated
   */
  async createPolicy(
    data: CreateSlaPolicyData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<SlaPolicyWithDisplayName> {
    const canCreate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.SLA_POLICIES_CREATE,
      options
    );
    if (!canCreate) throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);

    if (data.userId !== null) {
      await this.assertValidUserScope(data.userId, options);
    }

    const policy = await this.slaPoliciesDAO.create(
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

    return this.attachDisplayName(policy, options);
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
   * @returns SlaPolicyWithDisplayName
   * @throws SlaError if not found
   * @throws SlaForbiddenError if actor cannot see the policy
   */
  async getPolicy(
    slaPolicyId: SlaPolicyId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<SlaPolicyWithDisplayName> {
    const policy = await this.slaPoliciesDAO.getById(slaPolicyId, options);
    if (!policy) throw new SlaError(SLA_ERROR_MSGS.NOT_FOUND, 404);

    await this.assertReadAccess(policy, actorId, options);

    return this.attachDisplayName(policy, options);
  }

  /**
   * List SLA policies.
   *
   * Visibility:
   *   - Staff: all policies
   *   - Customer with org membership: only their org's policy
   *   - Customer without org membership: only their user-scoped policy
   *
   * Display names are resolved in a single batch per scope type to avoid N+1 queries.
   *
   * @param actorId Actor requesting
   * @param options Optional transaction context
   * @returns Array of SlaPolicyWithDisplayName
   */
  async listPolicies(
    actorId: UserId,
    options?: TransactionContext
  ): Promise<SlaPolicyWithDisplayName[]> {
    const canReadAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.SLA_POLICIES_READ,
      options
    );

    const policies = canReadAll
      ? await this.slaPoliciesDAO.getAll(options)
      : await this.getCustomerPolicies(actorId, options);

    return this.attachDisplayNames(policies, options);
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
   * @returns Updated SlaPolicyWithDisplayName
   * @throws SlaForbiddenError if actor lacks permission
   * @throws SlaError if not found or date range is invalid
   */
  async updatePolicy(
    slaPolicyId: SlaPolicyId,
    data: UpdateSlaPolicyData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<SlaPolicyWithDisplayName> {
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
    return this.attachDisplayName(updated, options);
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

  /**
   * Find the first active SLA policy covering a ticket.
   * Prefers org-scoped lookup; falls back to user-scoped when no org is set.
   */
  private async findPolicyForTicket(
    ticket: Ticket,
    options?: TransactionContext
  ): Promise<SlaPolicy | null> {
    const now = new Date();

    if (ticket.organization_id !== null) {
      const policies = await this.slaPoliciesDAO.findByOrg(ticket.organization_id, options);
      return (
        policies.find((p) => p.is_active && p.effective_from <= now && p.effective_to >= now) ??
        null
      );
    }

    const policies = await this.slaPoliciesDAO.findByUser(ticket.creator_user_id, options);
    return (
      policies.find((p) => p.is_active && p.effective_from <= now && p.effective_to >= now) ?? null
    );
  }

  /**
   * Attach a scopeDisplayName to a single policy.
   */
  private async attachDisplayName(
    policy: SlaPolicy,
    options?: TransactionContext
  ): Promise<SlaPolicyWithDisplayName> {
    const [result] = await this.attachDisplayNames([policy], options);
    // attachDisplayNames always returns one entry per input

    return result;
  }

  /**
   * Batch-resolve display names for a list of policies.
   * Collects all distinct org IDs and user IDs, fetches in two parallel
   * queries, then maps back -- O(1) queries regardless of list length.
   */
  private async attachDisplayNames(
    policies: SlaPolicy[],
    options?: TransactionContext
  ): Promise<SlaPolicyWithDisplayName[]> {
    const orgIds = [
      ...new Set(
        policies.filter((p) => p.organization_id !== null).map((p) => p.organization_id as string)
      ),
    ];

    const userIds = [
      ...new Set(policies.filter((p) => p.user_id !== null).map((p) => p.user_id as string)),
    ];

    const [orgs, users] = await Promise.all([
      orgIds.length > 0
        ? this.orgsDAO.getByManyIds(orgIds as OrganizationId[], options)
        : Promise.resolve([]),
      userIds.length > 0
        ? this.usersDAO.getByManyIds(userIds as UserId[], options)
        : Promise.resolve([]),
    ]);

    const orgNameById = new Map(orgs.map((o) => [o.id as string, o.name]));
    const userDisplayById = new Map(
      users.map((u) => [u.id as string, `${u.first_name} ${u.last_name} (${u.email})`])
    );

    return policies.map((policy) => {
      let scopeDisplayName: string;

      if (policy.organization_id !== null) {
        scopeDisplayName =
          orgNameById.get(policy.organization_id as string) ??
          `Org ${policy.organization_id as string}`;
      } else {
        scopeDisplayName =
          userDisplayById.get(policy.user_id as string) ?? `User ${policy.user_id as string}`;
      }

      return { ...policy, scopeDisplayName };
    });
  }

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
   */
  private async assertIsCustomer(user: User): Promise<void> {
    const role = await this.rolesDAO.getById(user.role_id);
    if (role?.name !== AUTH_ROLES.CUSTOMER) {
      throw new SlaError(SLA_ERROR_MSGS.TARGET_USER_NOT_CUSTOMER, 422);
    }
  }

  /**
   * Assert that the actor can read the given policy.
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

    if (policy.user_id !== null) {
      if ((policy.user_id as string) === (actorId as string)) return;
      throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);
    }

    if (policy.organization_id !== null) {
      const isMember = await this.orgMembersDAO.isMember(actorId, policy.organization_id, options);
      if (isMember) return;
      throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);
    }

    throw new SlaForbiddenError(SLA_ERROR_MSGS.FORBIDDEN);
  }

  /**
   * Return the SLA policies visible to a customer.
   */
  private async getCustomerPolicies(
    actorId: UserId,
    options?: TransactionContext
  ): Promise<SlaPolicy[]> {
    const memberships = await this.orgMembersDAO.findByUser(actorId, options);

    if (memberships !== null && memberships.length > 0) {
      return this.slaPoliciesDAO.findByOrg(memberships[0].organization_id, options);
    }

    return this.slaPoliciesDAO.findByUser(actorId, options);
  }
}
