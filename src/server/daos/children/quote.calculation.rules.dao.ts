import type { Knex } from 'knex';
import { BaseDAO } from '../base/base.dao';
import { MAIN_TABLES } from '../../database/config/table-names';
import type { QuoteCalculationRule } from '../../database/types/tables';
import type { QuoteCalculationRuleId } from '../../database/types/ids';

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
