import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await knex.schema.createTableIfNotExists('roles', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('notification_types', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('permissions', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('organizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('file_storage_types', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('ticket_types', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('ticket_severities', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('business_impacts', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('ticket_statuses', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('ticket_priorities', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('comment_types', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('quote_effort_levels', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('quote_creators', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('quote_approval_statuses', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('quote_confidence_levels', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('analytics_schemas', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.text('description').nullable();
    table.jsonb('schema_definition').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTable('notification_token_types', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable().unique();
    table.string('description', 255).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);
  });

  await knex.schema.createTableIfNotExists('smartquote_configs', (table) => {
    table.string('key', 100).primary().comment("e.g. 'hours_per_day'");
    table.string('value', 255).notNullable();
    table.text('description').nullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('notification_types');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('organizations');
  await knex.schema.dropTableIfExists('file_storage_types');
  await knex.schema.dropTableIfExists('ticket_types');
  await knex.schema.dropTableIfExists('ticket_severities');
  await knex.schema.dropTableIfExists('business_impacts');
  await knex.schema.dropTableIfExists('ticket_statuses');
  await knex.schema.dropTableIfExists('ticket_priorities');
  await knex.schema.dropTableIfExists('comment_types');
  await knex.schema.dropTableIfExists('quote_effort_levels');
  await knex.schema.dropTableIfExists('quote_creators');
  await knex.schema.dropTableIfExists('quote_approval_statuses');
  await knex.schema.dropTableIfExists('analytics_schemas');
  await knex.schema.dropTableIfExists('notification_token_types');
  await knex.schema.dropTableIfExists('quote_confidence_levels');
  await knex.schema.dropTableIfExists('smartquote_configs');
}
