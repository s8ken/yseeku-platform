"use strict";
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
    maxRetries: parseInt(process.env.SONATE_SEMANTIC_COPROCESSOR_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.SONATE_SEMANTIC_COPROCESSOR_RETRY_DELAY || '100', 10),
    retryBackoff: parseFloat(process.env.SONATE_SEMANTIC_COPROCESSOR_RETRY_BACKOFF || '2'),
    fallbackToStructural: process.env.SONATE_SEMANTIC_COPROCESSOR_FALLBACK !== 'false',
    healthCheckInterval: parseInt(process.env.SONATE_SEMANTIC_COPROCESSOR_HEALTH_CHECK_INTERVAL || '60000', 10),
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
class SemanticCoprocessorClient {
    constructor(config = {}) {
        this.isAvailable = false;
        this.healthCheckTimer = null;
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            fallbackActivations: 0,
            isAvailable: false,
            lastHealthCheck: 0,
        };
        this.config = { ...exports.DEFAULT_CONFIG, ...config };
        // Start periodic health checks if enabled
        if (isSemanticCoprocessorEnabled() && this.config.healthCheckInterval > 0) {
            this.startHealthCheckLoop();
        }
    }
    /**
     * Start periodic health check loop
     */
    startHealthCheckLoop() {
        // Initial health check
        this.healthCheck().catch(() => {
            // Ignore initial errors
        });
        // Periodic health checks
        this.healthCheckTimer = setInterval(() => {
            this.healthCheck().catch(() => {
                // Ignore errors during periodic checks
            });
        }, this.config.healthCheckInterval);
    }
    /**
     * Stop health check loop
     */
    stopHealthCheckLoop() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }
    /**
     * Get client statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset client statistics
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            fallbackActivations: 0,
            isAvailable: this.isAvailable,
            lastHealthCheck: this.stats.lastHealthCheck,
        };
    }
    /**
     * Make HTTP request with retry logic and timeout
     */
    async fetchWithRetry(endpoint, options, retryCount = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        try {
            const response = await fetch(`${this.config.endpoint}${endpoint}`, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.stats.successfulRequests++;
            return data;
        }
        catch (error) {
            clearTimeout(timeoutId);
            // Check if we should retry
            if (retryCount < this.config.maxRetries && this.isRetryableError(error)) {
                const delay = this.config.retryDelay * Math.pow(this.config.retryBackoff, retryCount);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(endpoint, options, retryCount + 1);
            }
            // All retries exhausted or non-retryable error
            this.stats.failedRequests++;
            throw error;
        }
    }
    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        if (error instanceof Error) {
            // Retry on network errors and 5xx errors
            return (error.name === 'AbortError' || // Timeout
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT') ||
                error.message.includes('fetch failed'));
        }
        return false;
    }
    /**
     * Check if the semantic coprocessor is healthy and available
     */
    async healthCheck() {
        if (!isSemanticCoprocessorEnabled()) {
            this.isAvailable = false;
            this.stats.lastHealthCheck = Date.now();
            return false;
        }
        try {
            const response = await this.fetchWithRetry('/health', { method: 'GET' }, 1 // Only retry once for health checks
            );
            this.isAvailable = response.status === 'ok' || response.status === 'degraded';
            this.stats.lastHealthCheck = Date.now();
            return this.isAvailable;
        }
        catch (error) {
            console.warn('[SemanticCoprocessorClient] Health check failed:', error);
            this.isAvailable = false;
            this.stats.lastHealthCheck = Date.now();
            return false;
        }
    }
    /**
     * Get semantic embeddings for texts
     */
    async embed(request) {
        this.stats.totalRequests++;
        if (!isSemanticCoprocessorEnabled() || !this.isAvailable) {
            // Fallback to structural projections
            if (this.config.fallbackToStructural) {
                this.stats.fallbackActivations++;
                return this.fallbackEmbed(request);
            }
            throw new Error('Semantic coprocessor is not available and fallback is disabled');
        }
        try {
            return await this.fetchWithRetry('/embed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
        }
        catch (error) {
            console.warn('[SemanticCoprocessorClient] Embed request failed:', error);
            // Fallback to structural projections if configured
            if (this.config.fallbackToStructural) {
                this.stats.fallbackActivations++;
                return this.fallbackEmbed(request);
            }
            throw error;
        }
    }
    /**
     * Calculate semantic similarity between two texts
     */
    async similarity(request) {
        this.stats.totalRequests++;
        if (!isSemanticCoprocessorEnabled() || !this.isAvailable) {
            // Fallback to structural projection distance
            if (this.config.fallbackToStructural) {
                this.stats.fallbackActivations++;
                return this.fallbackSimilarity(request);
            }
            throw new Error('Semantic coprocessor is not available and fallback is disabled');
        }
        try {
            return await this.fetchWithRetry('/similarity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
        }
        catch (error) {
            console.warn('[SemanticCoprocessorClient] Similarity request failed:', error);
            // Fallback to structural projection distance if configured
            if (this.config.fallbackToStructural) {
                this.stats.fallbackActivations++;
                return this.fallbackSimilarity(request);
            }
            throw error;
        }
    }
    /**
     * Calculate resonance quality for an agent interaction
     */
    async resonance(request) {
        this.stats.totalRequests++;
        if (!isSemanticCoprocessorEnabled() || !this.isAvailable) {
            // Fallback to structural projection-based resonance
            if (this.config.fallbackToStructural) {
                this.stats.fallbackActivations++;
                return this.fallbackResonance(request);
            }
            throw new Error('Semantic coprocessor is not available and fallback is disabled');
        }
        try {
            return await this.fetchWithRetry('/resonance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
        }
        catch (error) {
            console.warn('[SemanticCoprocessorClient] Resonance request failed:', error);
            // Fallback to structural projection-based resonance if configured
            if (this.config.fallbackToStructural) {
                this.stats.fallbackActivations++;
                return this.fallbackResonance(request);
            }
            throw error;
        }
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
            embedding_dim: 384,
            latency_ms: 1,
            cache_hit: false,
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
            confidence: 0.3, // Low confidence for structural fallback
            model: 'structural-projection-fallback',
            latency_ms: 1,
        };
    }
    /**
     * Fallback resonance using structural projection-based metrics
     */
    fallbackResonance(request) {
        const promptEmb = this.createStructuralProjection(request.agent_system_prompt);
        const userEmb = this.createStructuralProjection(request.user_message);
        const responseEmb = this.createStructuralProjection(request.agent_response);
        // Calculate similarities
        const alignmentScore = this.projectionDistance(promptEmb, responseEmb);
        const relevanceScore = this.projectionDistance(userEmb, responseEmb);
        const coherenceScore = (alignmentScore + relevanceScore) / 2;
        // Overall resonance (weighted)
        const resonanceScore = (0.5 * alignmentScore +
            0.3 * relevanceScore +
            0.2 * coherenceScore);
        return {
            resonance_score: resonanceScore,
            alignment_score: alignmentScore,
            coherence_score: coherenceScore,
            model: 'structural-projection-fallback',
            latency_ms: 1,
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
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopHealthCheckLoop();
    }
}
exports.SemanticCoprocessorClient = SemanticCoprocessorClient;
// Export singleton instance for convenience
exports.semanticCoprocessor = new SemanticCoprocessorClient();
// Cleanup on process exit
if (typeof process !== 'undefined' && process.on) {
    process.on('exit', () => {
        exports.semanticCoprocessor.destroy();
    });
}
