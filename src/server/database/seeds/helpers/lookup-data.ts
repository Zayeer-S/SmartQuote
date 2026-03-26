import {
  ALL_ROLES,
  ALL_ORG_ROLES,
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
  TICKET_SEVERITIES,
  BUSINESS_IMPACTS,
  TICKET_DEADLINE_PROXIMITY_BUCKETS,
} from '../../../../shared/constants/index.js';

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

export interface PriorityRuleRow {
  dimension: string;
  value_name: string;
  points: number;
  is_active: boolean;
}

export interface PriorityAnchorRow {
  label: string;
  description_text: string;
  urgency_score: number;
  is_active: boolean;
  // embedding is populated separately by the BertEmbedder at seed time
}

/** Converts an array of constant values to lookup table rows */
function toLookupRows(values: readonly string[]): LookupTableRow[] {
  return values.map((name) => ({
    name,
    is_active: true,
  }));
}

export const ROLES_SEED_DATA = toLookupRows(ALL_ROLES);

export const ORG_ROLES_SEED_DATA = toLookupRows(ALL_ORG_ROLES);

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
    name: ANALYTICS_SCHEMA_NAMES.TICKET_VOLUME,
    description: 'Tracks ticket volume and statuses',
    schema_definition: {
      ticket_id: 'uuid',
      ticket_statuses_id: 'integer',
      created_at: 'timestamp',
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
  {
    key: SMARTQUOTE_CONFIG_KEYS.TICKET_PRIORITY_NLP_WEIGHT,
    value: '3',
    description:
      'Maximum score points the NLP modifier can add or subtract from the rule-based base score. ' +
      'The NLP urgency signal [-1.0, 1.0] is multiplied by this value before being added to the score.',
  },
  {
    key: SMARTQUOTE_CONFIG_KEYS.TICKET_PRIORITY_USERS_IMPACTED_TIERS,
    value: JSON.stringify([10, 50, 200]),
    description:
      'Ascending breakpoints defining users-impacted score buckets. ' +
      'Format: [tier1Max, tier2Max, tier3Max, tier4Max]. ' +
      'Values <= tier1Max = 1pt, <= tier2Max = 2pts, <= tier3Max = 3pts, above = 4pts.',
  },
];

/**
 * Priority engine scoring rules.
 *
 * Four dimensions each contribute points to the base score:
 *   severity (1-4) + business_impact (1-4) + users_impacted (1-4) + deadline_proximity (1-4)
 *
 * Max base score = 16. With NLP weight of 3, max total = 19.
 *
 * Thresholds defined in PRIORITY_THRESHOLDS_SEED_DATA map score ranges to priorities.
 */
export const PRIORITY_RULES_SEED_DATA: PriorityRuleRow[] = [
  // --- Severity ---
  { dimension: 'severity', value_name: TICKET_SEVERITIES.LOW, points: 1, is_active: true },
  { dimension: 'severity', value_name: TICKET_SEVERITIES.MEDIUM, points: 2, is_active: true },
  { dimension: 'severity', value_name: TICKET_SEVERITIES.HIGH, points: 3, is_active: true },
  { dimension: 'severity', value_name: TICKET_SEVERITIES.CRITICAL, points: 4, is_active: true },

  // --- Business Impact ---
  { dimension: 'business_impact', value_name: BUSINESS_IMPACTS.MINOR, points: 1, is_active: true },
  {
    dimension: 'business_impact',
    value_name: BUSINESS_IMPACTS.MODERATE,
    points: 2,
    is_active: true,
  },
  { dimension: 'business_impact', value_name: BUSINESS_IMPACTS.MAJOR, points: 3, is_active: true },
  {
    dimension: 'business_impact',
    value_name: BUSINESS_IMPACTS.CRITICAL,
    points: 4,
    is_active: true,
  },

  // --- Users Impacted ---
  // Tier labels must stay in sync with PRIORITY_USERS_IMPACTED_TIERS config value.
  // The engine resolves which label to use at runtime using the config breakpoints.
  { dimension: 'users_impacted', value_name: '1-10', points: 1, is_active: true },
  { dimension: 'users_impacted', value_name: '11-50', points: 2, is_active: true },
  { dimension: 'users_impacted', value_name: '51-200', points: 3, is_active: true },
  { dimension: 'users_impacted', value_name: '200+', points: 4, is_active: true },

  // --- Deadline Proximity ---
  // Labels are sourced from DEADLINE_PROXIMITY_BUCKETS to ensure engine and DB stay in sync.
  {
    dimension: 'deadline_proximity',
    value_name: TICKET_DEADLINE_PROXIMITY_BUCKETS.OVER_SEVEN_DAYS,
    points: 1,
    is_active: true,
  },
  {
    dimension: 'deadline_proximity',
    value_name: TICKET_DEADLINE_PROXIMITY_BUCKETS.THREE_TO_SEVEN_DAYS,
    points: 2,
    is_active: true,
  },
  {
    dimension: 'deadline_proximity',
    value_name: TICKET_DEADLINE_PROXIMITY_BUCKETS.ONE_TO_THREE_DAYS,
    points: 3,
    is_active: true,
  },
  {
    dimension: 'deadline_proximity',
    value_name: TICKET_DEADLINE_PROXIMITY_BUCKETS.UNDER_24H,
    points: 4,
    is_active: true,
  },
];

