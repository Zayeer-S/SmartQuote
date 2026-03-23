import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';
import type { PriorityEngineAnchor } from '../../database/types/tables.js';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2' as const;

export class BertEmbedder {
  private extractor: FeatureExtractionPipeline | null = null;

  /**
   * In-memory cache of anchor embeddings, keyed by label.
   * Populated by warmAnchors() at bootstrap. Never changes at runtime.
   */
  private anchorEmbeddings = new Map<string, { embedding: number[]; urgency_score: number }>();

  /**
   * Loads and warms the model. Must be called once before any other method.
   * Safe to await at application bootstrap.
   */
  async init(): Promise<void> {
    this.extractor = await pipeline('feature-extraction', MODEL_ID);
  }

  /**
   * Embeds all active anchor rows and caches the results in memory.
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
   * Returns an empty map if warmAnchors() has not been called — the engine
   * degrades gracefully to pure rule-based scoring in this case.
   */
  getAnchorEmbeddings(): Map<string, { embedding: number[]; urgency_score: number }> {
    return this.anchorEmbeddings;
  }

  /**
   * Embeds a single text string into a 384-dimensional float vector.
   *
   * Uses mean pooling over token embeddings and L2 normalisation,
   * which is the standard approach for sentence similarity tasks with
   * MiniLM-style models.
   *
   * @param text The text to embed (ticket description or anchor sentence)
   * @returns A flat number[] of length 384
   * @throws If `init()` has not been called
   */
  async embed(text: string): Promise<number[]> {
    if (!this.extractor) {
      throw new Error('BertEmbedder: call init() before embed()');
    }

    // The FeatureExtractionPipelineOptions type has a known quirk where the
    // `normalize` field is typed as `boolean & string` due to the JSDoc-generated
    // types. We cast the options object to bypass it — the runtime behaviour is correct.
    const result = await this.extractor(text, {
      pooling: 'mean',
      normalize: true,
    } as Parameters<FeatureExtractionPipeline>[1]);

    // result is a Tensor of shape [1, 384] for a single input.
    // tolist() is defined on Tensor but the pipeline return union is wide,
    // so we assert to Tensor to access it. The cast is safe: feature-extraction
    // with mean pooling always returns a Tensor, never a RawImage or other union member.
    const nested = (result as unknown as { tolist: () => number[][] }).tolist();
    return nested[0];
  }
}
