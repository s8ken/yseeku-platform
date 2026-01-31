"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.semanticCoprocessor = exports.SemanticCoprocessorClient = exports.DEFAULT_CONFIG = void 0;
exports.isSemanticCoprocessorEnabled = isSemanticCoprocessorEnabled;
/**
 * Default configuration for the semantic coprocessor client
 */
exports.DEFAULT_CONFIG = {
    endpoint: process.env.SONATE_SEMANTIC_COPROCESSOR_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.SONATE_SEMANTIC_COPROCESSOR_TIMEOUT || '5000', 10),
    batchSize: 32,
    fallbackToStructural: process.env.SONATE_SEMANTIC_COPROCESSOR_FALLBACK !== 'false',
};
/**
 * Check if semantic coprocessor is enabled via environment variable
 */
function isSemanticCoprocessorEnabled() {
    return process.env.SONATE_SEMANTIC_COPROCESSOR_ENABLED === 'true';
}
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
class SemanticCoprocessorClient {
    constructor(config = {}) {
        this.isAvailable = false;
        this.config = { ...exports.DEFAULT_CONFIG, ...config };
    }
    /**
     * Check if the semantic coprocessor is healthy and available
     *
     * STUB: Always returns false until Phase 2 integration
     */
    async healthCheck() {
        if (!isSemanticCoprocessorEnabled()) {
            return false;
        }
        // STUB: In Phase 2, this will make an actual HTTP request
        // For now, return false to indicate coprocessor is not available
        console.warn('[SemanticCoprocessorClient] STUB: healthCheck() - coprocessor not yet integrated');
        this.isAvailable = false;
        return false;
    }
    /**
     * Get semantic embeddings for texts
     *
     * STUB: Falls back to structural projections until Phase 2 integration
     */
    async embed(request) {
        if (!isSemanticCoprocessorEnabled() || !this.isAvailable) {
            // Fallback to structural projections
            console.warn('[SemanticCoprocessorClient] STUB: embed() - using structural projection fallback');
            return this.fallbackEmbed(request);
        }
        // STUB: In Phase 2, this will make an actual HTTP request to the Python coprocessor
        return this.fallbackEmbed(request);
    }
    /**
     * Calculate semantic similarity between two texts
     *
     * STUB: Falls back to structural projection distance until Phase 2 integration
     */
    async similarity(request) {
        if (!isSemanticCoprocessorEnabled() || !this.isAvailable) {
            // Fallback to structural projection distance
            console.warn('[SemanticCoprocessorClient] STUB: similarity() - using structural projection fallback');
            return this.fallbackSimilarity(request);
        }
        // STUB: In Phase 2, this will make an actual HTTP request to the Python coprocessor
        return this.fallbackSimilarity(request);
    }
    /**
     * Fallback embedding using structural projections
     * Uses the same hash-based approach as v2.ts createStructuralProjection
     */
    fallbackEmbed(request) {
        const embeddings = request.texts.map(text => this.createStructuralProjection(text));
        return {
            embeddings,
            model: 'structural-projection-fallback',
            latency_ms: 1,
        };
    }
    /**
     * Fallback similarity using structural projection distance
     */
    fallbackSimilarity(request) {
        const projA = this.createStructuralProjection(request.text_a);
        const projB = this.createStructuralProjection(request.text_b);
        const similarity = this.projectionDistance(projA, projB);
        return {
            similarity,
            confidence: 0.5, // Low confidence for structural fallback
        };
    }
    /**
     * Create structural projection (hash-based, NOT semantic)
     * Copied from v2.ts for consistency
     */
    createStructuralProjection(text, dims = 384) {
        const vector = new Array(dims).fill(0);
        let seed = 2166136261;
        for (let i = 0; i < text.length; i++) {
            seed ^= text.charCodeAt(i);
            seed = Math.imul(seed, 16777619);
        }
        const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
        for (const token of tokens) {
            let t = seed;
            for (let i = 0; i < token.length; i++) {
                t ^= token.charCodeAt(i);
                t = Math.imul(t, 2246822507);
            }
            const idx = Math.abs(t) % dims;
            vector[idx] += 1;
        }
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
        return vector.map((v) => v / norm);
    }
    /**
     * Calculate projection distance (cosine similarity)
     */
    projectionDistance(a, b) {
        const len = Math.min(a.length, b.length);
        let dot = 0;
        let an = 0;
        let bn = 0;
        for (let i = 0; i < len; i++) {
            dot += a[i] * b[i];
            an += a[i] * a[i];
            bn += b[i] * b[i];
        }
        const denom = Math.sqrt(an) * Math.sqrt(bn);
        return denom === 0 ? 0 : dot / denom;
    }
}
exports.SemanticCoprocessorClient = SemanticCoprocessorClient;
// Export singleton instance for convenience
exports.semanticCoprocessor = new SemanticCoprocessorClient();
