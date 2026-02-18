export interface LookupItem {
  id: number;
  name: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  ticketTypeId: number;
  ticketSeverityId: number;
  businessImpactId: number;
  ticketPriorityId: number;
  /** ISO 8601 date string */
  deadline: string;
  usersImpacted: number;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  ticketTypeId?: number;
  ticketSeverityId?: number;
  businessImpactId?: number;
  /** ISO 8601 date string */
  deadline?: string;
  usersImpacted?: number;
  /** Admin-only, stripped for customers */
  ticketStatusId?: number;
  /** Admin-only, stripped for customers */
  assignedToUserId?: string | null;
}

export interface AssignTicketRequest {
  assigneeId: string;
}

export interface TicketResponse {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  creatorUserId: string;
  assignedToUserId: string | null;
  resolvedByUserId: string | null;
  ticketTypeId: number;
  ticketSeverityId: number;
  businessImpactId: number;
  ticketStatusId: number;
  ticketPriorityId: number;
  deadline: string;
  usersImpacted: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetailResponse extends TicketResponse {
  ticketTypeName: string;
  ticketSeverityName: string;
  businessImpactName: string;
  ticketStatusName: string;
  ticketPriorityName: string;
  organizationName: string;
}

export interface ListTicketsResponse {
  tickets: TicketResponse[];
}

export interface AddCommentRequest {
  commentText: string;
  commentTypeId: number;
}

export interface CommentResponse {
  id: number;
  ticketId: string;
  userId: string;
  commentText: string;
  commentTypeId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListCommentsResponse {
  comments: CommentResponse[];
}
