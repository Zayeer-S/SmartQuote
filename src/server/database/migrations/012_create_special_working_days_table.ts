import { Knex } from 'knex';

export async function up(knex: Knex) {
  await knex.schema.createTable('special_working_days', (table) => {
    table.increments('id').primary();
    table.date('date').notNullable().comment('YYYY-MM-DD');
    table.time('start_time').nullable();
    table.time('end_time').nullable();
    table.boolean('is_holiday').notNullable().defaultTo(false).comment('Is this day a day off?');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.check('(is_holiday = true) OR (start_time IS NOT NULL and end_time IS NOT NULL');
    table.check('(start_time IS NOT NULL AND end_time IS NOT NULL) AND end_time > start_time');
  });
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('special_working_days');
}
