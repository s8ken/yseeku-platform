/**
 * Cross-Modality Coherence Validation
 *
 * Validates coherence across different cognitive modalities:
 * - Linguistic reasoning
 * - Logical deduction
 * - Creative synthesis
 * - Ethical judgment
 * - Procedural execution
 */
export interface ModalityMetrics {
    linguistic: {
        coherence: number;
        complexity: number;
        consistency: number;
    };
    reasoning: {
        logical_validity: number;
        inference_quality: number;
        argument_structure: number;
    };
    creative: {
        originality: number;
        synthesis_quality: number;
        aesthetic_coherence: number;
    };
    ethical: {
        value_alignment: number;
        consistency: number;
        reasoning_quality: number;
    };
    procedural: {
        execution_accuracy: number;
        efficiency: number;
        robustness: number;
    };
}
export interface CoherenceAnalysis {
    overall_coherence: number;
    modality_weights: {
        [key: string]: number;
    };
    coherence_matrix: number[][];
    integration_score: number;
    conflict_indicators: string[];
    synergy_indicators: string[];
}
export interface CoherenceValidation {
    is_valid: boolean;
    confidence: number;
    issues: string[];
    recommendations: string[];
    threshold_analysis: {
        min_threshold: number;
        actual_value: number;
        passed: boolean;
    };
}
/**
 * Cross-Modality Coherence Validator
 *
 * Analyzes and validates coherence across different AI cognitive modalities
 */
export declare class CrossModalityCoherenceValidator {
    private readonly DEFAULT_THRESHOLD;
    private readonly CRITICAL_THRESHOLD;
    /**
     * Analyze cross-modality coherence
     */
    analyzeCoherence(modalityMetrics: ModalityMetrics): CoherenceAnalysis;
    /**
     * Validate coherence against thresholds
     */
    validateCoherence(analysis: CoherenceAnalysis, threshold?: number): CoherenceValidation;
    /**
     * Detect coherence patterns over time
     */
    detectCoherencePatterns(historicalAnalyses: CoherenceAnalysis[], windowSize?: number): {
        trend_direction: 'improving' | 'declining' | 'stable';
        stability_score: number;
        cyclical_patterns: number[];
        anomaly_indicators: number[];
    };
    private calculateModalityScores;
    private calculateLinguisticScore;
    private calculateReasoningScore;
    private calculateCreativeScore;
    private calculateEthicalScore;
    private calculateProceduralScore;
    private calculateCoherenceMatrix;
    private calculatePairwiseCoherence;
    private getModalityScore;
    private calculateOverallCoherence;
    private calculateModalityWeights;
    private calculateIntegrationScore;
    private identifyConflicts;
    private identifySynergies;
    private identifyCoherenceIssues;
    private generateRecommendations;
    private calculateValidationConfidence;
    private calculateTrend;
    private calculateStability;
    private detectCyclicalPatterns;
    private detectAnomalies;
    private calculateAutocorrelation;
}
/**
 * Factory function for creating cross-modality coherence validators
 */
export declare function createCrossModalityCoherenceValidator(): CrossModalityCoherenceValidator;
/**
 * Quick coherence analysis function
 */
export declare function analyzeCrossModalityCoherence(modalityMetrics: ModalityMetrics): CoherenceAnalysis;
/**
 * Quick coherence validation function
 */
export declare function validateCrossModalityCoherence(modalityMetrics: ModalityMetrics, threshold?: number): CoherenceValidation;
