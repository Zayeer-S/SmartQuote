import type { Knex } from 'knex';
import { BaseDAO } from '../base/base.dao.js';
import { MAIN_TABLES } from '../../database/config/table-names.js';
import type { QuoteCalculationRule } from '../../database/types/tables.js';
import type { QuoteCalculationRuleId } from '../../database/types/ids.js';

export class QuoteCalculationRulesDAO extends BaseDAO<
  QuoteCalculationRule,
  QuoteCalculationRuleId
> {
  constructor(db: Knex) {
    super(
      {
        tableName: MAIN_TABLES.QUOTE_CALCULATION_RULES,
        primaryKey: 'id',
        hasActivation: true,
      },
      db
    );
  }
}
