import type { LINK_TABLES, LOOKUP_TABLES, MAIN_TABLES } from '../config/table-names';

type Brand<K, T> = K & { __brand: T };

/** Integer in database. Number in TypeScript. */
export type IntegerId<T> = Brand<number, T>;

/** UUID in database. String in TypeScript. */
export type StringId<T> = Brand<string, T>;

export interface TableIdMap {
  [LOOKUP_TABLES.ROLES]: IntegerId<'Role'>;
  [LOOKUP_TABLES.NOTIFICATION_TYPES]: IntegerId<'NotificationType'>;
  [LOOKUP_TABLES.PERMISSIONS]: IntegerId<'Permission'>;
  [LOOKUP_TABLES.FILE_STORAGE_TYPES]: IntegerId<'FileStorageType'>;
  [LOOKUP_TABLES.TICKET_TYPES]: IntegerId<'TicketType'>;
  [LOOKUP_TABLES.TICKET_SEVERITIES]: IntegerId<'TicketSeverity'>;
  [LOOKUP_TABLES.BUSINESS_IMPACTS]: IntegerId<'BusinessImpact'>;
  [LOOKUP_TABLES.TICKET_STATUSES]: IntegerId<'TicketStatus'>;
  [LOOKUP_TABLES.TICKET_PRIORITIES]: IntegerId<'TicketPriority'>;
  [LOOKUP_TABLES.COMMENT_TYPES]: IntegerId<'CommentType'>;
  [LOOKUP_TABLES.QUOTE_EFFORT_LEVELS]: IntegerId<'QuoteEffortLevel'>;
  [LOOKUP_TABLES.QUOTE_CREATORS]: IntegerId<'QuoteCreator'>;
  [LOOKUP_TABLES.QUOTE_APPROVAL_STATUSES]: IntegerId<'QuoteApprovalStatus'>;
  [LOOKUP_TABLES.QUOTE_CONFIDENCE_LEVELS]: IntegerId<'QuoteConfidenceLevel'>;
  [LOOKUP_TABLES.ANALYTICS_SCHEMAS]: IntegerId<'AnalyticsSchema'>;
  [LOOKUP_TABLES.NOTIFICATION_TOKEN_TYPES]: IntegerId<'NotificationTokenType'>;

  [LOOKUP_TABLES.ORGANIZATIONS]: StringId<'Organization'>;

  [MAIN_TABLES.USERS]: StringId<'User'>;
  [MAIN_TABLES.TICKETS]: StringId<'Ticket'>;
  [MAIN_TABLES.QUOTES]: StringId<'Quote'>;

  [MAIN_TABLES.QUOTE_APPROVALS]: IntegerId<'QuoteApproval'>;
  [MAIN_TABLES.RATE_PROFILES]: IntegerId<'RateProfile'>;
  [MAIN_TABLES.QUOTE_CALCULATION_RULES]: IntegerId<'QuoteCalculationRule'>;
  [MAIN_TABLES.ANALYTICS]: IntegerId<'Analytics'>;

  // Link Tables (Integer IDs)
  [LINK_TABLES.SESSIONS]: IntegerId<'Session'>;
  [LINK_TABLES.QUOTE_DETAIL_REVISIONS]: IntegerId<'QuoteDetailRevision'>;
  [LINK_TABLES.TICKET_ATTACHMENTS]: IntegerId<'TicketAttachment'>;
  [LINK_TABLES.ORGANIZATION_MEMBERS]: IntegerId<'OrganizationMember'>;
  [LINK_TABLES.SLA_POLICIES]: IntegerId<'SLAPolicy'>;
  [LINK_TABLES.RESOURCE_UTILIZATIONS]: IntegerId<'ResourceUtilization'>;
  [LINK_TABLES.QUOTE_EFFORT_LEVEL_RANGES]: IntegerId<'QuoteEfforLevelRanges'>;
  [LINK_TABLES.NOTIFICATION_TOKENS]: IntegerId<'NotificationToken'>;

