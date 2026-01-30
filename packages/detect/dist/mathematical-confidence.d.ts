/**
 * Enterprise-grade Mathematical Confidence Calculator
 * Implements rigorous statistical validation for AI detection scores
 */
export interface ConfidenceResult {
    confidence: number;
    uncertainty: number;
    components: {
        bootstrap: number;
        threshold: number;
        model: number;
        sample: number;
        temporal: number;
        adversarial: number;
    };
    confidenceInterval: [number, number];
    requiresReview: boolean;
    reviewReasons: string[];
    stabilityScore: number;
}
export interface ConfidenceMetrics {
    calibrationScore: number;
    coverageRate: number;
    averageUncertainty: number;
    predictionError: number;
}
export declare class MathematicalConfidenceCalculator {
    private bootstrapSamples;
    private confidenceLevel;
    private reviewThreshold;
    private historicalData;
    constructor(options?: {
        bootstrapSamples?: number;
        confidenceLevel?: number;
        reviewThreshold?: number;
    });
    /**
     * Calculate comprehensive confidence metrics for a detection result
     */
    calculateUncertainty(pointEstimate: number, bootstrapEstimates: number[], thresholdDistance: number, dimensionCollinearity: number, sampleSize: number, historicalScores: number[], adversarialRisk: number): ConfidenceResult;
    /**
     * Update historical context for a session
     */
    updateHistoricalContext(sessionId: string, score: number, uncertainty: number, thresholdDistance: number): void;
    /**
     * Get calibration metrics for a session
     */
    getCalibrationMetrics(sessionId: string): ConfidenceMetrics;
    private calculateBootstrapCI;
    private calculateThresholdUncertainty;
    private calculateSampleUncertainty;
    private calculateTemporalUncertainty;
    private calculateStabilityScore;
    private calculateCalibrationScore;
    private calculateCoverageRate;
    private calculatePredictionError;
    private estimateUncertainty;
}
