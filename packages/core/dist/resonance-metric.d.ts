/**
 * Resonance Metric (R_m) Implementation
 * Quantifies alignment between user intent and AI response
 *
 * Formula: R_m = ((V_align × w1) + (C_hist × w2) + (S_match × w3)) / (1 + δ_entropy)
 *
 * Where:
 * - V_align: Vector alignment between user input and AI response
 * - C_hist: Contextual continuity with conversation history
 * - S_match: Semantic mirroring of user intent
 * - δ_entropy: Entropy delta (novelty/creativity measure)
 * - w1, w2, w3: Weights (default: 0.5, 0.3, 0.2)
 */
export interface ResonanceComponents {
    vectorAlignment: number;
    contextualContinuity: number;
    semanticMirroring: number;
    entropyDelta: number;
}
export interface ResonanceMetrics extends ResonanceComponents {
    R_m: number;
    alertLevel: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
    interpretation: string;
}
export interface ResonanceWeights {
    vectorAlignment: number;
    contextualContinuity: number;
    semanticMirroring: number;
}
export interface InteractionContext {
    userInput: string;
    aiResponse: string;
    conversationHistory?: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
    }>;
    metadata?: Record<string, any>;
}
/**
 * Default weights for resonance calculation
 * Optimized based on SONATE framework research
 */
export declare const DEFAULT_RESONANCE_WEIGHTS: ResonanceWeights;
/**
 * Alert thresholds for resonance monitoring
 */
export declare const RESONANCE_THRESHOLDS: {
    GREEN: number;
    YELLOW: number;
    RED: number;
    CRITICAL: number;
};
/**
 * Calculate vector alignment between user input and AI response
 * Uses simplified cosine similarity based on word overlap and semantic density
 */
export declare function calculateVectorAlignment(userInput: string, aiResponse: string): number;
/**
 * Calculate contextual continuity with conversation history
 * Measures coherence with previous interactions
 */
export declare function calculateContextualContinuity(aiResponse: string, conversationHistory?: InteractionContext['conversationHistory']): number;
/**
 * Calculate semantic mirroring of user intent
 * Measures how well the response reflects user's underlying intent
 */
export declare function calculateSemanticMirroring(userInput: string, aiResponse: string): number;
/**
 * Calculate entropy delta (novelty/creativity measure)
 * Higher entropy = more novel/creative response
 */
export declare function calculateEntropyDelta(aiResponse: string): number;
/**
 * Calculate complete resonance metrics
 */
export declare function calculateResonanceMetrics(context: InteractionContext, weights?: ResonanceWeights): ResonanceMetrics;
/**
 * Convenience function for quick resonance calculation
 */
export declare function calculateResonance(userInput: string, aiResponse: string, conversationHistory?: InteractionContext['conversationHistory']): number;
