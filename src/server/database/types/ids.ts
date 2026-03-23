type Brand<K, T> = K & { __brand: T };

/** Integer in database. Number in TypeScript. */
export type IntegerId<T> = Brand<number, T>;

/** UUID in database. String in TypeScript. */
export type StringId<T> = Brand<string, T>;

export type RoleId = IntegerId<'Role'>;
export type NotificationTypeId = IntegerId<'NotificationType'>;
export type PermissionId = IntegerId<'Permission'>;
export type FileStorageTypeId = IntegerId<'FileStorageType'>;
export type TicketTypeId = IntegerId<'TicketType'>;
export type TicketSeverityId = IntegerId<'TicketSeverity'>;
export type BusinessImpactId = IntegerId<'BusinessImpact'>;
export type TicketStatusId = IntegerId<'TicketStatus'>;
export type TicketPriorityId = IntegerId<'TicketPriority'>;
export type CommentTypeId = IntegerId<'CommentType'>;
export type QuoteEffortLevelId = IntegerId<'QuoteEffortLevel'>;
export type QuoteCreatorId = IntegerId<'QuoteCreator'>;
export type QuoteApprovalStatusId = IntegerId<'QuoteApprovalStatus'>;
export type QuoteConfidenceId = IntegerId<'QuoteConfidenceLevel'>;
export type AnalyticsSchemaId = IntegerId<'AnalyticsSchema'>;
export type NotificationTokenTypeId = IntegerId<'NotificationTokenType'>;

export type OrganizationId = StringId<'Organization'>;
export type UserId = StringId<'User'>;
export type TicketId = StringId<'Ticket'>;
export type QuoteId = StringId<'Quote'>;
export type SmartQuoteConfigId = StringId<'SmartQuoteConfig'>;

export type QuoteApprovalId = IntegerId<'QuoteApproval'>;
export type RateProfileId = IntegerId<'RateProfile'>;
export type QuoteCalculationRuleId = IntegerId<'QuoteCalculationRule'>;
export type AnalyticsId = IntegerId<'Analytics'>;

export type SessionId = IntegerId<'Session'>;
export type QuoteDetailRevisionId = IntegerId<'QuoteDetailRevision'>;
export type TicketCommentId = IntegerId<'TicketComment'>;
export type TicketAttachmentId = IntegerId<'TicketAttachment'>;
export type OrganizationMemberId = IntegerId<'OrganizationMember'>;
export type SlaPolicyId = IntegerId<'SLAPolicy'>;
export type ResourceUtilizationId = IntegerId<'ResourceUtilization'>;
export type QuoteEffortLevelRangesId = IntegerId<'QuoteEffortLevelRanges'>;
export type NotificationTokenId = IntegerId<'NotificationToken'>;

export type TicketPriorityRuleId = IntegerId<'TicketPriorityRule'>;
export type TicketPriorityThresholdId = IntegerId<'TicketPriorityThreshold'>;
export type PriorityEngineAnchorsId = IntegerId<'PriorityEngineAnchors'>;
