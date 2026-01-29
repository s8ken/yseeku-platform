import { AssessmentInput, AssessmentResult } from './sonate-types';
/**
 * CalibratedSonateDetector
 * Applies data-driven calibration factors derived from text metrics
 */
export declare class CalibratedSonateDetector {
    private base;
    constructor();
    analyzeContent(input: AssessmentInput): Promise<AssessmentResult>;
    private applyCalibration;
    private recalculateOverall;
}
//# sourceMappingURL=calibrated-detector.d.ts.map