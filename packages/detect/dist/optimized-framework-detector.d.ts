/**
 * Optimized Framework Detector - Sub-50ms Performance Target
 *
 * High-performance implementation of the SONATE Framework detection
 * Optimized for production use with <50ms latency requirement
 *
 * v2.0.1 CHANGES:
 * - Removed reality_index and canvas_parity from scoring (calculators removed)
 * - Updated to use only 3 validated dimensions
 * - Deprecated methods return default values for backward compatibility
 */
import { AIInteraction, DetectionResult } from './index';
export declare class OptimizedFrameworkDetector {
    private cache;
    private readonly CACHE_TTL;
    private readonly CACHE_SIZE;
    /**
     * Optimized detection with sub-50ms target
     * v2.0.1: Returns only 3 validated dimensions
     */
    detect(interaction: AIInteraction): Promise<DetectionResult>;
    /**
     * Optimized dimension calculation with performance shortcuts
     * v2.0.1: Only calculates 3 validated dimensions
     */
    private calculateDimensionsOptimized;
    /**
     * Fast trust protocol validation
     */
    private calculateTrustProtocolFast;
    /**
     * Fast ethical alignment scoring
     */
    private calculateEthicalAlignmentFast;
    /**
     * Fast resonance quality measurement (no external API calls)
     */
    private calculateResonanceQualityFast;
    /**
     * Build final result with optimized receipt generation
     * v2.0.1: Only includes 3 validated dimensions
     */
    private buildResult;
    /**
     * Fast clarity calculation
     * v2.0.1: Updated to use only validated dimensions
     */
    private calculateClarityFast;
    /**
     * Fast hash generation (simplified)
     */
    private generateFastHash;
    /**
     * Simple content hash for caching
     */
    private hashContent;
    /**
     * Cache management
     */
    private cacheResult;
    /**
     * Clean expired cache entries
     */
    cleanCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        hitRate: number;
    };
}
