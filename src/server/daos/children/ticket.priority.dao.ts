import { Knex } from 'knex';
import {
  PriorityEngineAnchorsId as PriorityEngineAnchorId,
  TicketPriorityRuleId,
  TicketPriorityThresholdId,
} from '../../database/types/ids';
import {
  PriorityEngineAnchor,
  TicketPriorityRule,
  TicketPriorityThreshold,
} from '../../database/types/tables';
import { ActivatableDAO } from '../base/activatable.dao';
import { TICKET_PRIORITY_ENGINE_TABLES } from '../../database/config/table-names';

export class TicketPriorityRulesDAO extends ActivatableDAO<
  TicketPriorityRule,
  TicketPriorityRuleId
> {
  constructor(db: Knex) {
    super(
      {
        tableName: TICKET_PRIORITY_ENGINE_TABLES.TICKET_PRIORITY_RULES,
        primaryKey: 'id',
      },
      db
    );
  }
}

export class TicketPriorityThresholdsDAO extends ActivatableDAO<
  TicketPriorityThreshold,
  TicketPriorityThresholdId
> {
  constructor(db: Knex) {
    super(
      {
        tableName: TICKET_PRIORITY_ENGINE_TABLES.TICKET_PRIORITY_THRESHOLDS,
        primaryKey: 'id',
      },
      db
    );
  }
}

export class PriorityEngineAnchorsDAO extends ActivatableDAO<
  PriorityEngineAnchor,
  PriorityEngineAnchorId
> {
  constructor(db: Knex) {
    super(
      {
        tableName: TICKET_PRIORITY_ENGINE_TABLES.PRIORITY_ENGINE_ANCHORS,
        primaryKey: 'id',
      },
      db
    );
  }
}
