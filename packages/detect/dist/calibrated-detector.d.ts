/**
 * CalibratedSonateDetector
 * Applies data-driven calibration factors derived from text metrics
 *
 * v2.0.1 CHANGES:
 * - Removed RealityIndex and CanvasParity from scoring (calculators removed)
 * - Updated recalculateOverall to use only 3 validated dimensions
 */
import { AssessmentInput, AssessmentResult } from './sonate-types';
export declare class CalibratedSonateDetector {
    private base;
    constructor();
    analyzeContent(input: AssessmentInput): Promise<AssessmentResult>;
    private applyCalibration;
    /**
     * v2.0.1: Updated to use only 3 validated dimensions
     * - Trust Protocol: 40% weight
     * - Ethical Alignment: 35% weight
     * - Resonance Quality: 25% weight
     */
    private recalculateOverall;
}
