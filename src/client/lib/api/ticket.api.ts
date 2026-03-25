import type {
  AddCommentRequest,
  AssignTicketRequest,
  CommentResponse,
  CreateTicketRequest,
  ListCommentsResponse,
  ListTicketsResponse,
  TicketDetailResponse,
  TicketResponse,
  UpdateTicketRequest,
} from '../../../shared/contracts/ticket-contracts.js';
import { TICKET_ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

const base = TICKET_ENDPOINTS.BASE;

export const ticketAPI = {
  /**
   * Create a new ticket, optionally with file attachments.
   * Always sends as multipart/form-data to satisfy the multer middleware.
   * Axios sets the correct Content-Type boundary automatically when given FormData.
   *
   * @param payload Ticket creation fields including optional attachments
   * @returns The created ticket
   */
  async createTicket(payload: CreateTicketRequest): Promise<TicketResponse> {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('ticketType', payload.ticketType);
    form.append('ticketSeverity', payload.ticketSeverity);
    form.append('businessImpact', payload.businessImpact);
    form.append('deadline', payload.deadline);
    form.append('usersImpacted', String(payload.usersImpacted));

    if (payload.attachments) {
      payload.attachments.forEach((file) => {
        form.append('attachments', file);
      });
    }

    const response = await httpClient.post<ApiResponse<TicketResponse>>(
      base + TICKET_ENDPOINTS.CREATE,
      form,
      // Let axios derive Content-Type from the FormData instance so the multipart boundary is set correctly. Overriding to undefined removes the default 'application/json' header set in http-client.ts.
      { headers: { 'Content-Type': undefined } }
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
