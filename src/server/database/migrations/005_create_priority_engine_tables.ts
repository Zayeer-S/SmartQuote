import { Knex } from 'knex';
import { updatedAtTriggerSQL } from '../migration-utils.js';

const TABLES = ['ticket_priority_rules', 'ticket_priority_thresholds', 'priority_engine_anchors'];

export async function up(knex: Knex) {
  await knex.schema.createTableIfNotExists('ticket_priority_rules', (table) => {
    table.increments('id').primary();
    table.string('dimension', 50).notNullable();
    table.string('value_name', 100).notNullable();
    table.integer('points').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['dimension', 'value_name']);
    table.index(['is_active']);
    table.index(['dimension']);
  });

  await knex.schema.createTableIfNotExists('ticket_priority_thresholds', (table) => {
    table.increments('id').primary();
    table.integer('ticket_priority_id').notNullable();
    table.integer('min_score').notNullable();
    table.integer('max_score').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table
      .foreign('ticket_priority_id')
      .references('id')
      .inTable('ticket_priorities')
      .onDelete('RESTRICT');

    table.index(['is_active']);
    table.index(['ticket_priority_id']);

    table.check('max_score >= min_score', [], 'chk_ticket_priority_thresholds_score_range');
  });

  await knex.schema.createTableIfNotExists('priority_engine_anchors', (table) => {
    table.increments('id').primary();
    table.string('label', 100).notNullable().unique();
    table.text('description_text').notNullable();
    table.decimal('urgency_score', 4, 2).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['label']);

    table.check(
      'urgency_score >= -1.0 AND urgency_score <= 1.0',
      [],
      'chk_priority_engine_anchors_urgency_score_range'
    );
  });

  await knex.raw(`
          create or replace function set_updated_at()
          returns trigger
          language plpgsql
          as $trigger$
          begin
              new.updated_at = now();
              return new;
          end;
          $trigger$;
      `);

  for (const table of TABLES) {
    await knex.raw(updatedAtTriggerSQL(table));
  }
}

export async function down(knex: Knex) {
  await knex.schema.dropTableIfExists('priority_engine_anchors');
  await knex.schema.dropTableIfExists('ticket_priority_thresholds');
  await knex.schema.dropTableIfExists('ticket_priority_rules');
}
