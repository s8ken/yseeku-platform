/**
 * Semantic Metrics
 * 
 * Calculates alignment, continuity, and novelty using real embeddings.
 * Replaces heuristics with mathematically sound semantic calculations.
 */

import { EmbeddingClient, EmbeddingRequest, SemanticMetricsResult } from './embedding-client';

/**
 * Semantic Metrics Calculator
 */
export class SemanticMetrics {
  private embeddingClient: EmbeddingClient;

  constructor(embeddingClient: EmbeddingClient) {
    this.embeddingClient = embeddingClient;
  }

  /**
   * Calculate all semantic metrics for an interaction
   */
  async calculateAllMetrics(
    agentResponse: string,
    userInput: string,
    context: string[] = [],
    previousResponses: string[] = []
  ): Promise<SemanticMetricsResult> {
    const alignment = await this.calculateAlignment(agentResponse, userInput);
    const continuity = await this.calculateContinuity(agentResponse, context);
    const novelty = await this.calculateNovelty(agentResponse, previousResponses);

    return { alignment, continuity, novelty };
  }

  /**
   * Calculate semantic alignment between response and input
   */
  async calculateAlignment(response: string, input: string): Promise<number> {
    const responseEmbedding = await this.embeddingClient.getEmbedding({ text: response });
    const inputEmbedding = await this.embeddingClient.getEmbedding({ text: input });
    
    return this.cosineSimilarity(responseEmbedding.embedding, inputEmbedding.embedding);
  }

  /**
   * Calculate semantic continuity with context
   */
  async calculateContinuity(response: string, context: string[]): Promise<number> {
    if (context.length === 0) return 1.0;

    const responseEmbedding = await this.embeddingClient.getEmbedding({ text: response });
    
    // Calculate average similarity with all context items
    const contextEmbeddings = await this.embeddingClient.batchGetEmbedding(
      context.map(text => ({ text }))
    );
    
    const similarities = contextEmbeddings.map(ctxEmbedding => 
      this.cosineSimilarity(responseEmbedding.embedding, ctxEmbedding.embedding)
    );
    
    return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
  }

  /**
   * Calculate semantic novelty compared to previous responses
   */
  async calculateNovelty(response: string, previousResponses: string[]): Promise<number> {
    if (previousResponses.length === 0) return 1.0;

    const responseEmbedding = await this.embeddingClient.getEmbedding({ text: response });
    
    const previousEmbeddings = await this.embeddingClient.batchGetEmbedding(
      previousResponses.map(text => ({ text }))
    );
    
    // Find minimum distance (most similar) to previous responses
    const similarities = previousEmbeddings.map(prevEmbedding => 
      this.cosineSimilarity(responseEmbedding.embedding, prevEmbedding.embedding)
    );
    
    const maxSimilarity = Math.max(...similarities);
    return 1.0 - maxSimilarity; // Novelty is inverse of similarity
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}