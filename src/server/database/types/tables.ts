import type {
  AnalyticsId,
  AnalyticsSchemaId,
  BusinessImpactId,
  CommentTypeId,
  FileStorageTypeId,
  NotificationTokenId,
  NotificationTokenTypeId,
  NotificationTypeId,
  OrgRoleId,
  OrganizationId,
  PermissionId,
  PriorityEngineAnchorsId,
  QuoteApprovalId,
  QuoteApprovalStatusId,
  QuoteCalculationRuleId,
  QuoteConfidenceId,
  QuoteCreatorId,
  QuoteDetailRevisionId,
  QuoteEffortLevelId,
  QuoteId,
  RateProfileId,
  RoleId,
  SessionId,
  SlaPolicyId,
  TicketAttachmentId,
  TicketCommentId,
  TicketId,
  TicketPriorityId,
  TicketPriorityRuleId,
  TicketPriorityThresholdId,
  TicketSeverityId,
  TicketStatusId,
  TicketTypeId,
  UserId,
} from './ids.js';

/** UUID type in database. String type in TypeScript. */
export type UUID = string;

/** Decimal type in database. Number type in TypeScript. */
export type Decimal = number;

/** Jsonb type in database. Unknown type in TypeScript. */
export type JsonB = unknown;

export interface BaseAuditRows {
  created_at: Date;
  updated_at: Date;
}

interface DeletableRow {
  deleted_at: Date | null;
}

interface ActivatableRow {
  is_active: boolean;
}

interface NameRow {
  name: string;
}

export type BaseLookupTable<T> = { id: T } & NameRow & ActivatableRow & BaseAuditRows;

export type Role = BaseLookupTable<RoleId>;
export type NotificationType = BaseLookupTable<NotificationTypeId>;
export type Permission = BaseLookupTable<PermissionId>;
export type FileStorageType = BaseLookupTable<FileStorageTypeId>;
export type TicketType = BaseLookupTable<TicketTypeId>;
export type TicketSeverity = BaseLookupTable<TicketSeverityId>;
export type TicketPriority = BaseLookupTable<TicketPriorityId>;
export type BusinessImpact = BaseLookupTable<BusinessImpactId>;
export type TicketStatus = BaseLookupTable<TicketStatusId>;
export type CommentType = BaseLookupTable<CommentTypeId>;
export type QuoteEffortLevel = BaseLookupTable<QuoteEffortLevelId>;
export type QuoteCreator = BaseLookupTable<QuoteCreatorId>;
export type QuoteApprovalStatus = BaseLookupTable<QuoteApprovalStatusId>;
export type QuoteConfidenceLevel = BaseLookupTable<QuoteConfidenceId>;
export type NotificationTokenType = BaseLookupTable<NotificationTokenTypeId>;
export type OrgRole = BaseLookupTable<OrgRoleId>;
export type Organization = BaseLookupTable<OrganizationId>;

export interface AnalyticsSchema extends NameRow, ActivatableRow, BaseAuditRows {
  id: AnalyticsSchemaId;
  description: string | null;
  schema_definition: JsonB;
}

export interface User extends BaseAuditRows, DeletableRow {
  id: UserId;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  password: string;
  email: string;
  email_verified: boolean;
  phone_number: string;
  role_id: RoleId;
}

export interface Ticket extends BaseAuditRows, DeletableRow {
  id: TicketId;
  creator_user_id: UserId;
  resolved_by_user_id: UserId | null;
  resolved_at: Date | null;
  assigned_to_user_id: UserId | null;
  organization_id: OrganizationId | null;
  title: string;
  description: string;
  ticket_type_id: TicketTypeId;
  ticket_severity_id: TicketSeverityId;
  business_impact_id: BusinessImpactId;
  ticket_status_id: TicketStatusId;
  ticket_priority_id: TicketPriorityId;
  deadline: Date;
  users_impacted: number;
}

/** Join projection, returned by TicketsDAO.findWithDetails */
export interface TicketWithDetails extends Ticket {
  ticket_type_name: string;
  ticket_severity_name: string;
  business_impact_name: string;
  ticket_status_name: string;
  ticket_priority_name: string;
  organization_name: string;
}

export interface QuoteApproval extends BaseAuditRows {
  id: QuoteApprovalId;
  approved_by_user_id: UserId;
  user_role: string;
  approval_status_id: QuoteApprovalStatusId;
  comment: string | null;
  approved_at: Date | null;
}

