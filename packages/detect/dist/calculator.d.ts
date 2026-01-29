import { AdversarialEvidence } from './adversarial';
import { StakesLevel, StakesEvidence } from './stakes';
import { ExplainedResonance, EvidenceChunk, DimensionEvidence } from './explainable';
export { ExplainedResonance, EvidenceChunk, DimensionEvidence };
export interface Transcript {
    text: string;
    metadata?: any;
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
    breakdown: {
        s_alignment: number;
        s_continuity: number;
        s_scaffold: number;
        e_ethics: number;
    };
}
export declare const DYNAMIC_THRESHOLDS: Record<StakesLevel, {
    ethics: number;
    alignment: number;
}>;
export declare function explainableSonateResonance(transcript: Transcript, options?: {
    max_evidence?: number;
}): Promise<ExplainedResonance>;
export declare function robustSonateResonance(transcript: Transcript): Promise<RobustResonanceResult>;
//# sourceMappingURL=calculator.d.ts.map