export declare class AdaptiveThresholdManager {
    getAdaptiveThresholds(stakes: string, text: string): Promise<any>;
    applyThresholds(score: number, thresholds: any, stakes: string): any;
}
export interface ThresholdState {
    threshold: number;
    confidence: number;
    adjustmentFactor?: number;
}
export declare class BayesianOnlineChangePointDetector {
    getAdaptiveThreshold(): number;
}
export declare class CUSUMDetector {
    getAdaptiveThreshold(): number;
}
//# sourceMappingURL=adaptive-thresholds.d.ts.map