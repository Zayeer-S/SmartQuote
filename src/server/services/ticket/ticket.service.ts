import { PERMISSIONS, TICKET_STATUSES } from '../../../shared/constants';
import type { Knex } from 'knex';
import type { GetManyOptions, InsertData, TransactionContext } from '../../daos/base/types.js';
import type { TicketsDAO } from '../../daos/children/tickets-domain.dao.js';
import type { UsersDAO } from '../../daos/children/users-domain.dao.js';
import type { OrganizationId, TicketId, UserId } from '../../database/types/ids.js';
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
import type { AttachmentService } from './attachment.service.js';
import type { IncomingFile } from '../storage/storage.service.types.js';
import { OrganizationMembersDAO } from '../../daos/children/organizations-domain.dao.js';
import type { TicketSimilarityService } from './ticket.similarity.service.js';
import type { NotificationService } from '../notification/notification.service.js';

export class TicketService {
  private db: Knex;
  private ticketsDAO: TicketsDAO;
  private usersDAO: UsersDAO;
  private orgMembersDAO: OrganizationMembersDAO;
  private rbacService: RBACService;
  private lookup: LookupResolver;
  private priorityEngine: TicketPriorityEngine;
  private attachmentService: AttachmentService;
  private similarityService: TicketSimilarityService;
  private notificationService: NotificationService;

  constructor(
    db: Knex,
    ticketsDAO: TicketsDAO,
    usersDAO: UsersDAO,
    orgMembersDAO: OrganizationMembersDAO,
    rbacService: RBACService,
    lookup: LookupResolver,
    priorityEngine: TicketPriorityEngine,
    attachmentService: AttachmentService,
    similarityService: TicketSimilarityService,
    notificationService: NotificationService
  ) {
    this.db = db;
    this.ticketsDAO = ticketsDAO;
    this.usersDAO = usersDAO;
    this.orgMembersDAO = orgMembersDAO;
    this.rbacService = rbacService;
    this.lookup = lookup;
    this.priorityEngine = priorityEngine;
    this.attachmentService = attachmentService;
    this.similarityService = similarityService;
    this.notificationService = notificationService;
  }

  /**
   * @param data Ticket fields supplied by the user
   * @param actorId ID of the user creating the ticket
   * @param files Optional pre-validated files from the multipart request
   * @returns Created ticket
   * @throws TicketError if actor has no organization
   */
  async createTicket(
    data: CreateTicketData,
    actorId: UserId,
    files: IncomingFile[] = []
  ): Promise<Ticket> {
    const canCreate = await this.rbacService.hasPermission(actorId, PERMISSIONS.TICKETS_CREATE);
    if (!canCreate) throw new ForbiddenError(TICKET_ERROR_MSGS.FORBIDDEN);

    const actor = await this.usersDAO.getById(actorId);
    if (!actor) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    const orgId = await this.getOrgId(actor.id);

    const ticketPriorityId = await this.priorityEngine.calculatePriority({
      ticketSeverity: this.lookup.ticketSeverityName(data.ticket_severity_id as unknown as number),
      businessImpact: this.lookup.businessImpactName(data.business_impact_id as unknown as number),
      usersImpacted: data.users_impacted,
      deadline: data.deadline,
      description: data.description,
    });

    // Step 1: open an explicit transaction so the ticket row and attachment
    // records are committed atomically. Storage writes happen AFTER commit
    // since storage is not transactional.
    let ticket!: Ticket;

    const pendingUploads = await this.db.transaction(async (trx) => {
      const ctx: TransactionContext = { trx };

      ticket = await this.ticketsDAO.create(
        {
          ...data,
          creator_user_id: actorId,
          organization_id: orgId,
          ticket_status_id: this.lookup.ticketStatusId(TICKET_STATUSES.OPEN),
          ticket_priority_id: ticketPriorityId,
          assigned_to_user_id: null,
          resolved_by_user_id: null,
          resolved_at: null,
          deleted_at: null,
        } satisfies InsertData<Ticket>,
        ctx
      );

      return this.attachmentService.persistAttachmentRecords(files, ticket.id, actorId, ctx);
    });

    // Step 2: upload files to storage now that the transaction has committed.
    if (pendingUploads.length > 0) {
      await this.attachmentService.uploadAttachments(pendingUploads);
    }

    // Step 3: compute and store embedding. Fire-and-forget -- failure must
    // never affect the ticket creation result.
    void this.similarityService.computeAndStoreEmbedding(ticket.id, ticket.description);

    // Step 4: notify the creator. Fire-and-forget -- a notification failure
    // must never affect the ticket creation result.
    void this.notificationService.notifyTicketReceived({
      ticketId: ticket.id as string,
      ticketTitle: ticket.title,
      ticketDescription: ticket.description,
      ticketType: this.lookup.ticketTypeName(ticket.ticket_type_id as unknown as number),
      severity: this.lookup.ticketSeverityName(ticket.ticket_severity_id as unknown as number),
      createdAt: ticket.created_at,
      userId: actor.id as string,
      userEmail: actor.email,
      userFirstName: actor.first_name,
    });

    return ticket;
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
    if (!actor) return [];

    const orgId = await this.getOrgId(actor.id);

    const criteria: Partial<Ticket> = { organization_id: orgId };
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

    // Fetch the creator before updating so we have their details for the notification.
    const creator = await this.usersDAO.getById(ticket.creator_user_id, options);

    await this.ticketsDAO.update(
      { id: ticketId },
      {
        resolved_by_user_id: actorId,
        resolved_at: new Date(),
        ticket_status_id: this.lookup.ticketStatusId(TICKET_STATUSES.RESOLVED),
      },
      options
    );

    const updated = await this.ticketsDAO.getById(ticketId, options);
    if (!updated) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    // Notify the ticket creator. Fire-and-forget -- failure must not affect
    // the resolve result. Skip silently if the creator record is missing.
    if (creator) {
      const resolver = await this.usersDAO.getById(actorId, options);
      void this.notificationService.notifyTicketResolved({
        ticketId: updated.id as string,
        ticketTitle: updated.title,
        resolvedBy: resolver ? `${resolver.first_name} ${resolver.last_name}` : 'Support Team',
        resolvedAt: updated.resolved_at ?? new Date(),
        userId: creator.id as string,
        userEmail: creator.email,
        userFirstName: creator.first_name,
      });
    }

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
    if (!actor) throw new ForbiddenError(TICKET_ERROR_MSGS.ASSIGNEE_NOT_FOUND);

    const orgId = await this.getOrgId(actor.id);

    if (orgId !== ticket.organization_id) throw new ForbiddenError(TICKET_ERROR_MSGS.FORBIDDEN);
  }

  private async getOrgId(actorId: UserId): Promise<OrganizationId | null> {
    const orgMemberships = await this.orgMembersDAO.findByUser(actorId);

    if (orgMemberships && orgMemberships.length > 0) {
      return orgMemberships[0].organization_id;
    }

    return null;
  }
}
