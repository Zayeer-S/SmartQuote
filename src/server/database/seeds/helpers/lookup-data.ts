import {
  ALL_ROLES,
  ALL_PERMISSIONS,
  ALL_NOTIFICATION_TYPES,
  ALL_NOTIFICATION_TOKEN_TYPES,
  ALL_FILE_STORAGE_TYPES,
  ALL_TICKET_TYPES,
  ALL_TICKET_SEVERITIES,
  ALL_BUSINESS_IMPACTS,
  ALL_TICKET_STATUSES,
  ALL_TICKET_PRIORITIES,
  ALL_COMMENT_TYPES,
  ALL_QUOTE_EFFORT_LEVELS,
  ALL_QUOTE_CREATORS,
  ALL_QUOTE_APPROVAL_STATUSES,
  ALL_QUOTE_CONFIDENCE_LEVELS,
  ANALYTICS_SCHEMA_NAMES,
  SMARTQUOTE_CONFIG_KEYS,
} from '../../../../shared/constants';

/**
 * Lookup Data Helper
 *
 * Maps typed constants to database-insertable objects.
 */

interface LookupTableRow {
  name: string;
  is_active: boolean;
}

interface ConfigRow {
  key: string;
  value: string;
  description: string | null;
}

interface AnalyticsSchemaRow {
  name: string;
  description: string | null;
  schema_definition: Record<string, unknown>;
  is_active: boolean;
}

/** Converts an array of constant values to lookup table rows */
function toLookupRows(values: readonly string[]): LookupTableRow[] {
  return values.map((name) => ({
    name,
    is_active: true,
  }));
}

export const ROLES_SEED_DATA = toLookupRows(ALL_ROLES);

export const PERMISSIONS_SEED_DATA = toLookupRows(ALL_PERMISSIONS);

export const NOTIFICATION_TYPES_SEED_DATA = toLookupRows(ALL_NOTIFICATION_TYPES);

export const NOTIFICATION_TOKEN_TYPES_SEED_DATA = ALL_NOTIFICATION_TOKEN_TYPES.map((name) => ({
  name,
  description: `${name} push notification tokens`,
  is_active: true,
}));

export const FILE_STORAGE_TYPES_SEED_DATA = toLookupRows(ALL_FILE_STORAGE_TYPES);

export const TICKET_TYPES_SEED_DATA = toLookupRows(ALL_TICKET_TYPES);

export const TICKET_SEVERITIES_SEED_DATA = toLookupRows(ALL_TICKET_SEVERITIES);

export const BUSINESS_IMPACTS_SEED_DATA = toLookupRows(ALL_BUSINESS_IMPACTS);

export const TICKET_STATUSES_SEED_DATA = toLookupRows(ALL_TICKET_STATUSES);

export const TICKET_PRIORITIES_SEED_DATA = toLookupRows(ALL_TICKET_PRIORITIES);

export const COMMENT_TYPES_SEED_DATA = toLookupRows(ALL_COMMENT_TYPES);

export const QUOTE_EFFORT_LEVELS_SEED_DATA = toLookupRows(ALL_QUOTE_EFFORT_LEVELS);

export const QUOTE_CREATORS_SEED_DATA = toLookupRows(ALL_QUOTE_CREATORS);

export const QUOTE_APPROVAL_STATUSES_SEED_DATA = toLookupRows(ALL_QUOTE_APPROVAL_STATUSES);

export const QUOTE_CONFIDENCE_LEVELS_SEED_DATA = toLookupRows(ALL_QUOTE_CONFIDENCE_LEVELS);

export const ANALYTICS_SCHEMAS_SEED_DATA: AnalyticsSchemaRow[] = [
  {
    name: ANALYTICS_SCHEMA_NAMES.TICKET_RESOLUTION_TIME,
    description: 'Tracks ticket resolution time metrics',
    schema_definition: {
      ticket_id: 'uuid',
      created_at: 'timestamp',
      resolved_at: 'timestamp',
      resolution_time_hours: 'decimal',
      severity: 'string',
      business_impact: 'string',
      assigned_to_user_id: 'uuid',
    },
    is_active: true,
  },
  {
    name: ANALYTICS_SCHEMA_NAMES.QUOTE_ACCURACY,
    description: 'Tracks accuracy of quote estimates vs actual time spent',
    schema_definition: {
      quote_id: 'uuid',
      ticket_id: 'uuid',
      estimated_hours: 'decimal',
      actual_hours: 'decimal',
      accuracy_percentage: 'decimal',
      variance_hours: 'decimal',
      created_at: 'timestamp',
    },
    is_active: true,
  },
  {
    name: ANALYTICS_SCHEMA_NAMES.USER_ACTIVITY,
    description: 'Tracks user activity and engagement metrics',
    schema_definition: {
      user_id: 'uuid',
      activity_type: 'string',
      entity_type: 'string',
      entity_id: 'uuid',
      timestamp: 'timestamp',
      metadata: 'jsonb',
    },
    is_active: true,
  },
];

export const SMARTQUOTE_CONFIGS_SEED_DATA: ConfigRow[] = [
  {
    key: SMARTQUOTE_CONFIG_KEYS.HOURS_PER_DAY,
    value: '6',
    description: 'Standard working hours per day for resource calculations',
  },
  {
    key: SMARTQUOTE_CONFIG_KEYS.VELOCITY_MULTIPLIER,
    value: '1.5',
    description: 'Velocity multiplier for adjusting time estimates based on team capacity',
  },
];
