import type { QuoteWithApproval, TicketWithDetails } from '../../database/types/tables.js';

export interface SimilarTicketResult {
  ticket: TicketWithDetails;
  /** Most recent approved quote for this ticket, or null if none exists */
  quote: QuoteWithApproval | null;
  /** Cosine similarity score between the query ticket and this ticket (0-1) */
  similarityScore: number;
}
