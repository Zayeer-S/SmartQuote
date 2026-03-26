import type { Knex } from 'knex';
import {
  createUpdatedAtFunction,
  dropUpdatedAtFunction,
  dropUpdatedAtTriggerSQL,
  updatedAtTriggerSQL,
} from '../migration-utils.js';

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
  await createUpdatedAtFunction(knex);

  for (const table of TABLES) {
    await knex.raw(updatedAtTriggerSQL(table));
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const table of TABLES) {
    await knex.raw(dropUpdatedAtTriggerSQL(table));
  }

  await dropUpdatedAtFunction(knex);
}
