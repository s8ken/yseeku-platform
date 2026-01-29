/**
 * Production-Ready Semantic Embedding System
 * Supports multiple embedding models and provides enterprise-grade semantic analysis
 */
export interface EmbeddingResult {
    vector: number[];
    confidence: number;
    model_used: string;
    inference_time_ms: number;
    cache_hit: boolean;
    metadata: {
        token_count: number;
        language_detected?: string;
        semantic_density: number;
    };
}
export interface EmbeddingConfig {
    model: 'sentence-transformers' | 'bert-base' | 'fasttext' | 'fallback';
    dimensions: number;
    cache_size: number;
    max_sequence_length: number;
    normalize_vectors: boolean;
    use_gpu_if_available: boolean;
    provider?: 'openai' | 'together' | 'huggingface' | 'local';
    provider_model?: string;
}
export interface EmbeddingCacheEntry {
    vector: number[];
    timestamp: number;
    access_count: number;
    confidence: number;
}
export declare class SemanticEmbedder {
    private config;
    private model;
    private performanceStats;
    private cacheInitialized;
    constructor(config?: Partial<EmbeddingConfig>);
    /**
     * Initialize the embedder and cache
     */
    initialize(): Promise<void>;
    /**
     * Generate semantic embedding for text
     */
    embed(text: string): Promise<EmbeddingResult>;
    /**
     * Batch embedding for efficiency
     */
    embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): {
        cache_hit_rate: number;
        cache_size: unknown;
        redis_connected: boolean;
        model_loaded: boolean;
        total_inferences: number;
        avg_inference_time_ms: number;
        model_load_time_ms: number;
    };
    /**
     * Clear cache
     */
    clearCache(): Promise<void>;
    private generateCacheKey;
    private generateEmbedding;
    private generateBatchEmbeddings;
    private tokenize;
    private extractLinguisticFeatures;
    private simpleSentimentAnalysis;
    private calculateSemanticDensity;
    private calculateEmbeddingConfidence;
    private detectLanguage;
    private hashString;
    private normalizeVector;
    private updatePerformanceStats;
    private extractMetadata;
    private providerEmbed;
    private defaultProviderModel;
    private avgPool;
    private resizeVector;
    private normalizeReturn;
}
export declare function cosineSimilarity(a: number[], b: number[]): number;
export declare const embedder: SemanticEmbedder;
export declare function embed(text: string): Promise<number[]>;
//# sourceMappingURL=real-embeddings.d.ts.map