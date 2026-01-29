/**
 * Optimized Framework Detector - Sub-50ms Performance Target
 *
 * High-performance implementation of the 5-dimension SONATE Framework detection
 * Optimized for production use with <50ms latency requirement
 */
import { AIInteraction, DetectionResult } from './index';
export declare class OptimizedFrameworkDetector {
    private cache;
    private readonly CACHE_TTL;
    private readonly CACHE_SIZE;
    /**
     * Optimized detection with sub-50ms target
     */
    detect(interaction: AIInteraction): Promise<DetectionResult>;
    /**
     * Optimized dimension calculation with performance shortcuts
     */
    private calculateDimensionsOptimized;
    /**
     * Fast reality index calculation (inline, no external calls)
     */
    private calculateRealityIndexFast;
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
     * Fast canvas parity calculation
     */
    private calculateCanvasParityFast;
    /**
     * Build final result with optimized receipt generation
     */
    private buildResult;
    /**
     * Fast clarity calculation
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
//# sourceMappingURL=optimized-framework-detector.d.ts.map