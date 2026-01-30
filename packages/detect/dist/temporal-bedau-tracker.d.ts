/**
 * Production Temporal Bedau Tracker
 *
 * Complete implementation for tracking emergence patterns over time
 * Replaces mock implementation with production-grade algorithms
 */
import { BedauMetrics, EmergenceTrajectory } from './bedau-index';
export interface TemporalBedauRecord {
    timestamp: number;
    bedau_metrics: BedauMetrics;
    emergence_signature: EmergenceSignature;
    context_data: Record<string, any>;
    semantic_intent?: SemanticIntent;
    surface_pattern?: SurfacePattern;
    session_id?: string;
    context_tags?: string[];
}
export interface SemanticIntent {
    embedding: number[];
    intent_class: string;
    confidence: number;
}
export interface SurfacePattern {
    embedding: number[];
    pattern_class: string;
    confidence: number;
}
export interface EmergencePattern {
    type: 'LINEAR' | 'EXPONENTIAL' | 'OSCILLATORY' | 'CHAOTIC';
    confidence: number;
    characteristics: {
        slope?: number;
        correlation?: number;
        periodicity?: number;
        entropy?: number;
        lyapunov_exponent?: number;
        [key: string]: any;
    };
}
export interface PhaseTransition {
    timestamp: number;
    type: 'LOW_TO_HIGH' | 'HIGH_TO_LOW' | 'OSCILLATION' | 'STABILIZATION';
    confidence: number;
    context: Record<string, any>;
}
export interface EmergenceSignature {
    complexity: number;
    novelty: number;
    coherence: number;
    stability: number;
    timestamp: number;
    complexity_profile?: number[];
    entropy_profile?: number[];
    fingerprint?: number[];
    divergence_profile?: number[];
    stability_score?: number;
    novelty_score?: number;
}
/**
 * Production-grade Temporal Bedau Tracker
 * Implements sophisticated temporal analysis of emergence patterns
 */
export declare class TemporalBedauTracker {
    private records;
    private patterns;
    private readonly MAX_RECORDS;
    private readonly MIN_SAMPLES_FOR_PATTERN;
    private readonly PATTERN_LEARNING_RATE;
    constructor();
    /**
     * Add a new Bedau record to the temporal tracker
     */
    addRecord(record: TemporalBedauRecord): void;
    /**
     * Validate a Bedau record before adding it
     */
    private validateRecord;
    /**
     * Validate emergence signature
     */
    private validateEmergenceSignature;
    /**
     * Get emergence trajectory with enhanced temporal analysis
     */
    getEmergenceTrajectory(startTime?: number, endTime?: number): EmergenceTrajectory & {
        pattern_signature: EmergenceSignature;
        predicted_trajectory: number[];
        confidence_in_prediction: number;
        detectedPatterns: EmergencePattern[];
        phase_transitions: PhaseTransition[];
    };
    /**
     * Filter records by time range
     */
    private filterRecordsByTime;
    /**
     * Analyze long-term emergence trends
     */
    analyzeEmergenceTrends(timeWindow: number): {
        trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'OSCILLATING';
        velocity: number;
        acceleration: number;
        pattern_signature: EmergenceSignature;
        trend_confidence: number;
    };
    /**
     * Update patterns using machine learning
     */
    private updatePatterns;
    /**
     * Refine existing pattern using recent data
     */
    private refinePattern;
    /**
     * Discover new patterns in data
     */
    private discoverNewPatterns;
    /**
     * Calculate trajectory from bedau history
     */
    private calculateTrajectory;
    /**
     * Calculate emergence signature from records
     */
    private calculateEmergenceSignature;
    /**
     * Predict future trajectory using ARIMA-like approach
     */
    private predictTrajectory;
    /**
     * Detect emergence patterns in records
     */
    private detectEmergencePatterns;
    /**
     * Detect phase transitions in emergence
     */
    private detectPhaseTransitions;
    /**
     * Calculate trend from records
     */
    private calculateTrend;
    /**
     * Calculate velocity (rate of change)
     */
    private calculateVelocity;
    /**
     * Calculate acceleration
     */
    private calculateAcceleration;
    private calculateLinearSlope;
    private calculateCorrelation;
    private calculateEntropy;
    private calculatePeriodicity;
    private calculateLyapunovExponent;
    private calculateLinearTrend;
    private detectSeasonality;
    private calculateTrajectoryConfidence;
    private calculatePredictionConfidence;
    private calculateTrendConfidence;
    private detectCriticalTransitions;
    private isOscillatory;
    private isChaotic;
    private isExponential;
    private initializeDefaultPatterns;
    /**
     * Get all records for a session
     */
    getSessionRecords(sessionId: string): TemporalBedauRecord[];
    /**
     * Get records within time range
     */
    getRecordsInRange(startTime: number, endTime: number): TemporalBedauRecord[];
    /**
     * Get tracker statistics
     */
    getStatistics(): {
        totalRecords: number;
        patternCount: number;
        timeRange: {
            start: number;
            end: number;
        };
        averageBedauIndex: number;
    };
    /**
     * Clear all records
     */
    clear(): void;
}
export declare function createTemporalBedauTracker(): TemporalBedauTracker;
