import { PERMISSIONS } from '../../../shared/constants';
import type { GetManyOptions, InsertData, TransactionContext } from '../../daos/base/types';
import type { TicketsDAO } from '../../daos/children/tickets.dao';
import type { UsersDAO } from '../../daos/children/users.dao';
import type { TicketId, UserId } from '../../database/types/ids';
import type { Ticket, TicketWithDetails } from '../../database/types/tables';
import type { RBACService } from '../rbac/rbac.service';
import { ForbiddenError, TICKET_ERROR_MSGS, TicketError } from './ticket.errors';
import type { CreateTicketData, ListTicketsFilters, UpdateTicketData } from './ticket.types';

export class TicketService {
  private ticketsDAO: TicketsDAO;
  private usersDAO: UsersDAO;
  private rbacService: RBACService;

  constructor(ticketsDAO: TicketsDAO, usersDAO: UsersDAO, rbacService: RBACService) {
    this.ticketsDAO = ticketsDAO;
    this.usersDAO = usersDAO;
    this.rbacService = rbacService;
  }

  /**
   * Create a new ticket.
   * Organization is sourced from the actor's own organization_id.
   * Initial status is OPEN. Priority defaults to P3 — overridden later by the quote engine.
   *
   * @param data Ticket fields supplied by the user
   * @param actorId ID of the user creating the ticket
   * @param options Optional transaction context
   * @returns Created ticket
   * @throws TicketError if actor has no organization
   */
  async createTicket(
    data: CreateTicketData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Ticket> {
    const canCreate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_CREATE,
      options
    );
    if (!canCreate) throw new ForbiddenError(TICKET_ERROR_MSGS.FORBIDDEN);

    const actor = await this.usersDAO.getById(actorId, options);
    if (!actor) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);
    if (!actor.organization_id)
      throw new TicketError(`Actor does not belong to an organization`, 422);

