import { Knex } from 'knex';
import {
  PriorityEngineAnchorsId as PriorityEngineAnchorId,
  TicketEmbeddingId,
  TicketId,
  TicketPriorityRuleId,
  TicketPriorityThresholdId,
} from '../../database/types/ids';
import {
  PriorityEngineAnchor,
  TicketEmbedding,
  TicketPriorityRule,
  TicketPriorityThreshold,
} from '../../database/types/tables';
import { ActivatableDAO } from '../base/activatable.dao';
import { ENGINE_TABLES } from '../../database/config/table-names';
import { BaseDAO } from '../base/base.dao';

export class TicketPriorityRulesDAO extends ActivatableDAO<
  TicketPriorityRule,
  TicketPriorityRuleId
> {
  constructor(db: Knex) {
    super(
      {
        tableName: ENGINE_TABLES.TICKET_PRIORITY_RULES,
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
        tableName: ENGINE_TABLES.TICKET_PRIORITY_THRESHOLDS,
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
        tableName: ENGINE_TABLES.PRIORITY_ENGINE_ANCHORS,
        primaryKey: 'id',
      },
      db
    );
  }
}

export class TicketEmbeddingsDAO extends BaseDAO<TicketEmbedding, TicketEmbeddingId> {
  constructor(db: Knex) {
    super(
      {
        tableName: ENGINE_TABLES.TICKET_EMBEDDINGS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Insert or update the embedding for a ticket.
   * Uses ON CONFLICT on ticket_id so repeated calls (e.g. description edits) are safe.
   *
   * @param ticketId Ticket whose description was embedded
   * @param embedding Float array produced by the embedding model
   */
  async upsert(ticketId: TicketId, embedding: number[]): Promise<void> {
    await this.db(ENGINE_TABLES.TICKET_EMBEDDINGS)
      .insert({
        ticket_id: ticketId,
        embedding: JSON.stringify(embedding),
        computed_at: new Date(),
      })
      .onConflict('ticket_id')
      .merge({ embedding: JSON.stringify(embedding), computed_at: new Date() });
  }

  /**
   * Fetch stored embeddings for a set of ticket IDs.
   * Returns only rows that exist -- callers must handle missing entries.
   *
   * @param ticketIds Ticket IDs to look up
   * @returns Array of TicketEmbedding rows (may be shorter than ticketIds)
   */
  async findByTicketIds(ticketIds: TicketId[]): Promise<TicketEmbedding[]> {
    if (ticketIds.length === 0) return [];

    const results = await this.db(ENGINE_TABLES.TICKET_EMBEDDINGS).whereIn('ticket_id', ticketIds);

    // JSONB comes back as a parsed value from pg, but the type is unknown --
    // cast explicitly so callers get number[].

    return (results as TicketEmbedding[]).map((row) => ({
      ...row,

      embedding: row.embedding,
    })) as TicketEmbedding[];
  }
}
