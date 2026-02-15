import { Transcript, RobustResonanceResult, ExplainedResonance, EvidenceChunk, DimensionEvidence } from '@sonate/calculator';
export { Transcript, RobustResonanceResult, ExplainedResonance, EvidenceChunk, DimensionEvidence };
/**
 * Enhanced main function with all mathematical improvements
 * Delegates fully to CalculatorV2
 */
export declare function robustSonateResonance(transcript: Transcript): Promise<RobustResonanceResult>;
/**
 * Explainable resonance function with detailed evidence
 * Delegates fully to CalculatorV2
 */
export declare function explainableSonateResonance(transcript: Transcript, options?: {
    max_evidence?: number;
}): Promise<ExplainedResonance>;
export declare const DYNAMIC_THRESHOLDS: Record<"HIGH" | "MEDIUM" | "LOW", {
    ethics: number;
    alignment: number;
}>;
export declare const CANONICAL_WEIGHTS: {
    readonly alignment: 0.3;
    readonly continuity: 0.3;
    readonly scaffold: 0.2;
    readonly ethics: 0.2;
};
