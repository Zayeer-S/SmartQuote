import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('quotes', (table) => {
    table.decimal('ml_estimated_hours_minimum', 10, 2).nullable();
    table.decimal('ml_estimated_hours_maximum', 10, 2).nullable();
    table.decimal('ml_estimated_cost', 10, 2).nullable();
    table.integer('ml_suggested_ticket_priority_id').nullable();
    table.decimal('ml_priority_confidence', 5, 4).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('quotes', (table) => {
    table.dropColumn('ml_estimated_hours_minimum');
    table.dropColumn('ml_estimated_hours_maximum');
    table.dropColumn('ml_estimated_cost');
    table.dropColumn('ml_suggested_ticket_priority_id');
    table.dropColumn('ml_priority_confidence');
  });
}
