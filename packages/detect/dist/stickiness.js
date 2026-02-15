"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resonanceWithStickiness = resonanceWithStickiness;
// @sonate/detect/stickiness.ts
const calculator_1 = require("./calculator");
const core_1 = require("@sonate/core");
async function resonanceWithStickiness(transcript, session_state) {
    // Calculate fresh R_m
    const fresh = await (0, calculator_1.explainableSonateResonance)(transcript);
    if (!session_state?.last_rm) {
        return {
            ...fresh,
            stickiness_weight: 0,
            session_state: {
                last_rm: fresh.r_m,
                last_scaffold_hash: (0, core_1.sha256)(transcript.text),
                decay_turns: 1, // Start count
                updated: Date.now(),
            },
        };
    }
    // Estimate turns elapsed. Since transcript might not contain full history in this simplified interface,
    // we rely on state.decay_turns vs current. If transcript has explicit turns count, use that.
    // Assuming transcript is the *full* transcript including history.
    // If not, we increment by 1.
    // Let's assume transcript object has a 'turns' array if passed from API, or we increment by 1.
    const current_turns = transcript.turns?.length || session_state.decay_turns + 1;
    const turns_elapsed = Math.max(1, current_turns - session_state.decay_turns);
    const decay_factor = Math.exp(-0.08 * turns_elapsed); // 8% decay/turn
    const decayed_prev = session_state.last_rm * decay_factor;
    // Blend: 70% fresh + 30% decayed continuity
    const stickiness_weight = 0.3;
    const sticky_rm = fresh.r_m * (1 - stickiness_weight) + decayed_prev * stickiness_weight;
    // Update session state
    const new_state = {
        last_rm: fresh.r_m, // Store FRESH r_m for next decay, not the sticky one?
        // Actually, sticking to sticky helps smooth transitions better.
        // But RFC says "Decay previous resonance".
        // Let's store fresh to avoid compounding bias, or sticky for smoothness.
        // Storing fresh is safer to prevent drift loop.
        last_scaffold_hash: (0, core_1.sha256)(transcript.text),
        decay_turns: current_turns,
        updated: Date.now(),
    };
    // Add stickiness info to audit trail
    const audit = [...fresh.audit_trail];
    audit.push(`Stickiness applied: ${stickiness_weight * 100}% weight`);
    audit.push(`Decayed previous R_m: ${decayed_prev.toFixed(3)} (from ${session_state.last_rm.toFixed(3)})`);
    audit.push(`Final Sticky R_m: ${sticky_rm.toFixed(3)}`);
    return {
        ...fresh,
        r_m: Math.max(0, Math.min(1, sticky_rm)),
        stickiness_weight,
        decayed_from: session_state.last_rm,
        session_state: new_state,
        audit_trail: audit,
    };
}
