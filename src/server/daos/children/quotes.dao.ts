import type { Knex } from 'knex';
import { DeletableDAO } from '../base/deletable.dao.js';
import { LOOKUP_TABLES, MAIN_TABLES } from '../../database/config/table-names.js';
import type { Quote, QuoteWithApproval } from '../../database/types/tables.js';
import type { QuoteId, TicketId } from '../../database/types/ids.js';
import type { GetManyOptions, QueryOptions } from '../base/types.js';
import { AnalyticsQuoteAccuracyRow } from '../../database/types/sanitized.types.js';
import { QUOTE_APPROVAL_STATUSES } from '../../../shared/constants/lookup-values.js';

export class QuotesDAO extends DeletableDAO<Quote, QuoteId> {
  constructor(db: Knex) {
    super(
      {
        tableName: MAIN_TABLES.QUOTES,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find all quotes for a ticket, ordered newest version first
   *
   * @param ticketId Ticket ID
   * @param options Query options
   * @returns Array of quotes ordered by version descending
   */
  async findByTicket(ticketId: TicketId, options?: GetManyOptions): Promise<Quote[]> {
    let query = this.getQuery(options);
    query = query.where({ ticket_id: ticketId });
    query = this.applyFilters(query, options);
    query = query.orderBy('version', 'desc');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as Quote[];
  }

  /**
   * Find the most recent (highest version) non-deleted quote for a ticket
   *
   * @param ticketId Ticket ID
   * @param options Query options
   * @returns Most recent quote or null
   */
  async findLatestForTicket(ticketId: TicketId, options?: QueryOptions): Promise<Quote | null> {
    let query = this.getQuery(options);
    query = query.where({ ticket_id: ticketId });
    query = this.applyFilters(query, options);
    query = query.orderBy('version', 'desc').limit(1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await query.first();
    return result ? (result as Quote) : null;
  }

  /**
   * Find a quote with its approval and approval status joined in
   *
   * @param quoteId Quote ID
   * @param options Query options
   * @returns QuoteWithApproval or null if not found
   */
  async findWithApproval(
    quoteId: QuoteId,
    options?: QueryOptions
  ): Promise<QuoteWithApproval | null> {
    const q = MAIN_TABLES.QUOTES;
    const approvals = MAIN_TABLES.QUOTE_APPROVALS;
    const statuses = LOOKUP_TABLES.QUOTE_APPROVAL_STATUSES;

    let query = this.getQuery(options);

    query = query
      .select(
        `${q}.*`,
        `${statuses}.name as approval_status_name`,
        `${approvals}.comment as approval_comment`,
        `${approvals}.approved_at as approved_at`,
        `${approvals}.approved_by_user_id as approved_by_user_id`
      )
      .leftJoin(approvals, `${q}.quote_approval_id`, `${approvals}.id`)
      .leftJoin(statuses, `${approvals}.approval_status_id`, `${statuses}.id`)
      .where(`${q}.id`, quoteId);

    query = this.applyFilters(query, options);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await query.first();
    return result ? (result as QuoteWithApproval) : null;
  }

  /**
   * Find all quotes for a ticket with approval status joined in, newest version first.
   * Quotes without an approval record will have null approval fields.
   *
   * @param ticketId Ticket ID
   * @param options Query options
   * @returns Array of QuoteWithApproval ordered by version descending
   */
  async findManyWithApproval(
    ticketId: TicketId,
    options?: GetManyOptions
  ): Promise<QuoteWithApproval[]> {
    const q = MAIN_TABLES.QUOTES;
    const approvals = MAIN_TABLES.QUOTE_APPROVALS;
    const statuses = LOOKUP_TABLES.QUOTE_APPROVAL_STATUSES;

    let query = this.getQuery(options);

    query = query
      .select(
        `${q}.*`,
        `${statuses}.name as approval_status_name`,
        `${approvals}.comment as approval_comment`,
        `${approvals}.approved_at as approved_at`,
        `${approvals}.approved_by_user_id as approved_by_user_id`
      )
      .leftJoin(approvals, `${q}.quote_approval_id`, `${approvals}.id`)
      .leftJoin(statuses, `${approvals}.approval_status_id`, `${statuses}.id`)
      .where(`${q}.ticket_id`, ticketId);

    query = this.applyFilters(query, options);
    query = query.orderBy(`${q}.version`, 'desc');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as QuoteWithApproval[];
  }

  /**
   * For each ticket ID in the supplied set, return the highest-version approved
   * quote with its approval record joined in.
   * Ticket IDs with no approved quote are simply absent from the result map.
   *
   * Used by TicketSimilarityService to surface the outcome quote alongside
   * each similar historical ticket.
   *
   * @param ticketIds Set of ticket IDs to look up
   * @returns Map of ticketId -> QuoteWithApproval
   */
  async findLatestApprovedForTickets(
    ticketIds: TicketId[]
  ): Promise<Map<string, QuoteWithApproval>> {
    if (ticketIds.length === 0) return new Map();

    const q = MAIN_TABLES.QUOTES;
    const approvals = MAIN_TABLES.QUOTE_APPROVALS;
    const statuses = LOOKUP_TABLES.QUOTE_APPROVAL_STATUSES;

    // Rank quotes per ticket by version descending, then pick rank = 1.
    // This avoids a correlated subquery and works correctly even if a ticket
    // has multiple approved quote versions.
    const results = await this.db
      .with('ranked', (qb) => {
        qb.from(q)
          .select(
            `${q}.*`,
            `${statuses}.name as approval_status_name`,
            `${approvals}.comment as approval_comment`,
            `${approvals}.approved_at as approved_at`,
            `${approvals}.approved_by_user_id as approved_by_user_id`,
            this.db.raw(
              `ROW_NUMBER() OVER (PARTITION BY ${q}.ticket_id ORDER BY ${q}.version DESC) AS rn`
            )
          )
          .leftJoin(approvals, `${q}.quote_approval_id`, `${approvals}.id`)
          .leftJoin(statuses, `${approvals}.approval_status_id`, `${statuses}.id`)
          .whereIn(`${q}.ticket_id`, ticketIds)
          .whereNull(`${q}.deleted_at`)
          .where(`${statuses}.name`, QUOTE_APPROVAL_STATUSES.APPROVED);
      })
      .from('ranked')
      .where('rn', 1);

    const map = new Map<string, QuoteWithApproval>();
    for (const row of results as QuoteWithApproval[]) {
      map.set(row.ticket_id as string, row);
    }
    return map;
  }

  async findAnalyticsQuoteAccuracy(from: Date, to: Date): Promise<AnalyticsQuoteAccuracyRow[]> {
    const q = MAIN_TABLES.QUOTES;

    const results = await this.db(q)
      .select(
        `${q}.id as quoteId`,
        `${q}.ticket_id as ticketId`,
        `${q}.estimated_cost as estimatedCost`,
        `${q}.final_cost as finalCost`,
        this.db.raw(`(${q}.final_cost - ${q}.estimated_cost) AS variance`),
        this.db.raw(
          `GREATEST(0, (1 - ABS(${q}.final_cost - ${q}.estimated_cost) / NULLIF(${q}.estimated_cost, 0)) * 100) AS "accuracyPercentage"`
        ),
        `${q}.created_at as createdAt`
      )
      .whereNotNull(`${q}.final_cost`)
      .whereNull(`${q}.deleted_at`)
      .whereBetween(`${q}.created_at`, [from, to])
      .orderBy(`${q}.created_at`, 'asc');

    return results as AnalyticsQuoteAccuracyRow[];
  }
}
