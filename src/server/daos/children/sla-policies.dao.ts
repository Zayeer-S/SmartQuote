import type { Knex } from 'knex';
import { ActivatableDAO } from '../base/activatable.dao.js';
import { MAIN_TABLES } from '../../database/config/table-names.js';
import type { OrganizationId, SlaPolicyId, UserId } from '../../database/types/ids.js';
import type { SlaPolicy } from '../../database/types/tables.js';
import type { QueryOptions } from '../base/types.js';

export class SlaPoliciesDAO extends ActivatableDAO<SlaPolicy, SlaPolicyId> {
  constructor(db: Knex) {
    super(
      {
        tableName: MAIN_TABLES.SLA_POLICIES,
        primaryKey: 'id',
        hasActivation: true,
      },
      db
    );
  }

  /**
   * Find all SLA policies scoped to a specific organization.
   *
   * @param organizationId
   * @param options
   * @returns Array of SlaPolicy rows
   */
  async findByOrg(organizationId: OrganizationId, options?: QueryOptions): Promise<SlaPolicy[]> {
    return this.getMany({ organization_id: organizationId } as Partial<SlaPolicy>, options);
  }

  /**
   * Find all SLA policies scoped to a specific user.
   *
   * @param userId
   * @param options
   * @returns Array of SlaPolicy rows
   */
  async findByUser(userId: UserId, options?: QueryOptions): Promise<SlaPolicy[]> {
    return this.getMany({ user_id: userId } as Partial<SlaPolicy>, options);
  }

  /**
   * Find all active policies whose effective date range covers the given date.
   * Used by breach-checking logic.
   *
   * @param asOf Date to check coverage for
   * @param options
   * @returns Array of active SlaPolicy rows effective at asOf
   */
  async findActive(asOf: Date, options?: QueryOptions): Promise<SlaPolicy[]> {
    const qb = this.db(MAIN_TABLES.SLA_POLICIES)
      .where('is_active', true)
      .where('effective_from', '<=', asOf)
      .where('effective_to', '>=', asOf);

    if (options?.trx) qb.transacting(options.trx);

    return qb as unknown as Promise<SlaPolicy[]>;
  }
}
