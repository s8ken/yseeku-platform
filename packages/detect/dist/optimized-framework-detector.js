"use strict";
/**
 * Optimized Framework Detector - Sub-50ms Performance Target
 *
 * High-performance implementation of the 5-dimension SONATE Framework detection
 * Optimized for production use with <50ms latency requirement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedFrameworkDetector = void 0;
class OptimizedFrameworkDetector {
    constructor() {
        this.cache = new Map();
        this.CACHE_TTL = 30000; // 30 seconds
        this.CACHE_SIZE = 1000;
    }
    /**
     * Optimized detection with sub-50ms target
     */
    async detect(interaction) {
        const startTime = performance.now();
        // Check cache first
        const content = interaction.content || '';
        const contentHash = this.hashContent(content);
        const cached = this.cache.get(contentHash);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return this.buildResult(cached.scores, cached.timestamp);
        }
        // Optimized parallel calculation with timeout
        const scores = await this.calculateDimensionsOptimized(interaction);
        // Cache result
        this.cacheResult(contentHash, scores);
        const endTime = performance.now();
        const duration = endTime - startTime;
        // Performance warning
        if (duration > 50) {
            console.warn(`Detection took ${duration.toFixed(2)}ms (>50ms target)`);
        }
        return this.buildResult(scores, Date.now());
    }
    /**
     * Optimized dimension calculation with performance shortcuts
     */
    async calculateDimensionsOptimized(interaction) {
        // Fast path: use Promise.all with optimized implementations
        const [reality_index, trust_protocol, ethical_alignment, resonance_quality, canvas_parity] = await Promise.all([
            this.calculateRealityIndexFast(interaction),
            this.calculateTrustProtocolFast(interaction),
            this.calculateEthicalAlignmentFast(interaction),
            this.calculateResonanceQualityFast(interaction),
            this.calculateCanvasParityFast(interaction),
        ]);
        return {
            reality_index,
            trust_protocol,
            ethical_alignment,
            resonance_quality,
            canvas_parity,
        };
    }
    /**
     * Fast reality index calculation (inline, no external calls)
     */
    async calculateRealityIndexFast(interaction) {
        const content = interaction.content.toLowerCase();
        const context = interaction.context.toLowerCase();
        // Quick heuristics for reality scoring
        let score = 5.0; // Base score
        // Mission alignment (metadata check)
        if (interaction.metadata.purpose) {
            score += 1.5;
        }
        // Contextual coherence (simple keyword matching)
        const contextWords = context.split(/\s+/);
        const contentWords = content.split(/\s+/);
        const overlap = contextWords.filter((word) => word.length > 3 && contentWords.includes(word)).length;
        score += Math.min(overlap * 0.5, 2.0);
        // Technical accuracy (avoidance of uncertainty markers)
        const uncertaintyMarkers = ['maybe', 'perhaps', 'possibly', 'might', 'could'];
        const hasUncertainty = uncertaintyMarkers.some((marker) => content.includes(marker));
        if (!hasUncertainty) {
            score += 1.0;
        }
        // Authenticity (AI disclosure)
        if (interaction.metadata.ai_disclosure) {
            score += 0.5;
        }
        return Math.min(Math.max(score, 0), 10);
    }
    /**
     * Fast trust protocol validation
     */
    async calculateTrustProtocolFast(interaction) {
        const content = interaction.content.toLowerCase();
        // Quick trust checks
        const harmfulPatterns = [
            'harmful',
            'illegal',
            'dangerous',
            'violence',
            'hate',
            'discrimination',
            'harassment',
            'abuse',
        ];
        const ethicalPatterns = [
            'ethical',
            'safety',
            'consent',
            'respect',
            'privacy',
            'autonomy',
            'wellbeing',
            'responsible',
        ];
        const hasHarmful = harmfulPatterns.some((pattern) => content.includes(pattern));
        const hasEthical = ethicalPatterns.some((pattern) => content.includes(pattern));
        if (hasHarmful) {
            return 'FAIL';
        }
        if (hasEthical) {
            return 'PASS';
        }
        // Length and complexity check
        if (content.length < 10) {
            return 'FAIL';
        }
        if (content.length > 500) {
            return 'PARTIAL';
        }
        return 'PARTIAL';
    }
    /**
     * Fast ethical alignment scoring
     */
    async calculateEthicalAlignmentFast(interaction) {
        const content = interaction.content.toLowerCase();
        let score = 3.0; // Base score
        // Positive ethical indicators
        const positiveIndicators = [
            'helpful',
            'respect',
            'consent',
            'privacy',
            'safety',
            'ethical',
            'responsible',
            'careful',
            'considerate',
        ];
        // Negative ethical indicators
        const negativeIndicators = [
            'ignore',
            'disregard',
            'harmful',
            'unsafe',
            'unethical',
            'irresponsible',
            'careless',
            'inconsiderate',
        ];
        const positiveCount = positiveIndicators.reduce((count, indicator) => count + (content.split(indicator).length - 1), 0);
        const negativeCount = negativeIndicators.reduce((count, indicator) => count + (content.split(indicator).length - 1), 0);
        score += positiveCount * 0.5;
        score -= Number(negativeCount);
        return Math.min(Math.max(score, 1), 5);
    }
    /**
     * Fast resonance quality measurement (no external API calls)
     */
    async calculateResonanceQualityFast(interaction) {
        const content = interaction.content;
        // Quick heuristics for resonance assessment
        const innovationWords = [
            'innovative',
            'novel',
            'breakthrough',
            'revolutionary',
            'paradigm',
            'transformative',
            'disruptive',
            'pioneering',
        ];
        const creativeWords = [
            'imagine',
            'create',
            'design',
            'invent',
            'discover',
            'explore',
            'envision',
            'conceptualize',
            'synthesize',
        ];
        const innovationCount = innovationWords.reduce((count, word) => count + (content.toLowerCase().split(word).length - 1), 0);
        const creativeCount = creativeWords.reduce((count, word) => count + (content.toLowerCase().split(word).length - 1), 0);
        const totalScore = innovationCount * 2 + creativeCount;
        if (totalScore >= 3) {
            return 'BREAKTHROUGH';
        }
        if (totalScore >= 1) {
            return 'ADVANCED';
        }
        return 'STRONG';
    }
    /**
     * Fast canvas parity calculation
     */
    async calculateCanvasParityFast(interaction) {
        const content = interaction.content;
        let score = 50; // Base score
        // Collaboration indicators
        const collaborationWords = [
            'together',
            'build',
            'collaborate',
            'partner',
            'team',
            'combine',
            'merge',
            'integrate',
            'join',
            'unite',
        ];
        const collaborationCount = collaborationWords.reduce((count, word) => count + (content.toLowerCase().split(word).length - 1), 0);
        score += collaborationCount * 5;
        // Question indicators (engagement)
        const questionCount = (content.match(/\?/g) || []).length;
        score += questionCount * 3;
        // Reference to previous context
        if (interaction.context &&
            content.toLowerCase().includes(interaction.context.toLowerCase().substring(0, 20))) {
            score += 10;
        }
        return Math.min(Math.max(score, 0), 100);
    }
    /**
     * Build final result with optimized receipt generation
     */
    buildResult(scores, timestamp) {
        // Optimized CIQ calculation
        const ciq = {
            clarity: this.calculateClarityFast(scores),
            integrity: scores.trust_protocol === 'PASS' ? 0.9 : 0.5,
            quality: scores.reality_index / 10,
        };
        // Fast receipt hash generation
        const receiptHash = this.generateFastHash(scores, timestamp);
        return {
            ...scores,
            timestamp,
            receipt_hash: receiptHash,
        };
    }
    /**
     * Fast clarity calculation
     */
    calculateClarityFast(scores) {
        // Use scores to estimate clarity
        const realityScore = scores.reality_index / 10;
        const trustScore = scores.trust_protocol === 'PASS' ? 1 : scores.trust_protocol === 'PARTIAL' ? 0.5 : 0;
        return (realityScore + trustScore) / 2;
    }
    /**
     * Fast hash generation (simplified)
     */
    generateFastHash(scores, timestamp) {
        const data = JSON.stringify(scores) + timestamp;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).padStart(64, '0').substring(0, 64);
    }
    /**
     * Simple content hash for caching
     */
    hashContent(content) {
        if (!content) {
            return 'empty';
        }
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    /**
     * Cache management
     */
    cacheResult(hash, scores) {
        // Remove oldest if cache is full
        if (this.cache.size >= this.CACHE_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(hash, {
            scores,
            timestamp: Date.now(),
            contentHash: hash,
        });
    }
    /**
     * Clean expired cache entries
     */
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            hitRate: 0, // Would need hit tracking in production
        };
    }
}
exports.OptimizedFrameworkDetector = OptimizedFrameworkDetector;
