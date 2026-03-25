import type {
  AddCommentRequest,
  AssignTicketRequest,
  AttachmentResponse,
  CommentResponse,
  ConfirmAttachmentRequest,
  CreateTicketRequest,
  ListCommentsResponse,
  ListTicketsResponse,
  PresignAttachmentRequest,
  PresignAttachmentResponse,
  TicketDetailResponse,
  TicketResponse,
  UpdateTicketRequest,
} from '../../../shared/contracts/ticket-contracts.js';
import { TICKET_ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

const base = TICKET_ENDPOINTS.BASE;

export const ticketAPI = {
  /**
   * Create a new ticket. Sends as JSON - no binary data.
   * Attachments are uploaded separately via presignAttachment / confirmAttachment.
   *
   * @param payload Ticket creation fields
   * @returns The created ticket
   */
  async createTicket(payload: CreateTicketRequest): Promise<TicketResponse> {
    const response = await httpClient.post<ApiResponse<TicketResponse>>(
      base + TICKET_ENDPOINTS.CREATE,
      payload
    );
    return extractData(response);
  },

  /**
   * Request a presigned S3 PUT URL for a single attachment.
   * The browser should PUT the file directly to the returned presignedUrl,
   * then call confirmAttachment with the returned storageKey.
   *
   * @param ticketId Parent ticket ID
   * @param payload  File metadata
   * @returns storageKey and presignedUrl
   */
  async presignAttachment(
    ticketId: string,
    payload: PresignAttachmentRequest
  ): Promise<PresignAttachmentResponse> {
    const response = await httpClient.post<ApiResponse<PresignAttachmentResponse>>(
      base + TICKET_ENDPOINTS.PRESIGN_ATTACHMENT(ticketId),
      payload
    );
    return extractData(response);
  },

  /**
   * Register an attachment in the database after a successful direct-to-S3 PUT.
   *
   * @param ticketId  Parent ticket ID
   * @param payload   storageKey plus file metadata
   * @returns The created attachment record
   */
  async confirmAttachment(
    ticketId: string,
    payload: ConfirmAttachmentRequest
  ): Promise<AttachmentResponse> {
    const response = await httpClient.post<ApiResponse<AttachmentResponse>>(
      base + TICKET_ENDPOINTS.CONFIRM_ATTACHMENT(ticketId),
      payload
    );
    return extractData(response);
  },

  /**
   * List all tickets visible to the current user
   * @returns Array of tickets
   */
  async listTickets(params?: {
    from?: string;
    to?: string;
    ticketStatus?: string;
    organizationId?: string;
    assigneeId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ListTicketsResponse> {
    const response = await httpClient.get<ApiResponse<ListTicketsResponse>>(
      base + TICKET_ENDPOINTS.LIST,
      { params }
    );
    return extractData(response);
  },

  /**
   * Get a single ticket by ID
   * @param ticketId Target ticket ID
   * @returns Ticket detail with resolved lookup names
   */
  async getTicket(ticketId: string): Promise<TicketDetailResponse> {
    const response = await httpClient.get<ApiResponse<TicketDetailResponse>>(
      base + TICKET_ENDPOINTS.GET(ticketId)
    );
    return extractData(response);
  },

  /**
   * Update a ticket's fields
   * @param ticketId Target ticket ID
   * @param payload Fields to update (all optional)
   * @returns Updated ticket
   */
  async updateTicket(ticketId: string, payload: UpdateTicketRequest): Promise<TicketResponse> {
    const response = await httpClient.patch<ApiResponse<TicketResponse>>(
      base + TICKET_ENDPOINTS.UPDATE(ticketId),
      payload
    );
    return extractData(response);
  },

  /**
   * Delete a ticket (admin only)
   * @param ticketId Target ticket ID
   */
  async deleteTicket(ticketId: string): Promise<void> {
    const response = await httpClient.delete<ApiResponse<void>>(
      base + TICKET_ENDPOINTS.DELETE(ticketId)
    );
    extractData(response);
  },

  /**
   * Assign a ticket to a user (admin only)
   * @param ticketId Target ticket ID
   * @param payload Assignee user ID
   * @returns Updated ticket
   */
  async assignTicket(ticketId: string, payload: AssignTicketRequest): Promise<TicketResponse> {
    const response = await httpClient.post<ApiResponse<TicketResponse>>(
      base + TICKET_ENDPOINTS.ASSIGN(ticketId),
      payload
    );
    return extractData(response);
  },

  /**
   * Mark a ticket as resolved (admin only)
   * @param ticketId Target ticket ID
   * @returns Updated ticket
   */
  async resolveTicket(ticketId: string): Promise<TicketResponse> {
    const response = await httpClient.post<ApiResponse<TicketResponse>>(
      base + TICKET_ENDPOINTS.RESOLVE(ticketId)
    );
    return extractData(response);
  },

  /**
   * List all comments on a ticket
   * @param ticketId Target ticket ID
   * @returns Array of comments
   */
  async listComments(ticketId: string): Promise<ListCommentsResponse> {
    const response = await httpClient.get<ApiResponse<ListCommentsResponse>>(
      base + TICKET_ENDPOINTS.LIST_COMMENTS(ticketId)
    );
    return extractData(response);
  },

  /**
   * Add a comment to a ticket
   * @param ticketId Target ticket ID
   * @param payload Comment text and type
   * @returns The created comment
   */
  async addComment(ticketId: string, payload: AddCommentRequest): Promise<CommentResponse> {
    const response = await httpClient.post<ApiResponse<CommentResponse>>(
      base + TICKET_ENDPOINTS.ADD_COMMENT(ticketId),
      payload
    );
    return extractData(response);
  },
};
