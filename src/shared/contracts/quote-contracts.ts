import {
  QuoteApprovalStatus,
  QuoteConfidenceLevel,
  QuoteCreator,
  QuoteEffortLevel,
  TicketPriority,
} from '../constants';

export interface CreateManualQuoteRequest {
  estimatedHoursMinimum: number;
  estimatedHoursMaximum: number;
  hourlyRate: number;
  fixedCost: number;
  quoteEffortLevel: QuoteEffortLevel;
  quoteConfidenceLevel: QuoteConfidenceLevel | null;
}

export interface UpdateQuoteRequest {
  estimatedHoursMinimum?: number;
  estimatedHoursMaximum?: number;
  hourlyRate?: number;
  fixedCost?: number;
  quoteEffortLevel?: QuoteEffortLevel;
  quoteConfidenceLevel?: QuoteConfidenceLevel | null;
  /** Mandatory reason for the change -- used to populate quote_detail_revisions */
  reason: string;
}

export interface ApproveQuoteRequest {
  comment?: string | null;
}

export interface RejectQuoteRequest {
  comment: string;
}

export interface QuoteResponse {
  id: string;
  ticketId: string;
  version: number;
  estimatedHoursMinimum: number;
  estimatedHoursMaximum: number;
  estimatedResolutionTime: number;
  hourlyRate: number;
  estimatedCost: number;
  fixedCost: number;
  finalCost: number | null;
  mlEstimatedHoursMinimum: number | null;
  mlEstimatedHoursMaximum: number | null;
  mlEstimatedCost: number | null;
  mlSuggestedTicketPriority: TicketPriority | null;
  mlPriorityConfidence: number | null;
  quoteConfidenceLevel: QuoteConfidenceLevel | null;
  quoteApprovalId: number | null;
  suggestedTicketPriority: TicketPriority;
  quoteEffortLevel: QuoteEffortLevel;
  quoteCreator: QuoteCreator;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteWithApprovalResponse extends QuoteResponse {
  approvalStatus: QuoteApprovalStatus | null;
  approvalComment: string | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
}

export interface ListQuotesResponse {
  quotes: QuoteWithApprovalResponse[];
}

export interface QuoteApprovalResponse {
  id: number;
  approvedByUserId: string;
  userRole: string;
  approvalStatus: QuoteApprovalStatus;
  comment: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteRevisionResponse {
  id: number;
  quoteId: string;
  changedByUserId: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
  createdAt: string;
}

export interface ListRevisionsResponse {
  revisions: QuoteRevisionResponse[];
}

/**
 * ML-derived quote estimate returned alongside the rule-based quote.
 * Null fields indicate the estimate is unavailable (no embedding yet,
 * Lambda cold-start failure, etc.).
 */
export interface MLQuoteEstimate {
  estimatedHoursMinimum: number;
  estimatedHoursMaximum: number;
  estimatedCost: number;
  /** Priority name resolved server-side (e.g. "P1"). */
  suggestedTicketPriority: TicketPriority;
  /**
   * Max class probability from the XGBoost classifier (0-1).
   * Low value = model is uncertain between adjacent priority classes.
   */
  priorityConfidence: number;
}

/**
 * Response shape for the auto-generate quote endpoint.
 * The ML estimate is persisted on the same quote row (ml_* columns) so it
 * survives refresh. mlEstimate is null if the ticket had no embedding yet or
 * the Lambda failed at generation time.
 */
export interface GenerateQuoteResponse {
  /** Persisted quote from the rule-based engine, with ML columns populated if available. */
  ruleBased: QuoteResponse;
  /**
   * ML estimate derived from the persisted ml_* columns on the quote row.
   * Null if unavailable at generation time.
   */
  mlEstimate: MLQuoteEstimate | null;
}
