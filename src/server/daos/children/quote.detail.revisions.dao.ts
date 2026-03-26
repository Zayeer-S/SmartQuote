import type { Knex } from 'knex';
import { BaseDAO } from '../base/base.dao.js';
import { LINK_TABLES } from '../../database/config/table-names.js';
import type { QuoteDetailRevision } from '../../database/types/tables.js';
import type { QuoteDetailRevisionId, QuoteId } from '../../database/types/ids.js';
import type { GetManyOptions } from '../base/types.js';

export class QuoteDetailRevisionsDAO extends BaseDAO<QuoteDetailRevision, QuoteDetailRevisionId> {
  constructor(db: Knex) {
    super(
      {
        tableName: LINK_TABLES.QUOTE_DETAIL_REVISIONS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find all revisions for a quote, ordered oldest first
   *
   * @param quoteId Quote ID
   * @param options Query options
   * @returns Array of revisions ordered by created_at ascending
   */
  async findByQuote(quoteId: QuoteId, options?: GetManyOptions): Promise<QuoteDetailRevision[]> {
    let query = this.getQuery(options);
    query = query.where({ quote_id: quoteId });
    query = this.applyFilters(query, options);
    query = query.orderBy('created_at', 'asc');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as QuoteDetailRevision[];
  }
}
