import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rate_profiles', (table) => {
    table.dropColumn('name');
    table.renameColumn('base_hourly_rate', 'business_hours_rate');
    table.decimal('after_hours_rate').notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rate_profiles', (table) => {
    table.dropColumn('after_hours_rate');
    table.renameColumn('business_hours_rate', 'base_hourly_rate');
    table.string('name', 255).notNullable().defaultTo('');
  });
}
