import { PERMISSIONS, TICKET_STATUSES } from '../../../shared/constants';
import type { GetManyOptions, InsertData, TransactionContext } from '../../daos/base/types.js';
import type { TicketsDAO } from '../../daos/children/tickets.dao.js';
import type { UsersDAO } from '../../daos/children/users.dao.js';
import type { TicketId, UserId } from '../../database/types/ids.js';
import type { Ticket, TicketWithDetails } from '../../database/types/tables.js';
import type { RBACService } from '../rbac/rbac.service.js';
import type { LookupResolver } from '../../lib/lookup-resolver.js';
import { ForbiddenError, TICKET_ERROR_MSGS, TicketError } from './ticket.errors.js';
import type {
  CreateTicketData,
  ListTicketsFilters,
  UpdateTicketData,
} from './ticket.service.types.js';
import type { TicketPriorityEngine } from './ticket.priority.engine.js';

export class TicketService {
  private ticketsDAO: TicketsDAO;
  private usersDAO: UsersDAO;
  private rbacService: RBACService;
  private lookup: LookupResolver;
  private priorityEngine: TicketPriorityEngine;

  constructor(
    ticketsDAO: TicketsDAO,
    usersDAO: UsersDAO,
    rbacService: RBACService,
    lookup: LookupResolver,
    priorityEngine: TicketPriorityEngine
  ) {
    this.ticketsDAO = ticketsDAO;
    this.usersDAO = usersDAO;
    this.rbacService = rbacService;
    this.lookup = lookup;
    this.priorityEngine = priorityEngine;
  }

  /**
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

    const ticketPriorityId = await this.priorityEngine.calculatePriority({
      ticketSeverity: this.lookup.ticketSeverityName(data.ticket_severity_id as unknown as number),
      businessImpact: this.lookup.businessImpactName(data.business_impact_id as unknown as number),
      usersImpacted: data.users_impacted,
      deadline: data.deadline,
      description: data.description,
    });

    return this.ticketsDAO.create(
      {
        ...data,
        creator_user_id: actorId,
        organization_id: actor.organization_id,
        ticket_status_id: this.lookup.ticketStatusId(TICKET_STATUSES.OPEN),
        ticket_priority_id: ticketPriorityId,
        assigned_to_user_id: null,
        resolved_by_user_id: null,
        deleted_at: null,
      } satisfies InsertData<Ticket>,
      options
    );
  }

  /**
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
   * @param filters Optional filters: organizationId, statusId, assigneeId
   * @param actorId Actor requesting the list
   * @param options Optional query and transaction options
   * @returns Array of matching tickets
   */
  async listTickets(
    filters: ListTicketsFilters,
    actorId: UserId,
    options?: GetManyOptions
  ): Promise<TicketWithDetails[]> {
    const canReadAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_READ_ALL,
      options
    );

    if (canReadAll) {
      const criteria: Partial<Ticket> = {};
      if (filters.organizationId) criteria.organization_id = filters.organizationId;
      if (filters.ticketStatus)
        criteria.ticket_status_id = this.lookup.ticketStatusId(filters.ticketStatus);
      if (filters.assigneeId) criteria.assigned_to_user_id = filters.assigneeId;
      return this.ticketsDAO.findManyWithDetails(criteria, options);
    }

    const actor = await this.usersDAO.getById(actorId, options);
    if (!actor?.organization_id) return [];

    const criteria: Partial<Ticket> = { organization_id: actor.organization_id };
    if (filters.ticketStatus)
      criteria.ticket_status_id = this.lookup.ticketStatusId(filters.ticketStatus);

    return this.ticketsDAO.findManyWithDetails(criteria, options);
  }

  /**
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

    const openStatusId = this.lookup.ticketStatusId(TICKET_STATUSES.OPEN);
    if ((ticket.ticket_status_id as unknown as number) !== (openStatusId as unknown as number))
      throw new TicketError(TICKET_ERROR_MSGS.CANNOT_UPDATE, 422);

    const { ticket_status_id, assigned_to_user_id, ...customerFields } = data;
    void ticket_status_id;
    void assigned_to_user_id;

    await this.ticketsDAO.update({ id: ticketId }, customerFields, options);
    const updated = await this.ticketsDAO.getById(ticketId, options);
    if (!updated) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
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
        ticket_status_id: this.lookup.ticketStatusId(TICKET_STATUSES.ASSIGNED),
      },
      options
    );

    const updated = await this.ticketsDAO.getById(ticketId, options);
    if (!updated) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
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
        ticket_status_id: this.lookup.ticketStatusId(TICKET_STATUSES.RESOLVED),
      },
      options
    );

    const updated = await this.ticketsDAO.getById(ticketId, options);
    if (!updated) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
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
