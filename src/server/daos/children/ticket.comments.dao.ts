import type { Knex } from 'knex';
import type { CommentTypeId, TicketCommentId, TicketId } from '../../database/types/ids';
import type { TicketComment } from '../../database/types/tables';
import { LINK_TABLES } from '../../database/config/table-names';
import { BaseDAO } from '../base/base.dao';
import type { GetManyOptions } from '../base/types';

export class TicketCommentsDAO extends BaseDAO<TicketComment, TicketCommentId> {
  constructor(db: Knex) {
    super(
      {
        tableName: LINK_TABLES.TICKET_COMMENTS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find all comments for a ticket, ordered oldest first
   *
   * @param ticketId Ticket ID
   * @param options Query options
   * @returns Array of comments ordered by created_at ascending
   */
  async findByTicket(ticketId: TicketId, options?: GetManyOptions): Promise<TicketComment[]> {
    let query = this.getQuery(options);
    query = query.where({ ticket_id: ticketId });
    query = this.applyFilters(query, options);
    query = query.orderBy('created_at', 'asc');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as TicketComment[];
  }

  /**
   * Find all comments of a specific type on a ticket
   *
   * @param ticketId Ticket ID
   * @param commentTypeId Comment type ID to filter by
   * @param options Query options
   * @returns Array of matching comments ordered by created_at ascending
   */
  async findByType(
    ticketId: TicketId,
    commentTypeId: CommentTypeId,
    options?: GetManyOptions
  ): Promise<TicketComment[]> {
    let query = this.getQuery(options);
    query = query.where({ ticket_id: ticketId, comment_type_id: commentTypeId });
    query = this.applyFilters(query, options);
    query = query.orderBy('created_at', 'asc');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as TicketComment[];
  }
}
