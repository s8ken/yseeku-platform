import { AssessmentInput, AssessmentResult } from './sonate-types';
/**
 * BalancedSonateDetector
 * Applies conservative weighting and penalty smoothing to reduce false positives
 */
export declare class BalancedSonateDetector {
    private base;
    constructor();
    analyzeContent(input: AssessmentInput): Promise<AssessmentResult>;
    private applyBalancedTransform;
    private smoothReality;
    private conservativeTrust;
    private smoothEthics;
    private capResonance;
    private normalizeCanvas;
    private weightedOverall;
    private rewriteInsights;
}
