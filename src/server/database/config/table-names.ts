export const LOOKUP_TABLES = {
  ROLES: 'roles',
  NOTIFICATION_TYPES: 'notification_types',
  PERMISSIONS: 'permissions',
  ORGANIZATIONS: 'organizations',
  FILE_STORAGE_TYPES: 'file_storage_types',
  TICKET_TYPES: 'ticket_types',
  TICKET_SEVERITIES: 'ticket_severities',
  BUSINESS_IMPACTS: 'business_impacts',
  TICKET_STATUSES: 'ticket_statuses',
  TICKET_PRIORITIES: 'ticket_priorities',
  COMMENT_TYPES: 'comment_types',
  QUOTE_EFFORT_LEVELS: 'quote_effort_levels',
  QUOTE_CREATORS: 'quote_creators',
  QUOTE_APPROVAL_STATUSES: 'quote_approval_statuses',
  QUOTE_CONFIDENCE_LEVELS: 'quote_confidence_levels',
  ANALYTICS_SCHEMAS: 'analytics_schemas',
  NOTIFICATION_TOKEN_TYPES: 'notification_token_types',
} as const;

export const MAIN_TABLES = {
  USERS: 'users',
  TICKETS: 'tickets',
  QUOTE_APPROVALS: 'quote_approvals',
  QUOTES: 'quotes',
  RATE_PROFILES: 'rate_profiles',
  QUOTE_CALCULATION_RULES: 'quote_calculation_rules',
  ANALYTICS: 'analytics',
} as const;

export const LINK_TABLES = {
  ROLE_PERMISSIONS: 'role_permissions',
  USER_NOTIFICATION_PREFERENCES: 'user_notification_preferences',
  QUOTE_DETAIL_REVISIONS: 'quote_detail_revisions',
  TICKET_COMMENTS: 'ticket_comments',
  TICKET_ATTACHMENTS: 'ticket_attachments',
  ORGANIZATION_MEMBERS: 'organization_members',
  SLA_POLICIES: 'sla_policies',
  SESSIONS: 'sessions',
  RESOURCE_UTILIZATIONS: 'resource_utilizations',
  QUOTE_EFFORT_LEVEL_RANGES: 'quote_effort_level_ranges',
  NOTIFICATION_TOKENS: 'notification_tokens',
} as const;

export const CONFIG_TABLES = {
  SMARTQUOTE_CONFIGS: 'smartquote_configs',
};

export const TABLE_NAMES = {
  ...LOOKUP_TABLES,
  ...LINK_TABLES,
  ...MAIN_TABLES,
  ...CONFIG_TABLES,
};

export type LookupTableName = (typeof LOOKUP_TABLES)[keyof typeof LOOKUP_TABLES];
export type MainTableName = (typeof MAIN_TABLES)[keyof typeof MAIN_TABLES];
export type LinkTableName = (typeof LINK_TABLES)[keyof typeof LINK_TABLES];
export type ConfigTabelName = (typeof CONFIG_TABLES)[keyof typeof CONFIG_TABLES];
export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES];
