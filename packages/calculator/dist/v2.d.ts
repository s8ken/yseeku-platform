/**
 * Calculator V2 - Canonical Implementation
 *
 * This is the single source of truth for all calculator logic.
 * All other calculator implementations have been deprecated.
 *
 * Key Improvements from V1:
 * - Integration with Anthropic Claude for REAL semantic analysis (Enterprise Grade)
 * - Fallback to deterministic heuristics if API is unavailable
 * - Fixed division by zero in continuity calculation
 * - Score clamping to ensure 0-1 range
 * - Corrected adversarial penalty (0.5 multiplier)
 * - Added missing LOW stakes penalties
 * - Explicit threshold penalties for all stakes levels
 * - Proper error handling and fallback logic
 */
import { AdversarialEvidence, StakesEvidence } from '@sonate/core';
type StakesLevel = StakesEvidence['level'];
export interface EvidenceChunk {
    type: 'alignment' | 'scaffold' | 'ethics' | 'continuity' | 'adversarial';
    text: string;
    score_contrib: number;
    position?: {
        start: number;
        end: number;
    };
}
export interface DimensionEvidence {
    score: number;
    weight: number;
    contrib: number;
    evidence: string[];
}
export interface ExplainedResonance {
    r_m: number;
    stakes: StakesEvidence;
    adversarial: AdversarialEvidence;
    breakdown: {
        s_alignment: DimensionEvidence;
        s_continuity: DimensionEvidence;
        s_scaffold: DimensionEvidence;
        e_ethics: DimensionEvidence;
    };
    top_evidence: EvidenceChunk[];
    audit_trail: string[];
}
export interface Transcript {
    text: string;
    metadata?: Record<string, unknown>;
}
export interface RobustResonanceResult {
    r_m: number;
    adversarial_penalty: number;
    is_adversarial: boolean;
    evidence: AdversarialEvidence;
    stakes?: StakesEvidence;
    thresholds_used?: {
        ethics: number;
        alignment: number;
    };
    drift_detected?: boolean;
    iap_payload?: string;
    bedau_index?: number;
    identity_coherence?: number;
    breakdown: {
        s_alignment: number;
        s_continuity: number;
        s_scaffold: number;
        e_ethics: number;
        confidence_score?: number;
        uncertainty_components?: {
            fallback_mode: boolean;
            error_reason?: string;
        };
        ethical_verification?: {
            passed: boolean;
            reason: string;
        };
        mi_adjusted_weights?: Record<string, number>;
        adaptive_thresholds?: {
            ethics: number;
            alignment: number;
        };
    };
}
/**
 * CANONICAL WEIGHTS - Single source of truth
 * These weights are used across all calculator operations
 */
export declare const CANONICAL_WEIGHTS: {
    readonly alignment: 0.3;
    readonly continuity: 0.3;
    readonly scaffold: 0.2;
    readonly ethics: 0.2;
};
/**
 * Dynamic thresholds based on stakes level
 */
export declare const DYNAMIC_THRESHOLDS: Record<StakesLevel, {
    ethics: number;
    alignment: number;
}>;
/**
 * Explainable resonance function with detailed evidence
 */
export declare function explainableSonateResonance(transcript: Transcript, options?: {
    max_evidence?: number;
}): Promise<ExplainedResonance>;
/**
 * Enhanced main function with all mathematical improvements
 */
export declare function robustSonateResonance(transcript: Transcript): Promise<RobustResonanceResult>;
/**
 * CalculatorV2 - Main exported interface
 * This is the single source of truth for calculator operations
 */
export declare const CalculatorV2: {
    CANONICAL_WEIGHTS: {
        readonly alignment: 0.3;
        readonly continuity: 0.3;
        readonly scaffold: 0.2;
        readonly ethics: 0.2;
    };
    DYNAMIC_THRESHOLDS: Record<"HIGH" | "MEDIUM" | "LOW", {
        ethics: number;
        alignment: number;
    }>;
    /**
     * Compute resonance score for a transcript
     */
    compute(transcript: Transcript): Promise<RobustResonanceResult>;
    /**
     * Compute explainable resonance with detailed evidence
     */
    computeExplainable(transcript: Transcript, options?: {
        max_evidence?: number;
    }): Promise<ExplainedResonance>;
    /**
     * Get canonical weights
     */
    getWeights(): {
        alignment: 0.3;
        continuity: 0.3;
        scaffold: 0.2;
        ethics: 0.2;
    };
    /**
     * Get dynamic thresholds for a stakes level
     */
    getThresholds(level: StakesLevel): {
        ethics: number;
        alignment: number;
    };
};
export default CalculatorV2;
