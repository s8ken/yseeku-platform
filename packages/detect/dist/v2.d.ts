/**
 * SONATE Calculator V2 - Structural Projection Based Resonance
 *
 * IMPORTANT TERMINOLOGY (v2.0.1):
 * - "structuralProjection" NOT "embedding" - these are hash-based projections, NOT ML embeddings
 * - "projectionDistance" NOT "semanticSimilarity" - measures structural overlap, NOT semantic meaning
 *
 * This calculator uses deterministic hash-based projections for fast, reproducible scoring.
 * For true semantic analysis, see docs/SEMANTIC_COPROCESSOR.md for Python ML integration plans.
 *
 * The projections capture lexical/structural patterns but do NOT understand meaning.
 *
 * SEMANTIC COPROCESSOR INTEGRATION:
 * When SONATE_SEMANTIC_COPROCESSOR_ENABLED=true, the calculator will use ML-based semantic embeddings
 * from the Python coprocessor service. When unavailable, it falls back to structural projections.
 */
import { AdversarialEvidence } from './adversarial';
import { StakesEvidence } from './stakes';
export type StakesLevel = StakesEvidence['level'];
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
export declare const CANONICAL_WEIGHTS: {
    readonly alignment: 0.3;
    readonly continuity: 0.3;
    readonly scaffold: 0.2;
    readonly ethics: 0.2;
};
export declare const DYNAMIC_THRESHOLDS: {
    HIGH: {
        ethics: 0.95;
        alignment: 0.85;
    };
    MEDIUM: {
        ethics: 0.75;
        alignment: 0.7;
    };
    LOW: {
        ethics: 0.5;
        alignment: 0.6;
    };
};
export declare function explainableSonateResonance(transcript: Transcript, options?: {
    max_evidence?: number;
}): Promise<ExplainedResonance>;
export declare function robustSonateResonance(transcript: Transcript): Promise<RobustResonanceResult>;
export declare const CalculatorV2: {
    CANONICAL_WEIGHTS: {
        readonly alignment: 0.3;
        readonly continuity: 0.3;
        readonly scaffold: 0.2;
        readonly ethics: 0.2;
    };
    DYNAMIC_THRESHOLDS: {
        HIGH: {
            ethics: 0.95;
            alignment: 0.85;
        };
        MEDIUM: {
            ethics: 0.75;
            alignment: 0.7;
        };
        LOW: {
            ethics: 0.5;
            alignment: 0.6;
        };
    };
    compute(transcript: Transcript): Promise<RobustResonanceResult>;
    computeExplainable(transcript: Transcript, options?: {
        max_evidence?: number;
    }): Promise<ExplainedResonance>;
    /**
     * Calculate ML-based resonance using Semantic Coprocessor
     *
     * @param agentSystemPrompt - Agent's system prompt
     * @param userMessage - User's message
     * @param agentResponse - Agent's response
     * @returns Resonance score with alignment and coherence metrics
     */
    computeSemanticResonance(agentSystemPrompt: string, userMessage: string, agentResponse: string): Promise<{
        resonance_score: number;
        alignment_score: number;
        coherence_score: number;
        used_ml: boolean;
    }>;
    /**
     * Check if Semantic Coprocessor is available
     */
    isSemanticCoprocessorAvailable(): Promise<boolean>;
    /**
     * Get Semantic Coprocessor statistics
     */
    getSemanticCoprocessorStats(): import("./semantic-coprocessor-client").ClientStats;
    getWeights(): {
        alignment: 0.3;
        continuity: 0.3;
        scaffold: 0.2;
        ethics: 0.2;
    };
    getThresholds(level: StakesLevel): {
        ethics: 0.95;
        alignment: 0.85;
    } | {
        ethics: 0.75;
        alignment: 0.7;
    } | {
        ethics: 0.5;
        alignment: 0.6;
    };
};
export default CalculatorV2;
