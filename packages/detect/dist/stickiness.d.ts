import { ExplainedResonance, Transcript } from './calculator';
export interface SessionState {
    last_rm: number;
    last_scaffold_hash: string;
    decay_turns: number;
    updated: number;
}
export interface StickyResonance {
    r_m: number;
    stakes: ExplainedResonance['stakes'];
    adversarial: ExplainedResonance['adversarial'];
    breakdown: ExplainedResonance['breakdown'];
    top_evidence: ExplainedResonance['top_evidence'];
    audit_trail: string[];
    stickiness_weight?: number;
    decayed_from?: number;
    session_state?: SessionState;
}
export declare function resonanceWithStickiness(transcript: Transcript, session_state?: SessionState): Promise<StickyResonance>;
//# sourceMappingURL=stickiness.d.ts.map