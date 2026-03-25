import type { Knex } from 'knex';
import { BaseDAO } from '../base/base.dao.js';
import { MAIN_TABLES } from '../../database/config/table-names.js';
import type { RateProfile } from '../../database/types/tables.js';
import type { RateProfileId } from '../../database/types/ids.js';
import { QueryOptions } from '../base/types.js';

export class RateProfilesDAO extends BaseDAO<RateProfile, RateProfileId> {
  constructor(db: Knex) {
    super(
      {
        tableName: MAIN_TABLES.RATE_PROFILES,
        primaryKey: 'id',
        hasActivation: true,
      },
      db
    );
  }

  /**
   * Get all active rate profiles whose effective date range covers the given date.
   * "Active" means is_active = true (enforced by BaseDAO.applyFilters via hasActivation)
   * AND effective_from <= now <= effective_to.
   *
   * @param asOf Date to check effective range against (typically now)
   * @param options Optional query options / transaction context
   * @returns Array of currently effective active rate profiles
   */
  async findActive(asOf: Date, options?: QueryOptions): Promise<RateProfile[]> {
    let query = this.getQuery(options);
    query = this.applyFilters(query, options);

    query = query
      .where(`${this.tableName}.effective_from`, '<=', asOf)
      .where(`${this.tableName}.effective_to`, '>=', asOf);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as RateProfile[];
  }
}
