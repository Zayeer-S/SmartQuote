import type { Knex } from 'knex';

export function updatedAtTriggerSQL(tableName: string) {
  return `
        create trigger ${tableName}_set_updated_at
        before update on ${tableName}
        for each row
        execute function set_updated_at();
    `;
}

export function dropUpdatedAtTriggerSQL(tableName: string) {
  return `
        drop trigger if exists ${tableName}_set_updated_at on ${tableName};
    `;
}

const TABLES = [
  'roles',
  'notification_types',
  'permissions',
  'organizations',
  'file_storage_types',
  'ticket_types',
  'ticket_severities',
  'business_impacts',
  'ticket_statuses',
  'ticket_priorities',
  'comment_types',
  'quote_effort_levels',
  'quote_creators',
  'quote_approval_statuses',
  'analytics_schemas',
  'notification_token_types',
  'quote_confidence_levels',

  'smartquote_configs',

  'users',
  'tickets',
  'quote_approvals',
  'quotes',
  'rate_profiles',
  'quote_calculation_rules',
  'analytics',

  'role_permissions',
  'user_notification_preferences',
  'quote_detail_revisions',
  'ticket_comments',
  'ticket_attachments',
  'organization_members',
  'sla_policies',
  'sessions',
  'notification_tokens',
  'quote_effort_level_ranges',
  'resource_utilizations',
];

export async function up(knex: Knex): Promise<void> {
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

export async function down(knex: Knex): Promise<void> {
  for (const table of TABLES) {
    await knex.raw(dropUpdatedAtTriggerSQL(table));
  }

  await knex.raw('drop function if exists set_updated_at()');
}