    return this.ticketsDAO.create(
      {
        ...data,
        creator_user_id: actorId,
        organization_id: actor.organization_id,
        ticket_type_id: data.ticket_type_id,
        ticket_severity_id: data.ticket_severity_id,
        business_impact_id: data.business_impact_id,
        // Status OPEN (id=1). Priority P3 (id=3). Both are seeded lookup values —
        // the quote engine will update priority after generating a quote.
        // Using literal seed IDs here is intentional: these are fixed bootstrap values.
        ticket_status_id: 1 as unknown as Ticket['ticket_status_id'],
        ticket_priority_id: 3 as unknown as Ticket['ticket_priority_id'],
        assigned_to_user_id: null,
        resolved_by_user_id: null,
        deleted_at: null,
      } satisfies InsertData<Ticket>,
      options
    );
  }

  /**
   * Get a single ticket with full lookup details joined.
   * Customers may only access tickets in their own organisation.
   *
   * @param ticketId Ticket to retrieve
   * @param actorId Actor requesting the ticket
   * @param options Optional transaction context
   * @returns TicketWithDetails
   * @throws TicketError if not found
   * @throws ForbiddenError if customer accesses outside their org
   */
  async getTicket(
    ticketId: TicketId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<TicketWithDetails> {
    const ticket = await this.ticketsDAO.findWithDetails(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    await this.assertVisibility(ticket, actorId, options);

    return ticket;
  }

  /**
   * List tickets with optional filters.
   * Customers are always scoped to their own organisation regardless of filters.
   * Agents and admins may filter freely.
   *
   * @param filters Optional filters: organizationId, statusId, assigneeId
   * @param actorId Actor requesting the list
   * @param options Optional query and transaction options
   * @returns Array of matching tickets
   */
  async listTickets(
    filters: ListTicketsFilters,
    actorId: UserId,
    options?: GetManyOptions
  ): Promise<Ticket[]> {
    const canReadAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_READ_ALL,
      options
    );

    if (canReadAll) {
      const criteria: Partial<Ticket> = {};
      if (filters.organizationId) criteria.organization_id = filters.organizationId;
      if (filters.statusId) criteria.ticket_status_id = filters.statusId;
      if (filters.assigneeId) criteria.assigned_to_user_id = filters.assigneeId;
      return this.ticketsDAO.getMany(criteria, options);
    }

    const actor = await this.usersDAO.getById(actorId, options);
    if (!actor?.organization_id) return [];

    const criteria: Partial<Ticket> = { organization_id: actor.organization_id };
    if (filters.statusId) criteria.ticket_status_id = filters.statusId;

    return this.ticketsDAO.getMany(criteria, options);
  }

  /**
   * Update a ticket.
   * Customers may only update their own tickets while status is OPEN,
   * and may not touch agent-only fields (status, assignee).
   * Agents may update any ticket and any field.
   *
   * @param ticketId Ticket to update
   * @param data Fields to update
   * @param actorId Actor performing the update
   * @param options Optional transaction context
   * @returns Updated ticket
   * @throws TicketError if not found or status prevents update
   * @throws ForbiddenError if actor lacks permission
   */
  async updateTicket(
    ticketId: TicketId,
    data: UpdateTicketData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Ticket> {
    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    const canUpdateAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_UPDATE_ALL,
      options
    );

    if (canUpdateAll) {
      await this.ticketsDAO.update({ id: ticketId }, data, options);
      const updated = await this.ticketsDAO.getById(ticketId, options);
      if (!updated) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);
      return updated;
    }

    const canUpdateOwn = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_UPDATE_OWN,
      options
    );
    if (!canUpdateOwn) throw new ForbiddenError(TICKET_ERROR_MSGS.FORBIDDEN);

    await this.assertVisibility(ticket, actorId, options);

    // Customers can only edit OPEN tickets (status id=1)
    if ((ticket.ticket_status_id as unknown as number) !== 1)
      throw new TicketError(TICKET_ERROR_MSGS.CANNOT_UPDATE, 422);

    // Strip agent-only fields from customer updates
    const { ticket_status_id, assigned_to_user_id, ...customerFields } = data;
    void ticket_status_id;
    void assigned_to_user_id;

    await this.ticketsDAO.update({ id: ticketId }, customerFields, options);
    const updated = await this.ticketsDAO.getById(ticketId, options);
    if (!updated) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
   * Assign a ticket to a user. Sets status to ASSIGNED.
   * Requires TICKETS_ASSIGN permission.
   *
   * @param ticketId Ticket to assign
   * @param assigneeId User to assign to
   * @param actorId Actor performing the assignment
   * @param options Optional transaction context
   * @returns Updated ticket
   * @throws ForbiddenError if actor lacks TICKETS_ASSIGN
   * @throws TicketError if ticket or assignee not found
   */
  async assignTicket(
    ticketId: TicketId,
    assigneeId: UserId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Ticket> {
    const canAssign = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_ASSIGN,
      options
    );
    if (!canAssign) throw new ForbiddenError(TICKET_ERROR_MSGS.FORBIDDEN);

    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    const assignee = await this.usersDAO.getById(assigneeId, options);
    if (!assignee) throw new TicketError(TICKET_ERROR_MSGS.ASSIGNEE_NOT_FOUND, 404);

    await this.ticketsDAO.update(
      { id: ticketId },
      {
        assigned_to_user_id: assigneeId,
        ticket_status_id: 2 as unknown as Ticket['ticket_status_id'],
      },
      options
    );

    const updated = await this.ticketsDAO.getById(ticketId, options);
    if (!updated) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
   * Resolve a ticket. Sets status to RESOLVED and records the resolver.
   * Requires TICKETS_UPDATE_ALL permission.
   *
   * @param ticketId Ticket to resolve
   * @param actorId Actor resolving the ticket
   * @param options Optional transaction context
   * @returns Updated ticket
   * @throws ForbiddenError if actor lacks permission
   * @throws TicketError if ticket not found
   */
  async resolveTicket(
    ticketId: TicketId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Ticket> {
    const canResolve = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_UPDATE_ALL,
      options
    );
    if (!canResolve) throw new ForbiddenError(TICKET_ERROR_MSGS.FORBIDDEN);

    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    await this.ticketsDAO.update(
      { id: ticketId },
      {
        resolved_by_user_id: actorId,
        ticket_status_id: 4 as unknown as Ticket['ticket_status_id'],
      },
      options
    );

    const updated = await this.ticketsDAO.getById(ticketId, options);
    if (!updated) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
   * Soft-delete a ticket.
   *
   * @param ticketId Ticket to delete
   * @param actorId Actor performing the deletion
   * @param options Optional transaction context
   * @throws ForbiddenError if actor lacks permission
   * @throws TicketError if ticket not found
   */
  async deleteTicket(
    ticketId: TicketId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const canDelete = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_DELETE_ALL,
      options
    );
    if (!canDelete) throw new ForbiddenError(TICKET_ERROR_MSGS.FORBIDDEN);

    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    await this.ticketsDAO.delete(ticketId, options);
  }

  /** Assert that the actor can see this ticket */
  private async assertVisibility(
    ticket: Ticket,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const canReadAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_READ_ALL,
      options
    );
    if (canReadAll) return;

    const actor = await this.usersDAO.getById(actorId, options);
    if (actor?.organization_id !== ticket.organization_id)
      throw new ForbiddenError(TICKET_ERROR_MSGS.FORBIDDEN);
  }
}
