import type { QuotesDAO } from '../../daos/children/quotes.dao';
import type { TicketsDAO } from '../../daos/children/tickets.dao';
import type { UsersDAO } from '../../daos/children/users.dao';
import type { RBACService } from '../rbac/rbac.service';
import type {
  Quote,
  QuoteApproval,
  QuoteDetailRevision,
  QuoteWithApproval,
} from '../../database/types/tables';
import type {
  QuoteApprovalId,
  QuoteApprovalStatusId,
  QuoteConfidenceId,
  QuoteEffortLevelId,
  QuoteId,
  TicketId,
  UserId,
} from '../../database/types/ids';
import type { InsertData, TransactionContext } from '../../daos/base/types';
import { PERMISSIONS } from '../../../shared/constants/lookup-values';
import type { QuoteApprovalsDAO } from '../../daos/children/quote.approvals.dao';
import type { QuoteDetailRevisionsDAO } from '../../daos/children/quote.detail.revisions.dao';
import { ForbiddenError, TICKET_ERROR_MSGS, TicketError } from '../ticket/ticket.errors';
import { QUOTE_ERROR_MSGS, QuoteError } from './quote.errors';

export interface CreateManualQuoteData {
  estimated_hours_minimum: number;
  estimated_hours_maximum: number;
  hourly_rate: number;
  fixed_cost: number;
  quote_effort_level_id: QuoteEffortLevelId;
  quote_confidence_level_id: QuoteConfidenceId | null;
}

export interface UpdateQuoteData {
  estimated_hours_minimum?: number;
  estimated_hours_maximum?: number;
  hourly_rate?: number;
  fixed_cost?: number;
  quote_effort_level_id?: QuoteEffortLevelId;
  quote_confidence_level_id?: QuoteConfidenceId | null;
}

export class QuoteService {
  private quotesDAO: QuotesDAO;
  private quoteApprovalsDAO: QuoteApprovalsDAO;
  private quoteDetailRevisionsDAO: QuoteDetailRevisionsDAO;
  private ticketsDAO: TicketsDAO;
  private usersDAO: UsersDAO;
  private rbacService: RBACService;

  constructor(
    quotesDAO: QuotesDAO,
    quoteApprovalsDAO: QuoteApprovalsDAO,
    quoteDetailRevisionsDAO: QuoteDetailRevisionsDAO,
    ticketsDAO: TicketsDAO,
    usersDAO: UsersDAO,
    rbacService: RBACService
  ) {
    this.quotesDAO = quotesDAO;
    this.quoteApprovalsDAO = quoteApprovalsDAO;
    this.quoteDetailRevisionsDAO = quoteDetailRevisionsDAO;
    this.ticketsDAO = ticketsDAO;
    this.usersDAO = usersDAO;
    this.rbacService = rbacService;
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
  ): Promise<Quote[]> {
    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    await this.assertTicketVisibility(ticket, actorId, options);

    return this.quotesDAO.findByTicket(ticketId, options);
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

    return this.quotesDAO.create(
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
        quote_confidence_level_id: data.quote_confidence_level_id ?? null,
        quote_approval_id: null,
        // MANUAL creator (id=1), P3 priority (id=3) - defaults until engine runs
        quote_creator_id: 1 as unknown as Quote['quote_creator_id'],
        suggested_ticket_priority_id: ticket.ticket_priority_id,
        quote_effort_level_id: data.quote_effort_level_id,
        deleted_at: null,
      } satisfies InsertData<Quote>,
      options
    );
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

    const mergedMin = data.estimated_hours_minimum ?? existing.estimated_hours_minimum;
    const mergedMax = data.estimated_hours_maximum ?? existing.estimated_hours_maximum;
    if (mergedMax < mergedMin) throw new QuoteError(QUOTE_ERROR_MSGS.MIN_MAX_HOURS, 422);

    // Build the new version's data by merging changes onto the existing quote
    const hourly = data.hourly_rate ?? existing.hourly_rate;
    const fixed = data.fixed_cost ?? existing.fixed_cost;
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
        data.quote_confidence_level_id !== undefined
          ? data.quote_confidence_level_id
          : existing.quote_confidence_level_id,
      quote_approval_id: null, // new version starts without an approval
      quote_creator_id: existing.quote_creator_id,
      suggested_ticket_priority_id: existing.suggested_ticket_priority_id,
      quote_effort_level_id: data.quote_effort_level_id ?? existing.quote_effort_level_id,
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

