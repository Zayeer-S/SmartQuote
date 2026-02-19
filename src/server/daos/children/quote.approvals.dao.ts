import type { Knex } from 'knex';
import { BaseDAO } from '../base/base.dao';
import { MAIN_TABLES } from '../../database/config/table-names';
import type { QuoteApproval } from '../../database/types/tables';
import type { QuoteApprovalId, QuoteApprovalStatusId } from '../../database/types/ids';
import type { GetManyOptions } from '../base/types';

export class QuoteApprovalsDAO extends BaseDAO<QuoteApproval, QuoteApprovalId> {
  constructor(db: Knex) {
    super(
      {
        tableName: MAIN_TABLES.QUOTE_APPROVALS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find all approvals with a given status
   *
   * @param statusId Approval status ID to filter by
   * @param options Query options
   * @returns Array of matching approvals
   */
  async findByStatus(
    statusId: QuoteApprovalStatusId,
    options?: GetManyOptions
  ): Promise<QuoteApproval[]> {
    return this.getMany({ approval_status_id: statusId }, options);
  }
}
