import type { TicketsDAO } from '../../daos/children/tickets.dao.js';
import type { QuotesDAO } from '../../daos/children/quotes.dao.js';
import type { TicketEmbeddingsDAO } from '../../daos/children/ticket.embeddings.dao.js';
import type { BertEmbedder } from '../../lib/nlp/bert-embedder.js';
import { cosineSimilarity } from '../../lib/nlp/cosine-similarity.js';
import type { TicketId } from '../../database/types/ids.js';
import type { SimilarTicketResult } from './ticket.similarity.service.types.js';

const DEFAULT_TOP_N = 5;

export class TicketSimilarityService {
  private ticketsDAO: TicketsDAO;
  private quotesDAO: QuotesDAO;
  private embeddingsDAO: TicketEmbeddingsDAO;
  private embedder: BertEmbedder | null;

  constructor(
    ticketsDAO: TicketsDAO,
    quotesDAO: QuotesDAO,
    embeddingsDAO: TicketEmbeddingsDAO,
    embedder: BertEmbedder | null
  ) {
    this.ticketsDAO = ticketsDAO;
    this.quotesDAO = quotesDAO;
    this.embeddingsDAO = embeddingsDAO;
    this.embedder = embedder;
  }

  /**
   * Compute and persist an embedding for a ticket's description.
   * No-ops silently when the embedder is unavailable (non-production / no AWS).
   * Called immediately after a ticket row is created.
   *
   * @param ticketId Newly created ticket
   * @param description Ticket description text to embed
   */
  async computeAndStoreEmbedding(ticketId: TicketId, description: string): Promise<void> {
    if (!this.embedder) return;

    try {
      const embedding = await this.embedder.embed(description);
      await this.embeddingsDAO.upsert(ticketId, embedding);
    } catch (err) {
      // Embedding failures must never surface to the caller -- the ticket has
      // already been created successfully. Log and move on.
      console.error(`Failed to compute embedding for ticket ${String(ticketId)}:`, err);
    }
  }

  /**
   * Find the most similar resolved historical tickets to the given ticket.
   *
   * Strategy:
   *   1. Filter candidates to the same (type, severity, impact) bucket.
   *   2. Load stored embeddings for all candidates and the query ticket.
   *   3. Rank by cosine similarity, return top N with their approved quotes.
   *
   * Returns an empty array when:
   *   - The embedder is unavailable
   *   - The query ticket has no stored embedding
   *   - No resolved tickets exist in the bucket
   *   - No candidates have stored embeddings
   *
   * @param ticketId Ticket to find similar tickets for
   * @param topN Maximum number of results to return (default 5)
   * @returns Ranked array of SimilarTicketResult, most similar first
   */
  async findSimilar(ticketId: TicketId, topN = DEFAULT_TOP_N): Promise<SimilarTicketResult[]> {
    if (!this.embedder) return [];

    const queryTicket = await this.ticketsDAO.findWithDetails(ticketId);
    if (!queryTicket) return [];

    const queryEmbeddingRow = await this.embeddingsDAO.findByTicketIds([ticketId]);
    if (queryEmbeddingRow.length === 0) return [];
    const queryEmbedding = queryEmbeddingRow[0].embedding;

    const candidates = await this.ticketsDAO.findResolvedByBucket(
      queryTicket.ticket_type_id,
      queryTicket.ticket_severity_id,
      queryTicket.business_impact_id,
      ticketId
    );

    if (candidates.length === 0) return [];

    const candidateIds = candidates.map((t) => t.id);
    const storedEmbeddings = await this.embeddingsDAO.findByTicketIds(candidateIds);

    // Index embeddings by ticket_id for O(1) lookup
    const embeddingMap = new Map<string, number[]>(
      storedEmbeddings.map((row) => [row.ticket_id as string, row.embedding])
    );

    // Score candidates that have a stored embedding
    const scored = candidates
      .filter((t) => embeddingMap.has(t.id as string))
      .map((t) => ({
        ticket: t,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        similarityScore: cosineSimilarity(queryEmbedding, embeddingMap.get(t.id as string)!),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topN);

    if (scored.length === 0) return [];

    const topTicketIds = scored.map((s) => s.ticket.id);
    const quoteMap = await this.quotesDAO.findLatestApprovedForTickets(topTicketIds);

    return scored.map((s) => ({
      ticket: s.ticket,
      quote: quoteMap.get(s.ticket.id as string) ?? null,
      similarityScore: s.similarityScore,
    }));
  }
}
