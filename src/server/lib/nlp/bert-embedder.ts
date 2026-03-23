import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { PriorityEngineAnchor } from '../../database/types/tables.js';

const MODEL_ID = 'amazon.titan-embed-text-v2:0' as const;

interface TitanEmbedResponse {
  embedding: number[];
  inputTextTokenCount: number;
}

export class BertEmbedder {
  private client: BedrockRuntimeClient | null = null;

  /**
   * In-memory cache of anchor embeddings, keyed by label.
   * Populated by warmAnchors() at bootstrap. Never changes at runtime.
   */
  private anchorEmbeddings = new Map<string, { embedding: number[]; urgency_score: number }>();

  private getClient(): BedrockRuntimeClient {
    // Instantiated lazily so importing this module in non-AWS environments (CI, local dev) does not trigger credential resolution at startup.
    this.client ??= new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
    return this.client;
  }

  /** and caches the results in memory.
   * Must be called after `init()` and before the first `calculatePriority` call.
   *
   * Embeddings are generated from each anchor's description_text.
   * Runs in parallel across all anchors.
   *
   * @param anchors Active anchor rows from PriorityEngineAnchorsDAO
   */
  async warmAnchors(anchors: PriorityEngineAnchor[]): Promise<void> {
    const entries = await Promise.all(
      anchors.map(async (anchor) => {
        const embedding = await this.embed(anchor.description_text);
        return [anchor.label, { embedding, urgency_score: anchor.urgency_score }] as const;
      })
    );
    this.anchorEmbeddings = new Map(entries);
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
   * Embeds a single text string into a 1024-dimensional float vector
   * using Amazon Titan Text Embeddings V2.
   *
   * Titan V2 returns normalized vectors by default, so cosine similarity
   * over the cached anchor embeddings works identically to before.
   *
   * @param text The text to embed (ticket description or anchor sentence)
   * @returns A flat number[] of length 1024
   */
  async embed(text: string): Promise<number[]> {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({ inputText: text }),
    });

    const response = await this.getClient().send(command);
    const parsed = JSON.parse(Buffer.from(response.body).toString('utf-8')) as TitanEmbedResponse;

    return parsed.embedding;
  }
}