    return newQuote;
  }

  /**
   * Submit a quote for approval by creating a PENDING QuoteApproval record
   * and linking it to the quote.
   * Requires QUOTES_CREATE permission (the submitter is the quote author).
   *
   * @param quoteId Quote to submit
   * @param actorId Actor submitting
   * @param options Optional transaction context
   * @returns Created QuoteApproval
   * @throws ForbiddenError if actor lacks permission
   * @throws QuoteError if quote not found
   */
  async submitForApproval(
    quoteId: QuoteId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canCreate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_CREATE,
      options
    );
    if (!canCreate) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const quote = await this.quotesDAO.getById(quoteId, options);
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);

    const actor = await this.usersDAO.getById(actorId, options);
    if (!actor) throw new QuoteError('Actor not found', 404);

    const actorWithRole = actor as typeof actor & { role?: { name: string } };

    const approval = await this.quoteApprovalsDAO.create(
      {
        approved_by_user_id: actorId,
        user_role: actorWithRole.role?.name ?? 'unknown',
        approval_status_id: 1 as unknown as QuoteApprovalStatusId,
        comment: null,
        approved_at: null,
      } satisfies InsertData<QuoteApproval>,
      options
    );

    await this.quotesDAO.update(
      { id: quoteId },
      { quote_approval_id: approval.id as unknown as QuoteApprovalId },
      options
    );

    return approval;
  }

  /**
   * Approve a quote by updating its approval record to APPROVED.
   * Requires QUOTES_APPROVE permission.
   *
   * @param quoteId Quote to approve
   * @param actorId Actor approving
   * @param comment Optional approval comment
   * @param options Optional transaction context
   * @returns Updated QuoteApproval
   * @throws ForbiddenError if actor lacks permission
   * @throws QuoteError if quote not found or not in PENDING state
   */
  async approveQuote(
    quoteId: QuoteId,
    actorId: UserId,
    comment: string | null,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canApprove = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_APPROVE,
      options
    );
    if (!canApprove) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const quote = await this.quotesDAO.getById(quoteId, options);
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    if (!quote.quote_approval_id) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);

    const approval = await this.quoteApprovalsDAO.getById(quote.quote_approval_id, options);
    if (!approval) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);

    // PENDING = 1, APPROVED = 2
    if ((approval.approval_status_id as unknown as number) === 2) {
      throw new QuoteError(QUOTE_ERROR_MSGS.ALREADY_APPROVED, 422);
    }
    if ((approval.approval_status_id as unknown as number) !== 1) {
      throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);
    }

    await this.quoteApprovalsDAO.update(
      { id: quote.quote_approval_id },
      {
        approval_status_id: 2 as unknown as QuoteApprovalStatusId,
        approved_at: new Date(),
        comment,
      },
      options
    );

    const updated = await this.quoteApprovalsDAO.getById(quote.quote_approval_id, options);
    if (!updated) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
   * Reject a quote by updating its approval record to REJECTED.
   * Requires QUOTES_REJECT permission.
   *
   * @param quoteId Quote to reject
   * @param comment Mandatory rejection reason
   * @param actorId Actor rejecting
   * @param options Optional transaction context
   * @returns Updated QuoteApproval
   * @throws ForbiddenError if actor lacks permission
   * @throws QuoteError if quote not found or not in PENDING state
   */
  async rejectQuote(
    quoteId: QuoteId,
    comment: string,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canReject = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_REJECT,
      options
    );
    if (!canReject) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const quote = await this.quotesDAO.getById(quoteId, options);
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    if (!quote.quote_approval_id) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);

    const approval = await this.quoteApprovalsDAO.getById(quote.quote_approval_id, options);
    if (!approval) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);

    // Only PENDING (id=1) quotes may be rejected
    if ((approval.approval_status_id as unknown as number) !== 1) {
      throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);
    }

    // REJECTED = 3
    await this.quoteApprovalsDAO.update(
      { id: quote.quote_approval_id },
      {
        approval_status_id: 3 as unknown as QuoteApprovalStatusId,
        comment,
        approved_at: new Date(),
      },
      options
    );

    const updated = await this.quoteApprovalsDAO.getById(quote.quote_approval_id, options);
    if (!updated) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
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

  // ─── Private Helpers ───────────────────────────────────────────────────────

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
    oldQuoteId: QuoteId,
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
      const oldVal = String(old[field as keyof Quote] ?? '');
      const newVal = String(next[field] ?? '');
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
    const t = ticket as { organization_id: unknown };
    if (actor?.organization_id !== t.organization_id) {
      throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);
    }
  }
}
