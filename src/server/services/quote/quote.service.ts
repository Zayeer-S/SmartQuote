import type { QuoteDetailRevisionsDAO, QuotesDAO } from '../../daos/children/quotes-domain.dao.js';
import type { TicketsDAO } from '../../daos/children/tickets-domain.dao.js';
import type { UsersDAO } from '../../daos/children/users-domain.dao.js';
import type { RBACService } from '../rbac/rbac.service.js';
import type { Quote, QuoteDetailRevision, QuoteWithApproval } from '../../database/types/tables.js';
import type { OrganizationId, QuoteId, TicketId, UserId } from '../../database/types/ids.js';
import type { InsertData, TransactionContext } from '../../daos/base/types.js';
import { PERMISSIONS, QUOTE_CREATORS } from '../../../shared/constants/lookup-values.js';
import type {
  QuoteConfidenceLevel,
  QuoteEffortLevel,
} from '../../../shared/constants/lookup-values.js';
import { ForbiddenError, TICKET_ERROR_MSGS, TicketError } from '../ticket/ticket.errors.js';
import { QUOTE_ERROR_MSGS, QuoteError } from './quote.errors.js';
import type { LookupResolver } from '../../lib/lookup-resolver.js';
import { OrganizationMembersDAO } from '../../daos/children/organizations-domain.dao.js';
import { eventBus } from '../../lib/event-bus.js';

export interface CreateManualQuoteData {
  estimated_hours_minimum: number;
  estimated_hours_maximum: number;
  hourly_rate: number;
  fixed_cost: number;
  quote_effort_level: QuoteEffortLevel;
  quote_confidence_level: QuoteConfidenceLevel | null;
}

export interface UpdateQuoteData {
  estimated_hours_minimum?: number;
  estimated_hours_maximum?: number;
  hourly_rate?: number;
  fixed_cost?: number;
  quote_effort_level?: QuoteEffortLevel;
  quote_confidence_level?: QuoteConfidenceLevel | null;
}

export class QuoteService {
  private quotesDAO: QuotesDAO;
  private quoteDetailRevisionsDAO: QuoteDetailRevisionsDAO;
  private ticketsDAO: TicketsDAO;
  private usersDAO: UsersDAO;
  private orgMembersDAO: OrganizationMembersDAO;
  private rbacService: RBACService;
  private lookup: LookupResolver;

  constructor(
    quotesDAO: QuotesDAO,
    quoteDetailRevisionsDAO: QuoteDetailRevisionsDAO,
    ticketsDAO: TicketsDAO,
    usersDAO: UsersDAO,
    orgMembersDAO: OrganizationMembersDAO,
    rbacService: RBACService,
    lookup: LookupResolver
  ) {
    this.quotesDAO = quotesDAO;
    this.quoteDetailRevisionsDAO = quoteDetailRevisionsDAO;
    this.ticketsDAO = ticketsDAO;
    this.usersDAO = usersDAO;
    this.orgMembersDAO = orgMembersDAO;
    this.rbacService = rbacService;
    this.lookup = lookup;
  }

  /**
   * Get a single quote with its approval status joined.
   * Customers may only see quotes for tickets in their own organisation.
   *
   * @param quoteId Quote to retrieve
   * @param actorId Actor requesting the quote
   * @param options Optional transaction context
   * @returns QuoteWithApproval
   * @throws QuoteError if not found
   * @throws ForbiddenError if customer accesses outside their org
   */
  async getQuote(
    quoteId: QuoteId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<QuoteWithApproval> {
    const quote = await this.quotesDAO.findWithApproval(quoteId, options);
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);

    await this.assertQuoteVisibility(quote, actorId, options);

    return quote;
  }

