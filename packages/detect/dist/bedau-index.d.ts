/**
 * Bedau Index Implementation for Weak Emergence Detection
 *
 * Based on Mark Bedau's work on weak emergence:
 * "Weak emergence: the characteristic features of complex systems"
 *
 * The Bedau Index measures weak emergence by comparing:
 * - Semantic intent vs. surface-level mirroring
 * - Micro-level interactions vs. macro-level patterns
 * - Irreducibility of system behavior
 */
export interface BedauMetrics {
    bedau_index: number;
    emergence_type: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
    kolmogorov_complexity: number;
    semantic_entropy: number;
    confidence_interval: [number, number];
    effect_size: number;
    strong_emergence_indicators?: StrongEmergenceIndicators;
}
/**
 * Strong Emergence Indicators (Experimental)
 *
 * Strong emergence is characterized by unpredictable collective behavior
 * that cannot be reduced to component interactions, even with complete
 * knowledge of the system. This is distinct from weak emergence measured
 * by the Bedau Index.
 *
 * IMPORTANT: The Bedau Index measures WEAK emergence only. Strong emergence
 * detection is experimental and requires additional validation beyond
 * the Bedau Index methodology.
 */
export interface StrongEmergenceIndicators {
    irreducibility_proof: boolean;
    downward_causation: boolean;
    novel_causal_powers: boolean;
    unpredictability_verified: boolean;
    collective_behavior_score: number;
}
export interface SemanticIntent {
    intent_vectors: number[];
    reasoning_depth: number;
    abstraction_level: number;
    cross_domain_connections: number;
}
export interface SurfacePattern {
    surface_vectors: number[];
    pattern_complexity: number;
    repetition_score: number;
    novelty_score: number;
}
export interface EmergenceSignal {
    timestamp: number;
    amplitude: number;
    frequency: number;
    phase: number;
    data: number[];
}
export interface EmergenceTrajectory {
    startTime: number;
    endTime: number;
    trajectory: number[];
    emergenceLevel: number;
    confidence: number;
    critical_transitions: number[];
}
export interface BedauIndexCalculator {
    calculateBedauIndex(semanticIntent: SemanticIntent, surfacePattern: SurfacePattern): BedauMetrics;
    analyzeTemporalEvolution(timeSeriesData: number[][]): EmergenceTrajectory;
    bootstrapConfidenceInterval(data: number[], nBootstrap: number): [number, number];
}
/**
 * Factory function to create Bedau Index Calculator
 */
export declare function createBedauIndexCalculator(): BedauIndexCalculator;
/**
 * Convenience function for direct calculation
 */
export declare function calculateBedauIndex(semanticIntent: SemanticIntent, surfacePattern: SurfacePattern): Promise<BedauMetrics>;
