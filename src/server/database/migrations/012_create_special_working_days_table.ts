import { Knex } from 'knex';

export async function up(knex: Knex) {
  await knex.schema.createTable('special_working_days', (table) => {
    table.increments('id').primary();
    table.date('date').notNullable().unique().comment('YYYY-MM-DD');
    table.time('start_time').nullable();
    table.time('end_time').nullable();
    table
      .boolean('is_holiday')
      .notNullable()
      .defaultTo(false)
      .comment(
        'True = full day off (start_time/end_time must be null). False = special hours day (start_time/end_time required).'
      );
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.check(
      '(is_holiday = true AND start_time IS NULL AND end_time IS NULL) OR (is_holiday = false AND start_time IS NOT NULL AND end_time IS NOT NULL)',
      [],
      'chk_special_working_days_holiday_xor_hours'
    );

    table.check(
      'is_holiday = true OR end_time > start_time',
      [],
      'chk_special_working_days_end_after_start'
    );
  });
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('special_working_days');
}
