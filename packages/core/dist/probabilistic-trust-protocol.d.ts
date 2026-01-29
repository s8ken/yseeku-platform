/**
 * Probabilistic Trust Protocol
 *
 * Enhances the deterministic trust scoring with probabilistic reasoning,
 * confidence intervals, and uncertainty quantification for enterprise-grade trust evaluation
 */
import { TrustScore, PrincipleScores, TrustPrincipleKey } from './index';
export interface ProbabilisticTrustScore extends TrustScore {
    confidence: {
        level: 'HIGH' | 'MEDIUM' | 'LOW';
        interval: [number, number];
        standardError: number;
        sampleSize: number;
    };
    uncertainty: {
        entropy: number;
        variance: number;
        coefficientOfVariation: number;
    };
    distribution: {
        type: 'normal' | 'beta' | 'dirichlet';
        parameters: Record<string, number>;
    };
    sensitivity: {
        mostSensitivePrinciple: TrustPrincipleKey;
        sensitivityScores: Record<TrustPrincipleKey, number>;
    };
}
export interface UncertaintySource {
    principle: TrustPrincipleKey;
    uncertainty: number;
    source: 'measurement' | 'model' | 'data' | 'temporal';
    impact: number;
}
export interface ConfidenceCalibration {
    observedAccuracy: number;
    calibrationFactor: number;
    sampleSize: number;
    lastCalibrated: number;
}
/**
 * Probabilistic Trust Protocol
 *
 * Adds Bayesian inference and uncertainty quantification to trust scoring
 */
export declare class ProbabilisticTrustProtocol {
    private calibrationHistory;
    private readonly CONFIDENCE_LEVEL;
    private readonly MIN_SAMPLE_SIZE;
    /**
     * Calculate trust score with probabilistic reasoning
     *
     * Uses Bayesian inference to estimate the posterior distribution
     * of trust scores given observed principle scores
     */
    calculateProbabilisticTrustScore(principleScores: PrincipleScores, historicalData?: PrincipleScores[]): ProbabilisticTrustScore;
    /**
     * Calculate deterministic trust score (baseline)
     */
    private calculateDeterministicScore;
    /**
     * Validate principle scores
     */
    private validatePrincipleScores;
    /**
     * Calculate uncertainties for each principle
     */
    private calculateUncertainties;
    /**
     * Perform Bayesian inference on trust score
     */
    private performBayesianInference;
    /**
     * Empirical Bayes inference
     */
    private empiricalBayesInference;
    /**
     * Conjugate prior inference (Beta distribution)
     */
    private conjugatePriorInference;
    /**
     * Calculate confidence interval
     */
    private calculateConfidenceInterval;
    /**
     * Get z-score for confidence level
     */
    private getZScore;
    /**
     * Calculate uncertainty metrics
     */
    private calculateUncertaintyMetrics;
    /**
     * Calculate standard error
     */
    private calculateStandardError;
    /**
     * Perform sensitivity analysis
     */
    private performSensitivityAnalysis;
    /**
     * Determine confidence level
     */
    private determineConfidenceLevel;
    /**
     * Calibrate confidence based on historical accuracy
     */
    calibrateConfidence(sessionId: string, predictedScore: ProbabilisticTrustScore, actualScore: number): void;
    /**
     * Get calibration data
     */
    getCalibration(sessionId: string): ConfidenceCalibration | undefined;
    /**
     * Clear calibration history
     */
    clearCalibration(): void;
}
/**
 * Create probabilistic trust protocol instance
 */
export declare function createProbabilisticTrustProtocol(): ProbabilisticTrustProtocol;
/**
 * Global instance
 */
export declare const probabilisticTrustProtocol: ProbabilisticTrustProtocol;
