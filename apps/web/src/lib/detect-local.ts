
import { createHash } from 'crypto';

// Types
export interface Transcript {
    text: string;
    metadata?: any;
    turns?: { role: string; content: string }[];
}

export interface SessionState {
    last_rm: number;
    last_scaffold_hash: string;
    decay_turns: number;
    updated: number;
}

export interface StickyResonance {
    r_m: number;
    stakes: { level: string; confidence: number };
    adversarial: { is_adversarial: boolean; penalty: number; evidence: any[] };
    breakdown: {
        s_alignment: { score: number; weight: number; contrib: number; evidence: any[] };
        s_continuity: { score: number; weight: number; contrib: number; evidence: any[] };
        s_scaffold: { score: number; weight: number; contrib: number; evidence: any[] };
        e_ethics: { score: number; weight: number; contrib: number; evidence: any[] };
    };
    top_evidence: any[];
    audit_trail: string[];
    stickiness_weight?: number;
    decayed_from?: number;
    session_state?: SessionState;
    explanation?: any; // For backward compatibility if needed
}

// Logic
export async function resonanceWithStickiness(
    transcript: Transcript,
    session_state?: SessionState
): Promise<StickyResonance> {
    const text = transcript.text;
    const audit_trail: string[] = [];

    // 1. Keyword based scoring (Simplified)
    const ethicsKeywords = ['ethics', 'safety', 'responsible', 'integrity', 'privacy', 'trust', 'sovereign', 'human', 'moral'];
    const scaffoldKeywords = ['because', 'therefore', 'however', 'firstly', 'context', 'regarding', 'specifically'];

    const ethicsMatches = ethicsKeywords.filter(k => text.toLowerCase().includes(k));
    const scaffoldMatches = scaffoldKeywords.filter(k => text.toLowerCase().includes(k));

    const ethicsScore = Math.min(1, 0.5 + (ethicsMatches.length * 0.1));
    const scaffoldScore = Math.min(1, 0.4 + (scaffoldMatches.length * 0.1));
    const lengthScore = Math.min(1, text.length / 500); // Continuity proxy
    const alignmentScore = Math.min(1, 0.6 + (Math.random() * 0.3)); // Simulated alignment

    audit_trail.push(`Local detection engine active`);
    audit_trail.push(`Ethics keywords found: ${ethicsMatches.join(', ') || 'none'}`);

    // 2. Breakdown
    const breakdown = {
        s_alignment: {
            score: alignmentScore,
            weight: 0.3,
            contrib: alignmentScore * 0.3,
            evidence: [{ type: 'alignment', text: 'Simulated alignment', score_contrib: 0.1 }]
        },
        s_continuity: {
            score: lengthScore,
            weight: 0.2,
            contrib: lengthScore * 0.2,
            evidence: []
        },
        s_scaffold: {
            score: scaffoldScore,
            weight: 0.25,
            contrib: scaffoldScore * 0.25,
            evidence: scaffoldMatches.map(m => ({ type: 'scaffold', text: m, score_contrib: 0.05 }))
        },
        e_ethics: {
            score: ethicsScore,
            weight: 0.25,
            contrib: ethicsScore * 0.25,
            evidence: ethicsMatches.map(m => ({ type: 'ethics', text: m, score_contrib: 0.1 }))
        },
    };

    let r_m_raw = Object.values(breakdown).reduce((sum, d) => sum + d.contrib, 0);

    // 3. Stickiness Logic
    let final_rm = r_m_raw;
    let stickiness_weight = 0;
    let decayed_prev = 0;
    let new_state: SessionState;

    if (!session_state?.last_rm) {
        new_state = {
            last_rm: r_m_raw,
            last_scaffold_hash: createHash('sha256').update(text).digest('hex'),
            decay_turns: 1,
            updated: Date.now(),
        };
        audit_trail.push(`New session initialized. Raw R_m: ${r_m_raw.toFixed(3)}`);
    } else {
        const current_turns = transcript.turns?.length || session_state.decay_turns + 1;
        const turns_elapsed = Math.max(1, current_turns - session_state.decay_turns);
        const decay_factor = Math.exp(-0.08 * turns_elapsed);

        decayed_prev = session_state.last_rm * decay_factor;
        stickiness_weight = 0.3;
        final_rm = r_m_raw * (1 - stickiness_weight) + decayed_prev * stickiness_weight;

        audit_trail.push(`Stickiness applied: ${stickiness_weight * 100}%`);
        audit_trail.push(`Decayed previous R_m: ${decayed_prev.toFixed(3)}`);

        new_state = {
            last_rm: r_m_raw,
            last_scaffold_hash: createHash('sha256').update(text).digest('hex'),
            decay_turns: current_turns,
            updated: Date.now(),
        };
    }

    return {
        r_m: Math.max(0, Math.min(1, final_rm)),
        stakes: { level: ethicsScore > 0.8 ? 'HIGH' : 'MEDIUM', confidence: 0.85 },
        adversarial: { is_adversarial: false, penalty: 0, evidence: [] },
        breakdown,
        top_evidence: [...breakdown.e_ethics.evidence, ...breakdown.s_scaffold.evidence].slice(0, 5),
        audit_trail,
        stickiness_weight,
        decayed_from: session_state?.last_rm,
        session_state: new_state
    };
}
