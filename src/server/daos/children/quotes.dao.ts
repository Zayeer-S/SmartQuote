import type { Knex } from 'knex';
import { DeletableDAO } from '../base/deletable.dao';
import { LOOKUP_TABLES, MAIN_TABLES } from '../../database/config/table-names';
import type { Quote, QuoteWithApproval } from '../../database/types/tables';
import type { QuoteId, TicketId } from '../../database/types/ids';
import type { GetManyOptions, QueryOptions } from '../base/types';

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
}
