import type { Knex } from 'knex';

const TABLE = 'tickets';
const COLUMN = 'resolved_at';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE, (table) => {
    table.timestamp(COLUMN, { useTz: true }).nullable().defaultTo(null);
  });

  await knex(TABLE)
    .whereNotNull('resolved_by_user_id')
    .update({ [COLUMN]: knex.ref('updated_at') });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn(COLUMN);
  });
}
