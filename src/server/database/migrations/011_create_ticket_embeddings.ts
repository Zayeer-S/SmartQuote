import { Knex } from 'knex';
import { updatedAtTriggerSQL } from '../migration.utils.js';

const TABLE = 'ticket_embeddings';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(TABLE, (table) => {
    table.increments('id').primary();
    table.uuid('ticket_id').notNullable().unique();
    table.jsonb('embedding').notNullable();
    table.timestamp('computed_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');

    table.index(['ticket_id']);
  });

  await knex.raw(updatedAtTriggerSQL(TABLE));
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE);
}
