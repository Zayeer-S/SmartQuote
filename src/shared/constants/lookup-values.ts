export const AUTH_ROLES = {
  CUSTOMER: 'Customer',
  SUPPORT_AGENT: 'Support Agent',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
} as const;

export type RoleName = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];

export const PERMISSIONS = {
  TICKETS_CREATE: 'tickets:create',
  TICKETS_READ_OWN: 'tickets:read:own',
  TICKETS_READ_ALL: 'tickets:read:all',
  TICKETS_UPDATE_OWN: 'tickets:update:own',
  TICKETS_UPDATE_ALL: 'tickets:update:all',
  TICKETS_DELETE_OWN: 'tickets:delete:own',
  TICKETS_DELETE_ALL: 'tickets:delete:all',
  TICKETS_ASSIGN: 'tickets:assign',

  QUOTES_CREATE: 'quotes:create',
  QUOTES_READ_OWN: 'quotes:read:own',
  QUOTES_READ_ALL: 'quotes:read:all',
  QUOTES_UPDATE: 'quotes:update',
  QUOTES_APPROVE: 'quotes:approve',
  QUOTES_REJECT: 'quotes:reject',
  QUOTES_DELETE: 'quotes:delete',

  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage:roles',

  ORGANIZATIONS_CREATE: 'organizations:create',
  ORGANIZATIONS_READ: 'organizations:read',
  ORGANIZATIONS_UPDATE: 'organizations:update',
  ORGANIZATIONS_DELETE: 'organizations:delete',

  RATE_PROFILES_CREATE: 'rate_profiles:create',
  RATE_PROFILES_READ: 'rate_profiles:read',
  RATE_PROFILES_UPDATE: 'rate_profiles:update',
  RATE_PROFILES_DELETE: 'rate_profiles:delete',

  SLA_POLICIES_CREATE: 'sla_policies:create',
  SLA_POLICIES_READ: 'sla_policies:read',
  SLA_POLICIES_UPDATE: 'sla_policies:update',
  SLA_POLICIES_DELETE: 'sla_policies:delete',

  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',

  CONFIG_READ: 'config:read',
  CONFIG_UPDATE: 'config:update',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const NOTIFICATION_TYPES = {
  EMAIL: 'Email',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_TOKEN_TYPES = {
  FCM: 'FCM',
  APNS: 'APNS',
} as const;

export type NotificationTokenType =
  (typeof NOTIFICATION_TOKEN_TYPES)[keyof typeof NOTIFICATION_TOKEN_TYPES];

export const FILE_STORAGE_TYPES = {
  LOCAL: 'Local',
  S3: 'S3',
  AZURE: 'Azure Blob Storage',
} as const;

export type FileStorageType = (typeof FILE_STORAGE_TYPES)[keyof typeof FILE_STORAGE_TYPES];

export const TICKET_TYPES = {
  SUPPORT: 'Support',
  INCIDENT: 'Incident',
  ENHANCEMENT: 'Enhancement',
} as const;

export type TicketType = (typeof TICKET_TYPES)[keyof typeof TICKET_TYPES];

export const TICKET_SEVERITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
} as const;

export type TicketSeverity = (typeof TICKET_SEVERITIES)[keyof typeof TICKET_SEVERITIES];

export const BUSINESS_IMPACTS = {
  MINOR: 'Minor',
  MODERATE: 'Moderate',
  MAJOR: 'Major',
  CRITICAL: 'Critical',
} as const;

export type BusinessImpact = (typeof BUSINESS_IMPACTS)[keyof typeof BUSINESS_IMPACTS];

export const TICKET_STATUSES = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
} as const;

export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

export const TICKET_PRIORITIES = {
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
} as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES];

export const COMMENT_TYPES = {
  INTERNAL: 'Internal',
  EXTERNAL: 'External',
  SYSTEM: 'System',
} as const;

export type CommentType = (typeof COMMENT_TYPES)[keyof typeof COMMENT_TYPES];

export const QUOTE_EFFORT_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
} as const;

export type QuoteEffortLevel = (typeof QUOTE_EFFORT_LEVELS)[keyof typeof QUOTE_EFFORT_LEVELS];

export const QUOTE_CREATORS = {
  MANUAL: 'Manual',
  AUTOMATED: 'Automated',
} as const;

export type QuoteCreator = (typeof QUOTE_CREATORS)[keyof typeof QUOTE_CREATORS];

export const QUOTE_APPROVAL_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVISED: 'Revised',
} as const;

export type QuoteApprovalStatus =
  (typeof QUOTE_APPROVAL_STATUSES)[keyof typeof QUOTE_APPROVAL_STATUSES];

export const QUOTE_CONFIDENCE_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
} as const;

export type QuoteConfidenceLevel =
  (typeof QUOTE_CONFIDENCE_LEVELS)[keyof typeof QUOTE_CONFIDENCE_LEVELS];

export const ANALYTICS_SCHEMA_NAMES = {
  TICKET_RESOLUTION_TIME: 'ticket_resolution_time',
  QUOTE_ACCURACY: 'quote_accuracy',
  USER_ACTIVITY: 'user_activity',
} as const;

export type AnalyticsSchemaName =
  (typeof ANALYTICS_SCHEMA_NAMES)[keyof typeof ANALYTICS_SCHEMA_NAMES];

export const SMARTQUOTE_CONFIG_KEYS = {
  HOURS_PER_DAY: 'hours_per_day',
  VELOCITY_MULTIPLIER: 'velocity_multiplier',
} as const;

export type SmartQuoteConfigKey =
  (typeof SMARTQUOTE_CONFIG_KEYS)[keyof typeof SMARTQUOTE_CONFIG_KEYS];

export const ALL_ROLES = Object.values(AUTH_ROLES);
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
export const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPES);
export const ALL_NOTIFICATION_TOKEN_TYPES = Object.values(NOTIFICATION_TOKEN_TYPES);
export const ALL_FILE_STORAGE_TYPES = Object.values(FILE_STORAGE_TYPES);
export const ALL_TICKET_TYPES = Object.values(TICKET_TYPES);
export const ALL_TICKET_SEVERITIES = Object.values(TICKET_SEVERITIES);
export const ALL_BUSINESS_IMPACTS = Object.values(BUSINESS_IMPACTS);
export const ALL_TICKET_STATUSES = Object.values(TICKET_STATUSES);
export const ALL_TICKET_PRIORITIES = Object.values(TICKET_PRIORITIES);
export const ALL_COMMENT_TYPES = Object.values(COMMENT_TYPES);
export const ALL_QUOTE_EFFORT_LEVELS = Object.values(QUOTE_EFFORT_LEVELS);
export const ALL_QUOTE_CREATORS = Object.values(QUOTE_CREATORS);
export const ALL_QUOTE_APPROVAL_STATUSES = Object.values(QUOTE_APPROVAL_STATUSES);
export const ALL_QUOTE_CONFIDENCE_LEVELS = Object.values(QUOTE_CONFIDENCE_LEVELS);
export const ALL_ANALYTICS_SCHEMA_NAMES = Object.values(ANALYTICS_SCHEMA_NAMES);
export const ALL_SMARTQUOTE_CONFIG_KEYS = Object.values(SMARTQUOTE_CONFIG_KEYS);
