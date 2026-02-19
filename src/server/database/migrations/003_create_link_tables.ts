import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists('role_permissions', (table) => {
    table.integer('role_id').notNullable();
    table.integer('permission_id').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.primary(['role_id', 'permission_id']);

    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE');

    table.index(['permission_id']);
  });

  await knex.schema.createTableIfNotExists('user_notification_preferences', (table) => {
    table.uuid('user_id').notNullable();
    table.integer('notification_type_id').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.primary(['user_id', 'notification_type_id']);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table
      .foreign('notification_type_id')
      .references('id')
      .inTable('notification_types')
      .onDelete('CASCADE');

    table.index(['notification_type_id']);
  });

  await knex.schema.createTableIfNotExists('quote_detail_revisions', (table) => {
    table.increments('id').primary();
    table.uuid('quote_id').notNullable();
    table.uuid('changed_by_user_id').notNullable();
    table.string('field_name').notNullable();
    table.string('old_value').notNullable();
    table.string('new_value').notNullable();
    table.string('reason').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('quote_id').references('id').inTable('quotes').onDelete('RESTRICT');
    table.foreign('changed_by_user_id').references('id').inTable('users').onDelete('RESTRICT');

    table.index(['changed_by_user_id']);
    table.index(['quote_id', 'created_at']);
    table.index(['field_name']);
  });

  await knex.schema.createTableIfNotExists('ticket_comments', (table) => {
    table.increments('id').primary();
    table.uuid('ticket_id').notNullable();
    table.uuid('user_id').notNullable();
    table.string('comment_text').notNullable();
    table.integer('comment_type_id').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('ticket_id').references('id').inTable('tickets').onDelete('RESTRICT');
    table.foreign('user_id').references('id').inTable('users').onDelete('RESTRICT');
    table.foreign('comment_type_id').references('id').inTable('comment_types').onDelete('RESTRICT');

    table.index(['user_id']);
    table.index(['comment_type_id']);
    table.index(['ticket_id', 'created_at']);
  });

  await knex.schema.createTableIfNotExists('ticket_attachments', (table) => {
    table.increments('id').primary();
    table.uuid('uploaded_by_user_id').notNullable();
    table.uuid('ticket_id').notNullable();
    table.string('name', 255).notNullable();
    table.integer('storage_type_id').notNullable();
    table.integer('size_bytes').notNullable();
    table.string('mime_type', 128).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('uploaded_by_user_id').references('id').inTable('users').onDelete('RESTRICT');
    table.foreign('ticket_id').references('id').inTable('tickets').onDelete('RESTRICT');

    table
      .foreign('storage_type_id')
      .references('id')
      .inTable('file_storage_types')
      .onDelete('RESTRICT');

    table.index(['uploaded_by_user_id']);
    table.index(['storage_type_id']);
    table.index(['ticket_id', 'created_at']);
  });

  await knex.schema.createTableIfNotExists('organization_members', (table) => {
    table.increments('id').primary();
    table.uuid('organization_id').notNullable();
    table.uuid('user_id').notNullable();
    table.integer('role_id').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
    table.foreign('user_id').references('id').inTable('users').onDelete('RESTRICT');
    table.foreign('role_id').references('id').inTable('roles').onDelete('RESTRICT');

    table.index(['role_id']);
    table.index(['organization_id', 'user_id']);
  });

  await knex.schema.createTableIfNotExists('sla_policies', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.uuid('user_id').nullable();
    table.uuid('organization_id').nullable();
    table.jsonb('contract').notNullable();
    table.timestamp('effective_from', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('effective_to', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
    table.foreign('user_id').references('id').inTable('users').onDelete('RESTRICT');

    table.index(['effective_from', 'effective_to']);
    table.index(['user_id']);
    table.index(['organization_id']);

    table.check(
      '((user_id is not null)::int + (organization_id is not null)::int) = 1',
      [],
      'chk_sla_policies_owner'
    );

    table.check('effective_to >= effective_from', [], 'chk_sla_policies_effective_date_range');
  });

  await knex.schema.createTableIfNotExists('sessions', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable();
    table.string('session_token', 255).notNullable();
    table.timestamp('last_activity', { useTz: true }).notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['session_token']);
    table.index(['user_id', 'expires_at']);

    table.foreign('user_id').references('id').inTable('users').onDelete('RESTRICT');

    table.check('expires_at >= last_activity', [], 'chk_sessions_effective_date_range');
  });

  await knex.schema.createTableIfNotExists('resource_utilizations', (table) => {
    table.increments('id').primary();
    table
      .integer('ticket_type_id')
      .notNullable()
      .references('id')
      .inTable('ticket_types')
      .onDelete('RESTRICT');
    table.integer('role_id').notNullable().references('id').inTable('roles').onDelete('RESTRICT');
    table.decimal('percent', 5, 2).notNullable().comment('store as 0..100 (e.g., 45.00)');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['ticket_type_id', 'role_id']);
    table.index(['ticket_type_id']);
    table.index(['role_id']);
  });

  await knex.schema.createTableIfNotExists('quote_effort_level_ranges', (table) => {
    table.increments('id').primary();
    table
      .integer('quote_effort_level_id')
      .references('id')
      .inTable('quote_effort_levels')
      .onDelete('RESTRICT');
    table.decimal('hours_minimum').notNullable();
    table.decimal('hours_maximum').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['quote_effort_level_id']);

    table.check(
      'hours_maximum >= hours_minimum',
      [],
      'chk_quote_effort_level_ranges_ensure_hours_range'
    );
  });

  await knex.schema.createTableIfNotExists('notification_tokens', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .integer('token_type_id')
      .notNullable()
      .references('id')
      .inTable('notification_token_types')
      .onDelete('RESTRICT');
    table.string('token', 64).notNullable().unique();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('last_activity', { useTz: true }).nullable();
    table.timestamp('updated_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index('token', 'idx_notification_tokens_token');
    table.index('user_id', 'idx_notification_tokens_user_id');
    table.index(['token_type_id', 'user_id'], 'idx_notification_tokens_type_user');
    table.index('expires_at', 'idx_notification_tokens_expires_at');

    table.check('expires_at >= last_activity', [], 'chk_notification_tokens_effective_date_range');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_notification_preferences');
  await knex.schema.dropTableIfExists('quote_detail_revisions');
  await knex.schema.dropTableIfExists('ticket_comments');
  await knex.schema.dropTableIfExists('ticket_attachments');
  await knex.schema.dropTableIfExists('organization_members');
  await knex.schema.dropTableIfExists('sla_policies');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('resource_utilizations');
  await knex.schema.dropTableIfExists('quote_effort_level_ranges');
  await knex.schema.dropTableIfExists('notification_tokens');
}
