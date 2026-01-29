/**
 * Trust Metrics for SONATE Platform
 */
import { TrustObservabilityData } from '../types';
/**
 * Trust metrics collector
 */
export declare class TrustMetrics {
    private meter;
    private trustScoreHistogram;
    private trustViolationsCounter;
    private principleScoreHistogram;
    private evaluationDurationHistogram;
    /**
     * Record trust score evaluation
     */
    recordTrustEvaluation(data: TrustObservabilityData, duration: number): void;
    /**
     * Get the meter for custom trust metrics
     */
    getMeter(): import("@opentelemetry/api").Meter;
}
