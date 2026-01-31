/**
 * Semantic Coprocessor Client
 *
 * TypeScript client for communicating with the Python ML semantic coprocessor.
 * This is a STUB implementation - actual integration will be done in Phase 2.
 *
 * See docs/SEMANTIC_COPROCESSOR.md for architecture details.
 *
 * @version 1.0.0 (stub)
 */
export interface SemanticCoprocessorConfig {
    /** Coprocessor endpoint URL (e.g., "http://localhost:8000") */
    endpoint: string;
    /** Request timeout in milliseconds (default: 5000) */
    timeout: number;
    /** Maximum texts per batch request (default: 32) */
    batchSize: number;
    /** Fall back to structural projections if coprocessor unavailable (default: true) */
    fallbackToStructural: boolean;
}
export interface EmbeddingRequest {
    /** Array of texts to embed */
    texts: string[];
    /** Model to use: 'fast' (MiniLM) or 'accurate' (MPNet) */
    model?: 'fast' | 'accurate';
}
export interface EmbeddingResponse {
    /** Array of embedding vectors (one per input text) */
    embeddings: number[][];
    /** Model used for embedding */
    model: string;
    /** Processing latency in milliseconds */
    latency_ms: number;
}
export interface SimilarityRequest {
    /** First text to compare */
    text_a: string;
    /** Second text to compare */
    text_b: string;
}
export interface SimilarityResponse {
    /** Semantic similarity score (0-1) */
    similarity: number;
    /** Model confidence in the similarity score */
    confidence: number;
}
export interface HealthCheckResponse {
    /** Service status */
    status: 'ok' | 'degraded' | 'error';
    /** List of loaded models */
    models_loaded: string[];
    /** Service version */
    version: string;
}
/**
 * Default configuration for the semantic coprocessor client
 */
export declare const DEFAULT_CONFIG: SemanticCoprocessorConfig;
/**
 * Check if semantic coprocessor is enabled via environment variable
 */
export declare function isSemanticCoprocessorEnabled(): boolean;
/**
 * Semantic Coprocessor Client
 *
 * STUB IMPLEMENTATION - Returns fallback values until Phase 2 integration.
 *
 * Usage:
 * ```typescript
 * const client = new SemanticCoprocessorClient();
 *
 * // Check if coprocessor is available
 * const isHealthy = await client.healthCheck();
 *
 * // Get embeddings
 * const response = await client.embed({ texts: ['Hello world'] });
 *
 * // Get similarity
 * const similarity = await client.similarity({ text_a: 'Hello', text_b: 'Hi' });
 * ```
 */
export declare class SemanticCoprocessorClient {
    private config;
    private isAvailable;
    constructor(config?: Partial<SemanticCoprocessorConfig>);
    /**
     * Check if the semantic coprocessor is healthy and available
     *
     * STUB: Always returns false until Phase 2 integration
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get semantic embeddings for texts
     *
     * STUB: Falls back to structural projections until Phase 2 integration
     */
    embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    /**
     * Calculate semantic similarity between two texts
     *
     * STUB: Falls back to structural projection distance until Phase 2 integration
     */
    similarity(request: SimilarityRequest): Promise<SimilarityResponse>;
    /**
     * Fallback embedding using structural projections
     * Uses the same hash-based approach as v2.ts createStructuralProjection
     */
    private fallbackEmbed;
    /**
     * Fallback similarity using structural projection distance
     */
    private fallbackSimilarity;
    /**
     * Create structural projection (hash-based, NOT semantic)
     * Copied from v2.ts for consistency
     */
    private createStructuralProjection;
    /**
     * Calculate projection distance (cosine similarity)
     */
    private projectionDistance;
}
export declare const semanticCoprocessor: SemanticCoprocessorClient;
