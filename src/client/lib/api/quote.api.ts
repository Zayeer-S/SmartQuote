import type {
  ApproveQuoteRequest,
  CreateManualQuoteRequest,
  GenerateQuoteResponse,
  ListQuotesResponse,
  ListRevisionsResponse,
  QuoteApprovalResponse,
  QuoteResponse,
  QuoteWithApprovalResponse,
  RejectQuoteRequest,
  UpdateQuoteRequest,
} from '../../../shared/contracts/quote-contracts.js';
import { TICKET_ENDPOINTS, QUOTE_ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

const ticketBase = TICKET_ENDPOINTS.BASE;

export const quoteAPI = {
  /**
   * List all quotes for a ticket
   * @param ticketId Parent ticket ID
   * @returns Array of quotes
   */
  async listQuotes(ticketId: string): Promise<ListQuotesResponse> {
    const response = await httpClient.get<ApiResponse<ListQuotesResponse>>(
      ticketBase + QUOTE_ENDPOINTS.LIST(ticketId)
    );
    return extractData(response);
  },

  /**
   * Auto-generate a quote for a ticket using the rule engine + ML estimator.
   * Returns both outputs; the rule-based quote is persisted, the ML estimate
   * is display-only until an admin applies it.
   * @param ticketId Parent ticket ID
   * @returns Rule-based quote and optional ML estimate
   */
  async generateQuote(ticketId: string): Promise<GenerateQuoteResponse> {
    const response = await httpClient.post<ApiResponse<GenerateQuoteResponse>>(
      ticketBase + QUOTE_ENDPOINTS.GENERATE(ticketId)
    );
    return extractData(response);
  },

  /**
   * Manually create a quote for a ticket
   * @param ticketId Parent ticket ID
   * @param payload Quote fields
   * @returns The created quote
   */
  async createManualQuote(
    ticketId: string,
    payload: CreateManualQuoteRequest
  ): Promise<QuoteResponse> {
    const response = await httpClient.post<ApiResponse<QuoteResponse>>(
      ticketBase + QUOTE_ENDPOINTS.CREATE_MANUAL(ticketId),
      payload
    );
    return extractData(response);
  },

  /**
   * Get a single quote by ID
   * @param ticketId Parent ticket ID
   * @param quoteId Target quote ID
   * @returns Quote with approval status
   */
  async getQuote(ticketId: string, quoteId: string): Promise<QuoteWithApprovalResponse> {
    const response = await httpClient.get<ApiResponse<QuoteWithApprovalResponse>>(
      ticketBase + QUOTE_ENDPOINTS.GET(ticketId, quoteId)
    );
    return extractData(response);
  },

  /**
   * Update a quote's fields
   * @param ticketId Parent ticket ID
   * @param quoteId Target quote ID
   * @param payload Fields to update -- reason is mandatory
   * @returns Updated quote
   */
  async updateQuote(
    ticketId: string,
    quoteId: string,
    payload: UpdateQuoteRequest
  ): Promise<QuoteResponse> {
    const response = await httpClient.patch<ApiResponse<QuoteResponse>>(
      ticketBase + QUOTE_ENDPOINTS.UPDATE(ticketId, quoteId),
      payload
    );
    return extractData(response);
  },

  /**
   * Submit a quote for approval
   * @param ticketId Parent ticket ID
   * @param quoteId Target quote ID
   * @returns Updated quote
   */
  async submitForApproval(ticketId: string, quoteId: string): Promise<QuoteResponse> {
    const response = await httpClient.post<ApiResponse<QuoteResponse>>(
      ticketBase + QUOTE_ENDPOINTS.SUBMIT(ticketId, quoteId)
    );
    return extractData(response);
  },

  /**
   * Manager approves a submitted quote (APPROVED_BY_AGENT -> APPROVED_BY_MANAGER)
   * @param ticketId Parent ticket ID
   * @param quoteId Target quote ID
   * @param payload Optional approval comment
   * @returns Approval record
   */
  async managerApproveQuote(
    ticketId: string,
    quoteId: string,
    payload: ApproveQuoteRequest
  ): Promise<QuoteApprovalResponse> {
    const response = await httpClient.post<ApiResponse<QuoteApprovalResponse>>(
      ticketBase + QUOTE_ENDPOINTS.MANAGER_APPROVE(ticketId, quoteId),
      payload
    );
    return extractData(response);
  },

  /**
   * Manager rejects a submitted quote (APPROVED_BY_AGENT -> REJECTED_BY_MANAGER)
   * @param ticketId Parent ticket ID
   * @param quoteId Target quote ID
   * @param payload Rejection comment -- mandatory
   * @returns Approval record
   */
  async managerRejectQuote(
    ticketId: string,
    quoteId: string,
    payload: RejectQuoteRequest
  ): Promise<QuoteApprovalResponse> {
    const response = await httpClient.post<ApiResponse<QuoteApprovalResponse>>(
      ticketBase + QUOTE_ENDPOINTS.MANAGER_REJECT(ticketId, quoteId),
      payload
    );
    return extractData(response);
  },

  /**
   * Admin bypasses agent + manager steps (APPROVED_BY_AGENT -> APPROVED_BY_ADMIN)
   * @param ticketId Parent ticket ID
   * @param quoteId Target quote ID
   * @param payload Optional approval comment
   * @returns Approval record
   */
  async adminApproveQuote(
    ticketId: string,
    quoteId: string,
    payload: ApproveQuoteRequest
  ): Promise<QuoteApprovalResponse> {
    const response = await httpClient.post<ApiResponse<QuoteApprovalResponse>>(
      ticketBase + QUOTE_ENDPOINTS.ADMIN_APPROVE(ticketId, quoteId),
      payload
    );
    return extractData(response);
  },

  /**
   * Customer accepts a quote (APPROVED_BY_MANAGER | APPROVED_BY_ADMIN -> APPROVED_BY_CUSTOMER)
   * @param ticketId Parent ticket ID
   * @param quoteId Target quote ID
   * @param payload Optional acceptance comment
   * @returns Approval record
   */
  async customerApproveQuote(
    ticketId: string,
    quoteId: string,
    payload: ApproveQuoteRequest
  ): Promise<QuoteApprovalResponse> {
    const response = await httpClient.post<ApiResponse<QuoteApprovalResponse>>(
      ticketBase + QUOTE_ENDPOINTS.CUSTOMER_APPROVE(ticketId, quoteId),
      payload
    );
    return extractData(response);
  },

  /**
   * Customer rejects a quote (APPROVED_BY_MANAGER | APPROVED_BY_ADMIN -> REJECTED_BY_CUSTOMER)
   * @param ticketId Parent ticket ID
   * @param quoteId Target quote ID
   * @param payload Rejection comment -- mandatory
   * @returns Approval record
   */
  async customerRejectQuote(
    ticketId: string,
    quoteId: string,
    payload: RejectQuoteRequest
  ): Promise<QuoteApprovalResponse> {
    const response = await httpClient.post<ApiResponse<QuoteApprovalResponse>>(
      ticketBase + QUOTE_ENDPOINTS.CUSTOMER_REJECT(ticketId, quoteId),
      payload
    );
    return extractData(response);
  },

  /**
   * Get revision history for a quote
   * @param ticketId Parent ticket ID
   * @param quoteId Target quote ID
   * @returns Array of revisions
   */
  async getRevisionHistory(ticketId: string, quoteId: string): Promise<ListRevisionsResponse> {
    const response = await httpClient.get<ApiResponse<ListRevisionsResponse>>(
      ticketBase + QUOTE_ENDPOINTS.REVISIONS(ticketId, quoteId)
    );
    return extractData(response);
  },
};
