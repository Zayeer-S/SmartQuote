import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await knex.schema.createTableIfNotExists('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('first_name', 100).notNullable();
    table.string('middle_name', 100).nullable();
    table.string('last_name', 100).notNullable();
    table.string('password', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.string('phone_number', 50).notNullable();
    table.integer('role_id').notNullable();
    table.uuid('organization_id').nullable();

    table.timestamp('deleted_at', { useTz: true }).nullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('role_id').references('id').inTable('roles').onDelete('RESTRICT');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');

    table.index(['email']);
    table.index(['role_id']);
    table.index(['organization_id']);
    table.index(['deleted_at']);
    table.index(['email_verified']);
    table.index(['organization_id', 'role_id']);
    table.index(['created_at']);
  });

  await knex.schema.createTableIfNotExists('tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('creator_user_id').notNullable();
    table.uuid('resolved_by_user_id').nullable();
    table.uuid('assigned_to_user_id').nullable();

    table.uuid('organization_id').notNullable();
    table.string('title', 255).notNullable();
    table.string('description', 1000);

    table.integer('ticket_type_id').notNullable();
    table.integer('ticket_severity_id').notNullable();
    table.integer('business_impact_id').notNullable();
    table.integer('ticket_status_id').notNullable();
    table.integer('ticket_priority_id').notNullable();

    table.timestamp('deadline', { useTz: true }).notNullable();
    table.integer('users_impacted').notNullable();

    table.timestamp('deleted_at', { useTz: true }).nullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('creator_user_id').references('id').inTable('users').onDelete('RESTRICT');
    table.foreign('resolved_by_user_id').references('id').inTable('users').onDelete('RESTRICT');
    table.foreign('assigned_to_user_id').references('id').inTable('users').onDelete('RESTRICT');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');

    table.foreign('ticket_type_id').references('id').inTable('ticket_types').onDelete('RESTRICT');
    table
      .foreign('ticket_severity_id')
      .references('id')
      .inTable('ticket_severities')
      .onDelete('RESTRICT');
    table
      .foreign('business_impact_id')
      .references('id')
      .inTable('business_impacts')
      .onDelete('RESTRICT');
    table
      .foreign('ticket_status_id')
      .references('id')
      .inTable('ticket_statuses')
      .onDelete('RESTRICT');
    table
      .foreign('ticket_priority_id')
      .references('id')
      .inTable('ticket_priorities')
      .onDelete('RESTRICT');

    table.index(['creator_user_id']);
    table.index(['assigned_to_user_id']);
    table.index(['resolved_by_user_id']);
    table.index(['organization_id']);
    table.index(['ticket_status_id']);
    table.index(['ticket_priority_id']);
    table.index(['ticket_type_id']);
    table.index(['ticket_severity_id']);
    table.index(['business_impact_id']);
    table.index(['deadline']);
    table.index(['deleted_at']);
    table.index(['organization_id', 'ticket_status_id']);
    table.index(['organization_id', 'created_at']);
    table.index(['assigned_to_user_id', 'ticket_status_id']);
    table.index(['created_at']);
  });

  await knex.schema.createTableIfNotExists('quote_approvals', (table) => {
    table.increments('id').primary();
    table.uuid('approved_by_user_id').notNullable();
    table.string('user_role').notNullable();
    table.integer('approval_status_id').notNullable();
    table.string('comment').nullable();
    table.timestamp('approved_at', { useTz: true }).nullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('approved_by_user_id').references('id').inTable('users').onDelete('RESTRICT');
    table
      .foreign('approval_status_id')
      .references('id')
      .inTable('quote_approval_statuses')
      .onDelete('RESTRICT');

    table.index(['approved_by_user_id']);
    table.index(['approval_status_id']);
    table.index(['approved_at']);
    table.index(['created_at']);
  });

  await knex.schema.createTableIfNotExists('quotes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ticket_id').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.decimal('estimated_hours_minimum').notNullable();
    table.decimal('estimated_hours_maximum').notNullable();
    table.decimal('estimated_resolution_time').notNullable();
    table.decimal('hourly_rate').notNullable();
    table.decimal('estimated_cost').notNullable();
    table.decimal('fixed_cost').notNullable().defaultTo(0);
    table.decimal('final_cost').nullable();

    table.integer('quote_confidence_level_id').nullable();
    table.integer('quote_approval_id').nullable();
    table.integer('suggested_ticket_priority_id').notNullable();
    table.integer('quote_effort_level_id').notNullable();
    table.integer('quote_creator_id').notNullable();

    table.timestamp('deleted_at', { useTz: true }).nullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('ticket_id').references('id').inTable('tickets').onDelete('RESTRICT');
    table
      .foreign('quote_confidence_level_id')
      .references('id')
      .inTable('quote_confidence_levels')
      .onDelete('RESTRICT');
    table
      .foreign('quote_approval_id')
      .references('id')
      .inTable('quote_approvals')
      .onDelete('RESTRICT');
    table
      .foreign('suggested_ticket_priority_id')
      .references('id')
      .inTable('ticket_priorities')
      .onDelete('RESTRICT');
    table
      .foreign('quote_effort_level_id')
      .references('id')
      .inTable('quote_effort_levels')
      .onDelete('RESTRICT');
    table
      .foreign('quote_creator_id')
      .references('id')
      .inTable('quote_creators')
      .onDelete('RESTRICT');

    table.index(['quote_approval_id']);
    table.index(['deleted_at']);
    table.index(['ticket_id']);
    table.index(['version']);
    table.index(['created_at']);
    table.index(['quote_creator_id']);
    table.index(['suggested_ticket_priority_id']);

    table.check(
      'estimated_hours_maximum >= estimated_hours_minimum',
      [],
      'chk_quotes_enforce_effective_estimated_hours_range'
    );
  });

  await knex.schema.createTableIfNotExists('rate_profiles', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();

    table.integer('ticket_type_id').notNullable();
    table.integer('ticket_severity_id').notNullable();
    table.integer('business_impact_id').notNullable();

    table.decimal('base_hourly_rate').notNullable();
    table.decimal('multiplier').notNullable().defaultTo(1);
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('effective_from', { useTz: true }).notNullable();
    table.timestamp('effective_to', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('ticket_type_id').references('id').inTable('ticket_types').onDelete('RESTRICT');
    table
      .foreign('ticket_severity_id')
      .references('id')
      .inTable('ticket_severities')
      .onDelete('RESTRICT');
    table
      .foreign('business_impact_id')
      .references('id')
      .inTable('business_impacts')
      .onDelete('RESTRICT');

    table.index(['effective_from', 'effective_to']);
    table.index(['ticket_type_id', 'ticket_severity_id', 'business_impact_id', 'is_active']);

    table.check('effective_to >= effective_from', [], 'chk_rate_profiles_effective_date_range');
  });

  await knex.schema.createTableIfNotExists('quote_calculation_rules', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();

    table.integer('ticket_severity_id').notNullable();
    table.integer('business_impact_id').notNullable();
    table.integer('suggested_ticket_priority_id').notNullable();

    table.integer('users_impacted_min').notNullable().defaultTo(1);
    table.integer('users_impacted_max').notNullable();

    table.decimal('urgency_multiplier').notNullable().defaultTo(1);
    table.integer('priority_order').notNullable().defaultTo(1);

    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table
      .foreign('ticket_severity_id')
      .references('id')
      .inTable('ticket_severities')
      .onDelete('RESTRICT');

    table
      .foreign('business_impact_id')
      .references('id')
      .inTable('business_impacts')
      .onDelete('RESTRICT');

    table
      .foreign('suggested_ticket_priority_id')
      .references('id')
      .inTable('ticket_priorities')
      .onDelete('RESTRICT');

    table.index(['is_active']);
    table.index(['priority_order']);
    table.index([
      'ticket_severity_id',
      'business_impact_id',
      'users_impacted_min',
      'users_impacted_max',
    ]);
  });

  await knex.schema.createTableIfNotExists('analytics', (table) => {
    table.increments('id').primary();
    table.integer('schema_id').notNullable();
    table.string('type', 255).notNullable();
    table.uuid('entity_id').notNullable();
    table.uuid('organization_id').nullable();
    table.jsonb('data').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
    table.foreign('schema_id').references('id').inTable('analytics_schemas').onDelete('RESTRICT');

    table.index(['entity_id', 'type']);
    table.index(['organization_id']);
    table.index(['schema_id', 'is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('quotes');
  await knex.schema.dropTableIfExists('quote_approvals');
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('rate_profiles');
  await knex.schema.dropTableIfExists('quote_calculation_rules');
  await knex.schema.dropTableIfExists('analytics');
}