  // Link Tables (Composite Keys - no single ID, but we define for completeness)
  [LINK_TABLES.ROLE_PERMISSIONS]: never;
  [LINK_TABLES.USER_NOTIFICATION_PREFERENCES]: never;
  [LINK_TABLES.TICKET_COMMENTS]: never;
}

export type RoleId = TableIdMap[typeof LOOKUP_TABLES.ROLES];
export type NotificationTypeId = TableIdMap[typeof LOOKUP_TABLES.NOTIFICATION_TYPES];
export type PermissionId = TableIdMap[typeof LOOKUP_TABLES.PERMISSIONS];
export type OrganizationId = TableIdMap[typeof LOOKUP_TABLES.ORGANIZATIONS];
export type FileStorageTypeId = TableIdMap[typeof LOOKUP_TABLES.FILE_STORAGE_TYPES];
export type TicketTypeId = TableIdMap[typeof LOOKUP_TABLES.TICKET_TYPES];
export type TicketSeverityId = TableIdMap[typeof LOOKUP_TABLES.TICKET_SEVERITIES];
export type BusinessImpactId = TableIdMap[typeof LOOKUP_TABLES.BUSINESS_IMPACTS];
export type TicketStatusId = TableIdMap[typeof LOOKUP_TABLES.TICKET_STATUSES];
export type TicketPriorityId = TableIdMap[typeof LOOKUP_TABLES.TICKET_PRIORITIES];
export type CommentTypeId = TableIdMap[typeof LOOKUP_TABLES.COMMENT_TYPES];
export type QuoteEffortLevelId = TableIdMap[typeof LOOKUP_TABLES.QUOTE_EFFORT_LEVELS];
export type QuoteCreatorId = TableIdMap[typeof LOOKUP_TABLES.QUOTE_CREATORS];
export type QuoteApprovalStatusId = TableIdMap[typeof LOOKUP_TABLES.QUOTE_APPROVAL_STATUSES];
export type QuoteConfidenceId = TableIdMap[typeof LOOKUP_TABLES.QUOTE_CONFIDENCE_LEVELS];
export type AnalyticsSchemaId = TableIdMap[typeof LOOKUP_TABLES.ANALYTICS_SCHEMAS];
export type NotificationTokenTypeId = TableIdMap[typeof LOOKUP_TABLES.NOTIFICATION_TOKEN_TYPES];

export type UserId = TableIdMap[typeof MAIN_TABLES.USERS];
export type TicketId = TableIdMap[typeof MAIN_TABLES.TICKETS];
export type QuoteId = TableIdMap[typeof MAIN_TABLES.QUOTES];
export type QuoteApprovalId = TableIdMap[typeof MAIN_TABLES.QUOTE_APPROVALS];
export type RateProfileId = TableIdMap[typeof MAIN_TABLES.RATE_PROFILES];
export type QuoteCalculationRuleId = TableIdMap[typeof MAIN_TABLES.QUOTE_CALCULATION_RULES];
export type AnalyticsId = TableIdMap[typeof MAIN_TABLES.ANALYTICS];

export type SessionId = TableIdMap[typeof LINK_TABLES.SESSIONS];
export type QuoteDetailRevisionId = TableIdMap[typeof LINK_TABLES.QUOTE_DETAIL_REVISIONS];
export type TicketCommentId = TableIdMap[typeof LINK_TABLES.TICKET_COMMENTS];
export type TicketAttachmentId = TableIdMap[typeof LINK_TABLES.TICKET_ATTACHMENTS];
export type OrganizationMemberId = TableIdMap[typeof LINK_TABLES.ORGANIZATION_MEMBERS];
export type SlaPolicyId = TableIdMap[typeof LINK_TABLES.SLA_POLICIES];
export type ResourceUtilizationId = TableIdMap[typeof LINK_TABLES.RESOURCE_UTILIZATIONS];
export type QuoteEfforLevelRangesId = TableIdMap[typeof LINK_TABLES.QUOTE_EFFORT_LEVEL_RANGES];
export type NotificationTokenId = TableIdMap[typeof LINK_TABLES.NOTIFICATION_TOKENS];
