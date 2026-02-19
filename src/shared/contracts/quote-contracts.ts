export interface CreateManualQuoteRequest {
  estimatedHoursMinimum: number;
  estimatedHoursMaximum: number;
  hourlyRate: number;
  fixedCost: number;
  quoteEffortLevelId: number;
  quoteConfidenceLevelId: number | null;
}

export interface UpdateQuoteRequest {
  estimatedHoursMinimum?: number;
  estimatedHoursMaximum?: number;
  hourlyRate?: number;
  fixedCost?: number;
  quoteEffortLevelId?: number;
  quoteConfidenceLevelId?: number | null;
  /** Mandatory reason for the change — used to populate quote_detail_revisions */
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
  quoteConfidenceLevelId: number | null;
  quoteApprovalId: number | null;
  suggestedTicketPriorityId: number;
  quoteEffortLevelId: number;
  quoteCreatorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteWithApprovalResponse extends QuoteResponse {
  approvalStatusName: string | null;
  approvalComment: string | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
}

export interface ListQuotesResponse {
  quotes: QuoteResponse[];
}

export interface QuoteApprovalResponse {
  id: number;
  approvedByUserId: string;
  userRole: string;
  approvalStatusId: number;
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
