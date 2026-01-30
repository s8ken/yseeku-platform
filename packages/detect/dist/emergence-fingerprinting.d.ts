/**
 * Emergence Signature Fingerprinting System
 *
 * Creates unique fingerprints for emergence patterns using:
 * - Multi-dimensional profiling
 * - Cross-domain pattern analysis
 * - Irreducibility measurement
 * - Cognitive diversity assessment
 */
import { EmergenceSignature } from './temporal-bedau-tracker';
export interface EmergenceFingerprint {
    id: string;
    signature: EmergenceSignature;
    metadata: {
        created_at: number;
        session_count: number;
        total_interactions: number;
        emergence_type_frequency: Record<string, number>;
        avg_bedau_index: number;
        complexity_class: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
        entropy_class: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    };
    classification: {
        emergence_category: EmergenceCategory;
        confidence_score: number;
        similar_patterns: string[];
        novelty_ranking: number;
    };
}
export interface EmergenceCategory {
    id: string;
    name: string;
    description: string;
    characteristics: {
        complexity_range: [number, number];
        entropy_range: [number, number];
        bedau_range: [number, number];
        typical_patterns: string[];
    };
    research_implications: string[];
    governance_considerations: string[];
}
export interface FingerprintComparison {
    similarity_score: number;
    similarity_dimensions: {
        complexity_similarity: number;
        entropy_similarity: number;
        pattern_similarity: number;
        trajectory_similarity: number;
    };
    differences: string[];
    commonPatterns: string[];
}
export interface CrossModalityCoherence {
    modalities: {
        linguistic: number;
        reasoning: number;
        creative: number;
        ethical: number;
        procedural: number;
    };
    coherence_score: number;
    dominant_modality: string;
    modality_balance: number;
    integration_level: 'FRAGMENTED' | 'INTEGRATING' | 'INTEGRATED' | 'SYNTHESIZED';
}
/**
 * Emergence Fingerprinting Engine
 *
 * Creates and analyzes emergence signatures for pattern recognition
 * and research purposes.
 */
export declare class EmergenceFingerprintingEngine {
    private categories;
    private fingerprints;
    private readonly FINGERPRINT_VERSION;
    constructor();
    /**
     * Create emergence fingerprint from signature
     */
    createFingerprint(signature: EmergenceSignature, sessionId: string, contextMetadata: any): EmergenceFingerprint;
    /**
     * Compare two emergence fingerprints
     */
    compareFingerprints(fingerprint1: EmergenceFingerprint, fingerprint2: EmergenceFingerprint): FingerprintComparison;
    /**
     * Analyze cross-modality coherence
     */
    analyzeCrossModalityCoherence(linguisticMetrics: number[], reasoningMetrics: number[], creativeMetrics: number[], ethicalMetrics: number[], proceduralMetrics: number[]): CrossModalityCoherence;
    /**
     * Find similar emergence patterns
     */
    findSimilarPatterns(fingerprint: EmergenceFingerprint, threshold?: number): EmergenceFingerprint[];
    /**
     * Get emergence category classification
     */
    categorizeEmergence(signature: EmergenceSignature): EmergenceCategory[];
    private initializeCategories;
    private generateFingerprintId;
    private hashSignature;
    private extractMetadata;
    private classifyEmergence;
    private classifyValue;
    private calculateVectorSimilarity;
    private identifyDifferences;
    private identifyCommonPatterns;
    private calculateModalityScore;
    private calculateCoherence;
    private calculateBalance;
    private determineIntegrationLevel;
    private calculateNoveltyRanking;
    private findSimilarPatternsBySignature;
}
/**
 * Factory function for creating emergence fingerprinting engines
 */
export declare function createEmergenceFingerprintingEngine(): EmergenceFingerprintingEngine;
/**
 * Quick fingerprint creation function
 */
export declare function createEmergenceFingerprint(signature: EmergenceSignature, sessionId: string, contextMetadata: any): EmergenceFingerprint;
