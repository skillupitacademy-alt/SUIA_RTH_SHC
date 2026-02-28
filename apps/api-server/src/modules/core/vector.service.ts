import { Index } from "@upstash/vector";

import { logger } from "@/lib/logger";

/**
 * Service for semantic intelligence using Upstash Vector.
 * Enables meaning-based search and analysis.
 */
export class VectorService {
  private static index: Index | null = null;

  private static getIndex(): Index | null {
    if (this.index !== null) return this.index;

    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (typeof url !== 'string' || url.trim() === '' || typeof token !== 'string' || token.trim() === '') {
      logger.warn("[VectorService] UPSTASH_VECTOR_REST_URL or TOKEN not found. Vector features will be disabled.");
      return null;
    }

    this.index = new Index({
      url,
      token,
    });

    return this.index;
  }

  /**
   * Upsert a vector embedding for a specific question.
   */
  static async upsertQuestion(questionId: string, vector: number[], metadata: Record<string, unknown>) {
    const idx = this.getIndex();
    if (idx === null) return;

    try {
      await idx.upsert({
        id: questionId,
        vector,
        metadata,
      });
      logger.info({ questionId }, "[VectorService] Question vector upserted");
    } catch (error) {
      logger.error({ err: error, questionId }, "[VectorService] Failed to upsert question vector");
    }
  }

  /**
   * Search for similar questions using a vector embedding.
   */
  static async searchSimilar(vector: number[], limit: number = 5) {
    const idx = this.getIndex();
    if (idx === null) return [];

    try {
      const results = await idx.query({
        vector,
        topK: limit,
        includeMetadata: true,
      });
      return results;
    } catch (error) {
      logger.error({ err: error }, "[VectorService] Search similar failed");
      return [];
    }
  }

  /**
   * Delete a question vector.
   */
  static async deleteQuestion(questionId: string) {
    const idx = this.getIndex();
    if (idx === null) return;

    try {
      await idx.delete(questionId);
      logger.info({ questionId }, "[VectorService] Question vector deleted");
    } catch (error) {
      logger.error({ err: error, questionId }, "[VectorService] Failed to delete question vector");
    }
  }
}