/**
 * Score-to-priority threshold mappings.
 *
 * Covers the full possible score range (4-19).
 * Ranges are non-overlapping and contiguous — the engine throws if no threshold matches.
 *
 * Score breakdown:
 *   P4:  4-5   (all-low inputs, minimal NLP nudge)
 *   P3:  6-9   (low-to-moderate inputs)
 *   P2: 10-13  (moderate-to-high inputs)
 *   P1: 14-19  (high/critical inputs, or strong NLP nudge into critical territory)
 *
 * ticket_priority_id is resolved from the priority name at seed time in data-generators.ts.
 */
export interface PriorityThresholdRow {
  priority_name: string;
  min_score: number;
  max_score: number;
  is_active: boolean;
}

export const PRIORITY_THRESHOLDS_SEED_DATA: PriorityThresholdRow[] = [
  { priority_name: 'P4', min_score: 4, max_score: 5, is_active: true },
  { priority_name: 'P3', min_score: 6, max_score: 9, is_active: true },
  { priority_name: 'P2', min_score: 10, max_score: 13, is_active: true },
  { priority_name: 'P1', min_score: 14, max_score: 19, is_active: true },
];

/**
 * NLP anchor embeddings for the priority engine.
 *
 * Each anchor represents a labelled urgency pole. At runtime the engine embeds
 * the ticket description and takes the urgency_score of the highest-similarity anchor
 * as the NLP signal.
 *
 * urgency_score is in [-1.0, 1.0]:
 *   +1.0 = maximally urgent (nudges score toward P1)
 *   -1.0 = maximally trivial (nudges score toward P4)
 *    0.0 = neutral (no NLP influence)
 *
 * The `embedding` column is populated at seed time by the BertEmbedder — these rows
 * intentionally omit it; data-generators.ts handles embedding generation before insert.
 */
export const PRIORITY_ANCHORS_SEED_DATA: PriorityAnchorRow[] = [
  {
    label: 'critical_outage',
    description_text:
      'Complete system outage. All users cannot access the platform. Production is down. Immediate response required.',
    urgency_score: 1.0,
    is_active: true,
  },
  {
    label: 'severe_degradation',
    description_text:
      'Core functionality is severely degraded. Major features are broken and blocking business operations for most users.',
    urgency_score: 0.75,
    is_active: true,
  },
  {
    label: 'partial_disruption',
    description_text:
      'Some features are not working correctly. A workaround exists but the issue is causing notable inconvenience.',
    urgency_score: 0.25,
    is_active: true,
  },
  {
    label: 'routine_request',
    description_text:
      'Standard support request or question. No system functionality is affected. User is seeking guidance or information.',
    urgency_score: -0.25,
    is_active: true,
  },
  {
    label: 'minor_cosmetic',
    description_text:
      'Minor cosmetic issue or low-priority enhancement request. No functional impact. Can be addressed in a future release.',
    urgency_score: -0.75,
    is_active: true,
  },
];
