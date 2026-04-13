import type { PriorityEngineAnchor } from '../../database/types/tables.js';

interface EmbedResponse {
  embedding: number[];
  dim: number;
}

export class BertEmbedder {
  private serviceUrl: string;

  /**
   * In-memory cache of anchor embeddings, keyed by label.
   * Populated by warmAnchors() at bootstrap. Never changes at runtime.
   */
  private anchorEmbeddings = new Map<string, { embedding: number[]; urgency_score: number }>();

  constructor(serviceUrl: string) {
    this.serviceUrl = serviceUrl;
  }

  /**
   * Fetches and caches embeddings for all active priority engine anchors.
   * Must be called after bootstrap and before the first calculatePriority call.
   *
   * Embeddings are generated from each anchor's description_text.
   * Retries for up to 60s to tolerate the embedding service starting up
   * concurrently with the API server (e.g. npm run dev). Degrades gracefully
   * to rule-based scoring only if the service remains unreachable.
   *
   * @param anchors Active anchor rows from PriorityEngineAnchorsDAO
   */
  async warmAnchors(anchors: PriorityEngineAnchor[]): Promise<void> {
    const WARM_TIMEOUT_MS = 60_000;
    const RETRY_INTERVAL_MS = 3_000;
    const deadline = Date.now() + WARM_TIMEOUT_MS;

    while (Date.now() < deadline) {
      try {
        const entries = await Promise.all(
          anchors.map(async (anchor) => {
            const embedding = await this.embed(anchor.description_text);
            return [anchor.label, { embedding, urgency_score: anchor.urgency_score }] as const;
          })
        );
        this.anchorEmbeddings = new Map(entries);
        return;
      } catch {
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        console.warn(
          `BertEmbedder: embedding service not ready, retrying in ${String(RETRY_INTERVAL_MS / 1000)}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
    }

    console.warn('BertEmbedder: embedding service unavailable after timeout, NLP signal disabled.');
  }

  /**
   * Returns the cached anchor embeddings for use by TicketPriorityEngine.
   * Returns an empty map if warmAnchors() has not been called -- the engine
   * degrades gracefully to pure rule-based scoring in this case.
   */
  getAnchorEmbeddings(): Map<string, { embedding: number[]; urgency_score: number }> {
    return this.anchorEmbeddings;
  }

  /**
   * Embeds a single text string into a 384-dimensional float vector
   * using all-MiniLM-L6-v2 via the embedding microservice.
   *
   * Vectors are L2-normalized by the service, so cosine similarity
   * over cached anchor embeddings works identically to before.
   *
   * @param text The text to embed (ticket description or anchor sentence)
   * @returns A flat number[] of length 384
   */
  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.serviceUrl}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new Error(`BertEmbedder: embedding service returned ${String(res.status)}`);
    }

    const data = (await res.json()) as EmbedResponse;
    return data.embedding;
  }
}
