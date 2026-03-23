import { Knex } from 'knex';
import { updatedAtTriggerSQL } from '../migration-utils';

const TABLES = ['org_roles', 'org_role_permissions', 'organization_members'];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('org_roles', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
    table.index(['name']);

    table.comment('These are org roles only - system roles are handled by roles table');
  });

  await knex.schema.createTable('org_role_permissions', (table) => {
    table.integer('org_role_id').notNullable();
    table.integer('permission_id').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.primary(['org_role_id', 'permission_id']);

    table.foreign('org_role_id').references('id').inTable('org_roles').onDelete('CASCADE');
    table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE');

    table.index(['permission_id']);

    table.comment(
      'These are internal org role permisssions only - system roles (e.g. create organization) are handled by permissions table'
    );
  });

  // Safe to drop and rebuild as orgs weren't implemented when this was created thus this table was completely unused
  await knex.schema.dropTable('organization_members');

  await knex.schema.createTable('organization_members', (table) => {
    table.uuid('organization_id').notNullable();
    table.uuid('user_id').notNullable();
    table.integer('org_role_id').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.primary(['organization_id', 'user_id']);

    table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
    table.foreign('user_id').references('id').inTable('users').onDelete('RESTRICT');
    table.foreign('org_role_id').references('id').inTable('org_roles').onDelete('RESTRICT');

    table.index(['user_id']);
    table.index(['org_role_id']);
    table.index(['organization_id', 'user_id']);
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropForeign(['organization_id']);
    table.dropIndex(['organization_id']);
    table.dropIndex(['organization_id', 'role_id']);
    table.dropColumn('organization_id');
  });

  for (const table of TABLES) {
    await knex.raw(updatedAtTriggerSQL(table));
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.uuid('organization_id').nullable();
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
    table.index(['organization_id']);
    table.index(['organization_id', 'role_id']);
  });

  await knex.schema.dropTable('organization_members');

  await knex.schema.createTable('organization_members', (table) => {
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

  await knex.raw(updatedAtTriggerSQL('organization_members'));

  await knex.schema.dropTable('org_role_permissions');
  await knex.schema.dropTable('org_roles');
}
