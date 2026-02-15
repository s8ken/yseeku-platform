import { AdversarialEvidence, StakesEvidence } from '@sonate/core';
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
