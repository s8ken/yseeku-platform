/**
 * BalancedSonateDetector
 * Applies conservative weighting and penalty smoothing to reduce false positives
 *
 * v2.0.1 CHANGES:
 * - Removed RealityIndex and CanvasParity from scoring (calculators removed)
 * - Updated weightedOverall to use only 3 validated dimensions
 * - Deprecated methods kept for backward compatibility but return defaults
 */
import { AssessmentInput, AssessmentResult } from './sonate-types';
export declare class BalancedSonateDetector {
    private base;
    constructor();
    analyzeContent(input: AssessmentInput): Promise<AssessmentResult>;
    private applyBalancedTransform;
    /** @deprecated v2.0.1 - RealityIndex calculator was removed */
    private smoothReality;
    private conservativeTrust;
    private smoothEthics;
    private capResonance;
    /** @deprecated v2.0.1 - CanvasParity calculator was removed */
    private normalizeCanvas;
    /**
     * v2.0.1: Updated to use only 3 validated dimensions
     * - Trust Protocol: 40% weight
     * - Ethical Alignment: 35% weight
     * - Resonance Quality: 25% weight
     */
    private weightedOverall;
    private rewriteInsights;
}