export interface Quote extends BaseAuditRows, DeletableRow {
  id: QuoteId;
  ticket_id: TicketId;
  version: number;
  estimated_hours_minimum: Decimal;
  estimated_hours_maximum: Decimal;
  estimated_resolution_time: Decimal;
  hourly_rate: Decimal;
  estimated_cost: Decimal;
  fixed_cost: Decimal;
  final_cost: Decimal | null;
  quote_confidence_level_id: QuoteConfidenceId | null;
  quote_approval_id: QuoteApprovalId | null;
  suggested_ticket_priority_id: TicketPriorityId;
  quote_effort_level_id: QuoteEffortLevelId;
  quote_creator_id: QuoteCreatorId;
}

/** Join projection, returned by QuotesDAO.findWithApproval */
export interface QuoteWithApproval extends Quote {
  approval_status_name: string | null;
  approval_comment: string | null;
  approved_at: Date | null;
  approved_by_user_id: UserId | null;
}

export interface RateProfile extends BaseAuditRows, ActivatableRow {
  id: RateProfileId;
  ticket_type_id: TicketTypeId;
  ticket_severity_id: TicketSeverityId;
  business_impact_id: BusinessImpactId;
  business_hours_rate: Decimal;
  after_hours_rate: Decimal;
  multiplier: Decimal;
  effective_from: Date;
  effective_to: Date;
}

export interface QuoteCalculationRule extends BaseAuditRows, ActivatableRow {
  id: QuoteCalculationRuleId;
  name: string;
  ticket_severity_id: TicketSeverityId;
  business_impact_id: BusinessImpactId;
  suggested_ticket_priority_id: TicketPriorityId;
  users_impacted_min: number;
  users_impacted_max: number;
  urgency_multiplier: Decimal;
  priority_order: number;
}

export interface Analytics extends BaseAuditRows, ActivatableRow {
  id: AnalyticsId;
  schema_id: AnalyticsSchemaId;
  type: string;
  entity_id: UUID;
  organization_id: OrganizationId | null;
  data: JsonB;
}

export interface RolePermission extends BaseAuditRows {
  role_id: RoleId;
  permission_id: PermissionId;
}

export interface OrgRolePermission extends BaseAuditRows {
  org_role_id: OrgRoleId;
  permission_id: PermissionId;
}

export interface OrganizationMember extends BaseAuditRows {
  organization_id: OrganizationId;
  user_id: UserId;
  org_role_id: OrgRoleId;
}

export interface UserNotificationPreference extends BaseAuditRows {
  user_id: UserId;
  notification_type_id: NotificationTypeId;
}

export interface QuoteDetailRevision extends BaseAuditRows {
  id: QuoteDetailRevisionId;
  quote_id: QuoteId;
  changed_by_user_id: UserId;
  field_name: string;
  old_value: string;
  new_value: string;
  reason: string;
}

export interface TicketComment extends BaseAuditRows {
  id: TicketCommentId;
  ticket_id: TicketId;
  user_id: UserId;
  comment_text: string;
  comment_type_id: CommentTypeId;
}

export interface TicketAttachment extends BaseAuditRows {
  id: TicketAttachmentId;
  uploaded_by_user_id: UserId;
  ticket_id: TicketId;
  storage_key: string;
  original_name: string;
  storage_type_id: FileStorageTypeId;
  size_bytes: number;
  mime_type: string;
}

export interface SlaPolicy extends BaseAuditRows, ActivatableRow {
  id: SlaPolicyId;
  name: string;
  user_id: UserId | null;
  organization_id: OrganizationId | null;
  contract: JsonB;
  effective_from: Date;
  effective_to: Date;
}

export interface Session extends BaseAuditRows {
  id: SessionId;
  user_id: UserId;
  session_token: string;
  last_activity: Date;
  expires_at: Date;
}

export interface NotificationToken extends BaseAuditRows {
  id: NotificationTokenId;
  user_id: UserId;
  token_type_id: NotificationTokenTypeId;
  token: string;
  expires_at: Date;
  last_activity: Date;
}

export interface TicketPriorityRule extends BaseAuditRows, ActivatableRow {
  id: TicketPriorityRuleId;
  dimension: string;
  value_name: string;
  points: number;
}

export interface TicketPriorityThreshold extends BaseAuditRows, ActivatableRow {
  id: TicketPriorityThresholdId;
  ticket_priority_id: TicketPriorityId;
  /** Inclusive */
  min_score: number;
  /** Inclusive */
  max_score: number;
}

export interface PriorityEngineAnchor extends BaseAuditRows, ActivatableRow {
  id: PriorityEngineAnchorsId;
  label: string;
  description_text: string;
  urgency_score: number;
}
