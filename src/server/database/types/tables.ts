import type {
  AnalyticsSchemaId,
  BusinessImpactId,
  CommentTypeId,
  FileStorageTypeId,
  NotificationTokenId,
  NotificationTokenTypeId,
  NotificationTypeId,
  OrganizationId,
  PermissionId,
  QuoteApprovalId,
  QuoteApprovalStatusId,
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

interface IntegerId {
  id: number;
}

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

export interface BaseLookupTable extends NameRow, ActivatableRow, BaseAuditRows {}

// ─── Lookup Tables ────────────────────────────────────────────────────────────

export interface Role extends BaseLookupTable {
  id: RoleId;
}
export interface NotificationType extends BaseLookupTable {
  id: NotificationTypeId;
}
export interface Permission extends BaseLookupTable {
  id: PermissionId;
}
export interface FileStorageType extends BaseLookupTable {
  id: FileStorageTypeId;
}
export interface TicketType extends BaseLookupTable {
  id: TicketTypeId;
}
export interface TicketSeverity extends BaseLookupTable {
  id: TicketSeverityId;
}
export interface TicketPriority extends BaseLookupTable {
  id: TicketPriorityId;
}
export interface BusinessImpact extends BaseLookupTable {
  id: BusinessImpactId;
}
export interface TicketStatus extends BaseLookupTable {
  id: TicketStatusId;
}
export interface CommentType extends BaseLookupTable {
  id: CommentTypeId;
}
export interface QuoteEffortLevel extends BaseLookupTable {
  id: QuoteEffortLevelId;
}
export interface QuoteCreator extends BaseLookupTable {
  id: QuoteCreatorId;
}
export interface QuoteApprovalStatus extends BaseLookupTable {
  id: QuoteApprovalStatusId;
}
export interface QuoteConfidenceLevel extends BaseLookupTable {
  id: QuoteConfidenceId;
}
export interface NotificationTokenType extends BaseLookupTable {
  id: NotificationTokenTypeId;
}

export interface AnalyticsSchema extends IntegerId, NameRow, ActivatableRow, BaseAuditRows {
  description: string | null;
  schema_definition: JsonB;
}

// ─── Organizations ────────────────────────────────────────────────────────────

export interface Organization extends NameRow, ActivatableRow, BaseAuditRows {
  id: OrganizationId;
}

// ─── Main Tables ──────────────────────────────────────────────────────────────

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
  organization_id: OrganizationId | null;
}

export interface Ticket extends BaseAuditRows, DeletableRow {
  id: TicketId;
  creator_user_id: UserId;
  resolved_by_user_id: UserId | null;
  assigned_to_user_id: UserId | null;
  organization_id: OrganizationId;
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
  name: string;
  ticket_type_id: TicketTypeId;
  ticket_severity_id: TicketSeverityId;
  business_impact_id: BusinessImpactId;
  base_hourly_rate: Decimal;
  multiplier: Decimal;
  effective_from: Date;
  effective_to: Date;
}

export interface QuoteCalculationRule extends BaseAuditRows, ActivatableRow {
  id: number;
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
  id: number;
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
  name: string;
  storage_type_id: FileStorageTypeId;
  size_bytes: number;
  mime_type: string;
}

export interface OrganizationMember extends BaseAuditRows {
  id: number;
  organization_id: OrganizationId;
  user_id: UserId;
  role_id: RoleId;
}

export interface SlaPolicy extends BaseAuditRows {
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
