import type { Knex } from 'knex';
import { BaseDAO } from '../base/base.dao.js';
import { LINK_TABLES } from '../../database/config/table-names.js';
import type { TicketAttachment } from '../../database/types/tables.js';
import type { TicketAttachmentId, TicketId } from '../../database/types/ids.js';
import type { GetManyOptions } from '../base/types.js';

export class TicketAttachmentsDAO extends BaseDAO<TicketAttachment, TicketAttachmentId> {
  constructor(db: Knex) {
    super(
      {
        tableName: LINK_TABLES.TICKET_ATTACHMENTS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find all attachments for a ticket, ordered oldest first
   *
   * @param ticketId Ticket ID
   * @param options Query options
   * @returns Array of attachments ordered by created_at ascending
   */
  async findByTicket(ticketId: TicketId, options?: GetManyOptions): Promise<TicketAttachment[]> {
    let query = this.getQuery(options);
    query = query.where({ ticket_id: ticketId });
    query = this.applyFilters(query, options);
    query = query.orderBy('created_at', 'asc');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as TicketAttachment[];
  }

  /**
   * Delete an attachment record by its storage key.
   * Used by AttachmentService to clean up DB records when a post-commit
   * storage upload fails.
   *
   * @param storageKey The provider-agnostic storage key
   */
  async deleteByStorageKey(storageKey: string): Promise<void> {
    await this.getQuery().where({ storage_key: storageKey }).delete();
  }
}
