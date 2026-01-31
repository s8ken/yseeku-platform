/**
 * Semantic Coprocessor Client
 *
 * TypeScript client for communicating with the Python ML semantic coprocessor.
 * Provides retry logic, timeout handling, and fallback to structural projections.
 *
 * See docs/SEMANTIC_COPROCESSOR.md for architecture details.
 *
 * @version 1.0.0
 */
export interface SemanticCoprocessorConfig {
    /** Coprocessor endpoint URL (e.g., "http://localhost:8000") */
    endpoint: string;
    /** Request timeout in milliseconds (default: 5000) */
    timeout: number;
    /** Maximum texts per batch request (default: 32) */
    batchSize: number;
    /** Number of retry attempts (default: 3) */
    maxRetries: number;
    /** Initial retry delay in milliseconds (default: 100) */
    retryDelay: number;
    /** Exponential backoff factor (default: 2) */
    retryBackoff: number;
    /** Fall back to structural projections if coprocessor unavailable (default: true) */
    fallbackToStructural: boolean;
    /** Health check interval in milliseconds (default: 60000) */
    healthCheckInterval: number;
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
    /** Dimension of embedding vectors */
    embedding_dim: number;
    /** Processing latency in milliseconds */
    latency_ms: number;
    /** Whether result was served from cache */
    cache_hit: boolean;
}
export interface SimilarityRequest {
    /** First text to compare */
    text_a: string;
    /** Second text to compare */
    text_b: string;
    /** Model to use: 'fast' or 'accurate' */
    model?: 'fast' | 'accurate';
}
export interface SimilarityResponse {
    /** Semantic similarity score (0-1) */
    similarity: number;
    /** Model confidence in the similarity score */
    confidence: number;
    /** Model used for similarity calculation */
    model: string;
    /** Processing latency in milliseconds */
    latency_ms: number;
}
export interface ResonanceRequest {
    /** Agent's system prompt */
    agent_system_prompt: string;
    /** User's message */
    user_message: string;
    /** Agent's response */
    agent_response: string;
    /** Model to use: 'fast' or 'accurate' */
    model?: 'fast' | 'accurate';
}
export interface ResonanceResponse {
    /** Resonance quality score (0-1) */
    resonance_score: number;
    /** Alignment between prompt and response (0-1) */
    alignment_score: number;
    /** Coherence within the interaction (0-1) */
    coherence_score: number;
    /** Model used for resonance calculation */
    model: string;
    /** Processing latency in milliseconds */
    latency_ms: number;
}
export interface HealthCheckResponse {
    /** Service status: 'ok', 'degraded', or 'error' */
    status: 'ok' | 'degraded' | 'error';
    /** List of loaded models */
    models_loaded: Record<string, string>;
    /** Service version */
    version: string;
    /** Service uptime in seconds */
    uptime_seconds: number;
    /** Cache statistics */
    cache_stats: {
        hits: number;
        misses: number;
        total: number;
    };
}
export interface ClientStats {
    /** Total requests made */
    totalRequests: number;
    /** Successful requests */
    successfulRequests: number;
    /** Failed requests */
    failedRequests: number;
    /** Fallback activations */
    fallbackActivations: number;
    /** Current availability status */
    isAvailable: boolean;
    /** Last health check timestamp */
    lastHealthCheck: number;
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
 * Complete implementation with retry logic, timeout handling, and fallback.
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
 *
 * // Get resonance
 * const resonance = await client.resonance({
 *   agent_system_prompt: 'You are a helpful assistant',
 *   user_message: 'What is AI?',
 *   agent_response: 'AI stands for Artificial Intelligence...'
 * });
 *
 * // Get client statistics
 * const stats = client.getStats();
 * ```
 */
export declare class SemanticCoprocessorClient {
    private config;
    private isAvailable;
    private healthCheckTimer;
    private stats;
    constructor(config?: Partial<SemanticCoprocessorConfig>);
    /**
     * Start periodic health check loop
     */
    private startHealthCheckLoop;
    /**
     * Stop health check loop
     */
    stopHealthCheckLoop(): void;
    /**
     * Get client statistics
     */
    getStats(): ClientStats;
    /**
     * Reset client statistics
     */
    resetStats(): void;
    /**
     * Make HTTP request with retry logic and timeout
     */
    private fetchWithRetry;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Check if the semantic coprocessor is healthy and available
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get semantic embeddings for texts
     */
    embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    /**
     * Calculate semantic similarity between two texts
     */
    similarity(request: SimilarityRequest): Promise<SimilarityResponse>;
    /**
     * Calculate resonance quality for an agent interaction
     */
    resonance(request: ResonanceRequest): Promise<ResonanceResponse>;
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
     * Fallback resonance using structural projection-based metrics
     */
    private fallbackResonance;
    /**
     * Create structural projection (hash-based, NOT semantic)
     * Copied from v2.ts for consistency
     */
    private createStructuralProjection;
    /**
     * Calculate projection distance (cosine similarity)
     */
    private projectionDistance;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const semanticCoprocessor: SemanticCoprocessorClient;