  /**
   * List all quotes for a ticket, newest version first.
   * Applies the same organisation-scoping as getQuote.
   *
   * @param ticketId Ticket to list quotes for
   * @param actorId Actor requesting
   * @param options Optional transaction context
   * @returns Array of quotes ordered by version descending
   * @throws TicketError if ticket not found
   */
  async listQuotesForTicket(
    ticketId: TicketId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<QuoteWithApproval[]> {
    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    await this.assertTicketVisibility(ticket, actorId, options);

    return this.quotesDAO.findManyWithApproval(ticketId, options);
  }

  /**
   * Create a manual quote for a ticket.
   * Computed fields (estimated_cost, estimated_resolution_time, suggested_ticket_priority_id)
   * are derived from the supplied data.
   * Version is set to latest + 1; quote_creator is MANUAL (id=1).
   *
   * @param ticketId Ticket to quote for
   * @param data Quote fields
   * @param actorId Actor creating the quote
   * @param options Optional transaction context
   * @returns Created quote
   * @throws ForbiddenError if actor lacks QUOTES_CREATE
   * @throws QuoteError if hour range is invalid
   */
  async createManualQuote(
    ticketId: TicketId,
    data: CreateManualQuoteData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Quote> {
    const canCreate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_CREATE,
      options
    );
    if (!canCreate) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    if (data.estimated_hours_maximum < data.estimated_hours_minimum) {
      throw new QuoteError(QUOTE_ERROR_MSGS.MIN_MAX_HOURS, 422);
    }

    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    const nextVersion = await this.resolveNextVersion(ticketId, options);

    const estimatedHoursMid = (data.estimated_hours_minimum + data.estimated_hours_maximum) / 2;
    const estimatedCost = estimatedHoursMid * data.hourly_rate + data.fixed_cost;

    const quote = await this.quotesDAO.create(
      {
        ticket_id: ticketId,
        version: nextVersion,
        estimated_hours_minimum: data.estimated_hours_minimum,
        estimated_hours_maximum: data.estimated_hours_maximum,
        estimated_resolution_time: estimatedHoursMid,
        hourly_rate: data.hourly_rate,
        estimated_cost: estimatedCost,
        fixed_cost: data.fixed_cost,
        final_cost: null,
        quote_confidence_level_id: data.quote_confidence_level
          ? this.lookup.quoteConfidenceLevelId(data.quote_confidence_level)
          : null,
        quote_approval_id: null,
        quote_creator_id: this.lookup.quoteCreatorId(QUOTE_CREATORS.MANUAL),
        suggested_ticket_priority_id: ticket.ticket_priority_id,
        quote_effort_level_id: this.lookup.quoteEffortLevelId(data.quote_effort_level),
        deleted_at: null,
      } satisfies InsertData<Quote>,
      options
    );

    eventBus.emit('quote:created', {
      quoteId: quote.id as string,
      ticketId: ticketId as string,
      version: quote.version,
      event: 'quote:created',
    });

    return quote;
  }

  /**
   * Update a quote by creating a new version.
   * The previous version is soft-deleted. Changed fields are written to
   * quote_detail_revisions for a full audit trail.
   *
   * @param quoteId Quote to update (will be soft-deleted)
   * @param data Fields to update
   * @param reason Mandatory reason for the change
   * @param actorId Actor performing the update
   * @param options Optional transaction context
   * @returns Newly created quote version
   * @throws ForbiddenError if actor lacks QUOTES_UPDATE
   * @throws QuoteError if quote not found or hour range invalid
   */
  async updateQuote(
    quoteId: QuoteId,
    data: UpdateQuoteData,
    reason: string,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Quote> {
    const canUpdate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_UPDATE,
      options
    );
    if (!canUpdate) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const existing = await this.quotesDAO.getById(quoteId, options);
    if (!existing) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
    const mergedMin = data.estimated_hours_minimum ?? Number(existing.estimated_hours_minimum);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
    const mergedMax = data.estimated_hours_maximum ?? Number(existing.estimated_hours_maximum);
    if (mergedMax < mergedMin) throw new QuoteError(QUOTE_ERROR_MSGS.MIN_MAX_HOURS, 422);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
    const hourly = data.hourly_rate ?? Number(existing.hourly_rate);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
    const fixed = data.fixed_cost ?? Number(existing.fixed_cost);
    const midHours = (mergedMin + mergedMax) / 2;

    const newQuoteData: InsertData<Quote> = {
      ticket_id: existing.ticket_id,
      version: existing.version + 1,
      estimated_hours_minimum: mergedMin,
      estimated_hours_maximum: mergedMax,
      estimated_resolution_time: midHours,
      hourly_rate: hourly,
      estimated_cost: midHours * hourly + fixed,
      fixed_cost: fixed,
      final_cost: existing.final_cost,
      quote_confidence_level_id:
        data.quote_confidence_level !== undefined
          ? data.quote_confidence_level
            ? this.lookup.quoteConfidenceLevelId(data.quote_confidence_level)
            : null
          : existing.quote_confidence_level_id,
      quote_approval_id: null,
      quote_creator_id: existing.quote_creator_id,
      suggested_ticket_priority_id: existing.suggested_ticket_priority_id,
      quote_effort_level_id: data.quote_effort_level
        ? this.lookup.quoteEffortLevelId(data.quote_effort_level)
        : existing.quote_effort_level_id,
      deleted_at: null,
    };

    // Persist new version and soft-delete old one in a logical unit.
    // If a transaction was provided by the caller it is used; otherwise each
    // operation runs independently (acceptable for non-critical flows).
    const newQuote = await this.quotesDAO.create(newQuoteData, options);
    await this.quotesDAO.delete(quoteId, options);

    // Record a revision entry for each field that actually changed
    await this.writeRevisions(
      quoteId,
      newQuote.id,
      existing,
      newQuoteData,
      reason,
      actorId,
      options
    );

    eventBus.emit('quote:updated', {
      quoteId: newQuote.id as string,
      ticketId: newQuote.ticket_id as string,
      version: newQuote.version,
      event: 'quote:updated',
    });

    return newQuote;
  }

  /**
   * Get the full revision history for a quote.
   * Applies the same visibility rules as getQuote.
   *
   * @param quoteId Quote to get history for
   * @param actorId Actor requesting
   * @param options Optional transaction context
   * @returns Array of revisions ordered oldest first
   */
  async getRevisionHistory(
    quoteId: QuoteId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<QuoteDetailRevision[]> {
    const quote = await this.quotesDAO.getById(quoteId, { ...options, includeDeleted: true });
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);

    await this.assertQuoteVisibility(quote, actorId, options);

    return this.quoteDetailRevisionsDAO.findByQuote(quoteId, options);
  }

  /** Determine the next version number for a ticket's quotes */
  private async resolveNextVersion(
    ticketId: TicketId,
    options?: TransactionContext
  ): Promise<number> {
    const latest = await this.quotesDAO.findLatestForTicket(ticketId, {
      ...options,
      includeDeleted: true,
    });
    return latest ? latest.version + 1 : 1;
  }

  /**
   * Write a QuoteDetailRevision row for each field that differs between
   * the old and new quote snapshots.
   */
  private async writeRevisions(
    _oldQuoteId: QuoteId,
    newQuoteId: QuoteId,
    old: Quote,
    next: InsertData<Quote>,
    reason: string,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const trackableFields: (keyof InsertData<Quote>)[] = [
      'estimated_hours_minimum',
      'estimated_hours_maximum',
      'hourly_rate',
      'fixed_cost',
      'quote_effort_level_id',
      'quote_confidence_level_id',
    ];

    const revisions: InsertData<QuoteDetailRevision>[] = [];

    for (const field of trackableFields) {
      const oldRaw = old[field as keyof Quote];
      const newRaw = next[field];
      const oldVal = String(Number(oldRaw));
      const newVal = String(Number(newRaw));
      if (oldVal === newVal) continue;

      revisions.push({
        quote_id: newQuoteId,
        changed_by_user_id: actorId,
        field_name: field,
        old_value: oldVal,
        new_value: newVal,
        reason,
      });
    }

    if (revisions.length > 0) {
      await this.quoteDetailRevisionsDAO.createMany(revisions, options);
    }
  }

  /** Assert that the actor can see the ticket this quote belongs to */
  private async assertQuoteVisibility(
    quote: Quote,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const ticket = await this.ticketsDAO.getById(quote.ticket_id, options);
    if (!ticket) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    await this.assertTicketVisibility(ticket, actorId, options);
  }

  private async assertTicketVisibility(
    ticket: { organization_id: Quote['ticket_id'] extends never ? never : unknown },
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const canReadAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_READ_ALL,
      options
    );
    if (canReadAll) return;

    const actor = await this.usersDAO.getById(actorId, options);
    if (!actor) throw new ForbiddenError(QUOTE_ERROR_MSGS.USER_NOT_FOUND);

    const t = ticket as { organization_id: unknown };
    const orgId = await this.getOrgId(actor.id);

    if (orgId !== t.organization_id) {
      throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);
    }
  }

  private async getOrgId(actorId: UserId): Promise<OrganizationId | null> {
    const orgMemberships = await this.orgMembersDAO.findByUser(actorId);

    if (orgMemberships && orgMemberships.length > 0) {
      return orgMemberships[0].organization_id;
    }

    return null;
  }
}
