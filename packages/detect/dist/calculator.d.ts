export interface Transcript {
    text: string;
    turns?: {
        role: string;
        content: string;
    }[];
}
export interface ExplainedResonance {
    r_m: number;
    stakes: {
        level: string;
        score: number;
    };
    adversarial: {
        detected: boolean;
        score: number;
    };
    breakdown: Record<string, number>;
    top_evidence: string[];
    audit_trail: string[];
}
/**
 * Explainable resonance function with detailed evidence
 * Delegates fully to CalculatorV2 — STUBBED until @sonate/calculator is ready
 */
export declare function explainableSonateResonance(_transcript: Transcript, _options?: {
    max_evidence?: number;
}): Promise<ExplainedResonance>;
export declare const DYNAMIC_THRESHOLDS: Record<string, number>;
export declare const CANONICAL_WEIGHTS: Record<string, number>;
