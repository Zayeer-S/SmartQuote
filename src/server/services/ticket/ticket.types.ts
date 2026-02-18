import type {
  BusinessImpactId,
  OrganizationId,
  TicketPriorityId,
  TicketSeverityId,
  TicketStatusId,
  TicketTypeId,
  UserId,
} from '../../database/types/ids';

export interface CreateTicketData {
  title: string;
  description: string;
  ticket_type_id: TicketTypeId;
  ticket_severity_id: TicketSeverityId;
  business_impact_id: BusinessImpactId;
  ticket_priority_id: TicketPriorityId;
  deadline: Date;
  users_impacted: number;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  ticket_type_id?: TicketTypeId;
  ticket_severity_id?: TicketSeverityId;
  business_impact_id?: BusinessImpactId;
  deadline?: Date;
  users_impacted?: number;
  /** Agent-only: direct status transitions */
  ticket_status_id?: TicketStatusId;
  /** Agent-only */
  assigned_to_user_id?: UserId | null;
}

export interface ListTicketsFilters {
  organizationId?: OrganizationId;
  statusId?: TicketStatusId;
  assigneeId?: UserId;
}
