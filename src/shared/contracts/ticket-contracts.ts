import {
  BusinessImpact,
  CommentType,
  FileStorageType,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
  TicketType,
} from '../constants';

export interface CreateTicketRequest {
  title: string;
  description: string;
  ticketType: TicketType;
  ticketSeverity: TicketSeverity;
  businessImpact: BusinessImpact;
  /** ISO 8601 date string */
  deadline: string;
  usersImpacted: number;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  ticketType?: TicketType;
  ticketSeverity?: TicketSeverity;
  businessImpact?: BusinessImpact;
  /** ISO 8601 date string */
  deadline?: string;
  usersImpacted?: number;
  /** Admin-only, stripped for customers */
  ticketStatus?: TicketStatus;
  /** Admin-only, stripped for customers */
  assignedToUserId?: string | null;
}

export interface AssignTicketRequest {
  assigneeId: string;
}

/** Request a presigned S3 URL for a single attachment. */
export interface PresignAttachmentRequest {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Returned by the presign endpoint.
 * The browser should PUT the file to presignedUrl, then call the confirm endpoint
 * with the storageKey.
 */
export interface PresignAttachmentResponse {
  storageKey: string;
  presignedUrl: string;
}

/** Sent after a successful direct-to-S3 PUT to register the attachment in the DB. */
export interface ConfirmAttachmentRequest {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface TicketResponse {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  creatorUserId: string;
  assignedToUserId: string | null;
  resolvedByUserId: string | null;
  ticketType: TicketType;
  ticketSeverity: TicketSeverity;
  businessImpact: BusinessImpact;
  ticketStatus: TicketStatus;
  ticketPriority: TicketPriority;
  deadline: string;
  usersImpacted: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketSummaryResponse extends TicketResponse {
  organizationName: string;
}

export interface AttachmentResponse {
  id: string;
  ticketId: string;
  uploadedByUserId: string;
  originalName: string;
  storageKey: string;
  storageType: FileStorageType;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface TicketDetailResponse extends TicketResponse {
  organizationName: string;
  attachments: AttachmentResponse[];
}

export interface ListTicketsResponse {
  tickets: TicketSummaryResponse[];
}

export interface AddCommentRequest {
  commentText: string;
  commentType: CommentType;
}

export interface CommentResponse {
  id: number;
  ticketId: string;
  userId: string;
  commentText: string;
  commentType: CommentType;
  createdAt: string;
  updatedAt: string;
}

export interface ListCommentsResponse {
  comments: CommentResponse[];
}
