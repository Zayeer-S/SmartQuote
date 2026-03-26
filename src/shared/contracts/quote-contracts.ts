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
