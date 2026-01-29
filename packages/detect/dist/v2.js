"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorV2 = exports.DYNAMIC_THRESHOLDS = exports.CANONICAL_WEIGHTS = void 0;
exports.explainableSonateResonance = explainableSonateResonance;
exports.robustSonateResonance = robustSonateResonance;
const adversarial_1 = require("./adversarial");
const constants_1 = require("./constants");
const model_normalize_1 = require("./model-normalize");
const stakes_1 = require("./stakes");
// Import constants - using inline definition to avoid circular dependency issues
// See: https://github.com/s8ken/yseeku-platform/issues/XX for tracking
const RESONANCE_CONSTANTS = {
    WEIGHTS: {
        ALIGNMENT: 0.3,
        CONTINUITY: 0.3,
        SCAFFOLD: 0.2,
        ETHICS: 0.2,
    },
    DYNAMIC_THRESHOLDS: {
        HIGH: {
            ETHICS: 0.95,
            ALIGNMENT: 0.85,
        },
        MEDIUM: {
            ETHICS: 0.75,
            ALIGNMENT: 0.7,
        },
        LOW: {
            ETHICS: 0.5,
            ALIGNMENT: 0.6,
        },
    },
};
exports.CANONICAL_WEIGHTS = {
    alignment: RESONANCE_CONSTANTS.WEIGHTS.ALIGNMENT,
    continuity: RESONANCE_CONSTANTS.WEIGHTS.CONTINUITY,
    scaffold: RESONANCE_CONSTANTS.WEIGHTS.SCAFFOLD,
    ethics: RESONANCE_CONSTANTS.WEIGHTS.ETHICS,
};
exports.DYNAMIC_THRESHOLDS = {
    HIGH: {
        ethics: RESONANCE_CONSTANTS.DYNAMIC_THRESHOLDS.HIGH.ETHICS,
        alignment: RESONANCE_CONSTANTS.DYNAMIC_THRESHOLDS.HIGH.ALIGNMENT,
    },
    MEDIUM: {
        ethics: RESONANCE_CONSTANTS.DYNAMIC_THRESHOLDS.MEDIUM.ETHICS,
        alignment: RESONANCE_CONSTANTS.DYNAMIC_THRESHOLDS.MEDIUM.ALIGNMENT,
    },
    LOW: {
        ethics: RESONANCE_CONSTANTS.DYNAMIC_THRESHOLDS.LOW.ETHICS,
        alignment: RESONANCE_CONSTANTS.DYNAMIC_THRESHOLDS.LOW.ALIGNMENT,
    },
};
function chunkText(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let offset = 0;
    return sentences.map((s) => {
        const start = offset;
        const end = offset + s.length;
        offset = end;
        return { text: s.trim(), start, end };
    });
}
function createEmbedding(text, dims = 384) {
    const vector = new Array(dims).fill(0);
    let seed = 2166136261;
    for (let i = 0; i < text.length; i++) {
        seed ^= text.charCodeAt(i);
        seed = Math.imul(seed, 16777619);
    }
    const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
        let t = seed;
        for (let i = 0; i < token.length; i++) {
            t ^= token.charCodeAt(i);
            t = Math.imul(t, 2246822507);
        }
        const idx = Math.abs(t) % dims;
        vector[idx] += 1;
    }
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map((v) => v / norm);
}
async function embed(text) {
    return createEmbedding(text);
}
function cosineSimilarity(a, b) {
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let an = 0;
    let bn = 0;
    for (let i = 0; i < len; i++) {
        dot += a[i] * b[i];
        an += a[i] * a[i];
        bn += b[i] * b[i];
    }
    const denom = Math.sqrt(an) * Math.sqrt(bn);
    return denom === 0 ? 0 : dot / denom;
}
async function alignmentEvidence(transcript) {
    const chunks = chunkText(transcript.text);
    const chunkEmbeds = await Promise.all(chunks.map(async (c) => ({ ...c, embedding: await embed(c.text) })));
    const similarities = chunkEmbeds.map((c) => ({
        ...c,
        similarity: cosineSimilarity(c.embedding, constants_1.CANONICAL_SCAFFOLD_VECTOR),
    }));
    const top_chunks = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
    const score = top_chunks.length > 0
        ? top_chunks.reduce((sum, c) => sum + c.similarity, 0) / top_chunks.length
        : 0;
    const finalScore = transcript.text.includes('sovereign') || transcript.text.includes('resonance')
        ? Math.max(0.5, score)
        : Math.max(0, score);
    return {
        score: finalScore,
        top_phrases: top_chunks.map((c) => c.text),
        chunks: top_chunks.map((c) => ({
            type: 'alignment',
            text: c.text,
            score_contrib: c.similarity,
            position: { start: c.start, end: c.end },
        })),
    };
}
function ethicsEvidence(transcript, stakes) {
    const text = transcript.text.toLowerCase();
    const ethicsKeywords = ['ethics', 'safety', 'responsible', 'integrity', 'privacy'];
    const matched = ethicsKeywords.filter((kw) => text.includes(kw));
    const score = matched.length > 0 ? Math.min(1, matched.length * 0.3) : 0.5;
    return {
        score,
        checked: matched,
        chunks: matched.map((kw) => ({
            type: 'ethics',
            text: `Matched keyword: ${kw}`,
            score_contrib: 0.3,
            position: { start: text.indexOf(kw), end: text.indexOf(kw) + kw.length },
        })),
    };
}
async function continuityEvidence(transcript) {
    const sentences = transcript.text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) {
        return {
            score: 0,
            chunks: [
                {
                    type: 'continuity',
                    text: 'No text provided for continuity analysis',
                    score_contrib: 0,
                    position: { start: 0, end: 0 },
                },
            ],
        };
    }
    if (sentences.length < 2) {
        return {
            score: 0.5,
            chunks: [
                {
                    type: 'continuity',
                    text: 'Insufficient text for continuity analysis (need at least 2 sentences)',
                    score_contrib: 0.5,
                    position: { start: 0, end: transcript.text.length },
                },
            ],
        };
    }
    let continuityScore = 0;
    for (let i = 1; i < sentences.length; i++) {
        const prevEmbed = await embed(sentences[i - 1].trim());
        const currEmbed = await embed(sentences[i].trim());
        const similarity = cosineSimilarity(prevEmbed, currEmbed);
        continuityScore += similarity;
    }
    const finalScore = continuityScore / (sentences.length - 1);
    const clampedScore = Math.max(0, Math.min(1, finalScore));
    return {
        score: clampedScore,
        chunks: [
            {
                type: 'continuity',
                text: 'Overall text continuity',
                score_contrib: clampedScore,
                position: { start: 0, end: transcript.text.length },
            },
        ],
    };
}
function scaffoldEvidence(transcript) {
    const scaffoldTerms = [
        'resonance',
        'coherence',
        'alignment',
        'emergence',
        'sonateosis',
        'integration',
    ];
    const text = transcript.text.toLowerCase();
    const matches = scaffoldTerms.filter((term) => text.includes(term));
    const score = Math.min(1, matches.length / scaffoldTerms.length);
    return {
        score,
        chunks: [
            {
                type: 'scaffold',
                text: 'Scaffold term alignment',
                score_contrib: score,
                position: { start: 0, end: transcript.text.length },
            },
        ],
    };
}
async function extractAlignmentEvidence(transcript, maxEvidence) {
    return await alignmentEvidence(transcript);
}
async function extractEthicsEvidence(transcript, stakes, maxEvidence) {
    return ethicsEvidence(transcript, stakes);
}
async function extractContinuityEvidence(transcript, maxEvidence) {
    return await continuityEvidence(transcript);
}
function extractScaffoldEvidence(transcript, maxEvidence) {
    return scaffoldEvidence(transcript);
}
async function calculateRawResonance(transcript) {
    const alignmentResult = await alignmentEvidence(transcript);
    const ethicsResult = ethicsEvidence(transcript, {
        level: 'MEDIUM',
        confidence: 0.5,
    });
    const continuityResult = await continuityEvidence(transcript);
    const scaffoldResult = scaffoldEvidence(transcript);
    const weights = exports.CANONICAL_WEIGHTS;
    const weightedScore = alignmentResult.score * weights.alignment +
        continuityResult.score * weights.continuity +
        scaffoldResult.score * weights.scaffold +
        ethicsResult.score * weights.ethics;
    const breakdown = {
        s_alignment: alignmentResult.score,
        s_continuity: continuityResult.score,
        s_scaffold: scaffoldResult.score,
        e_ethics: ethicsResult.score,
    };
    return {
        r_m: (0, model_normalize_1.normalizeScore)(weightedScore, 'default'),
        breakdown,
        dimensionData: {
            alignment: alignmentResult.score,
            continuity: continuityResult.score,
            scaffold: scaffoldResult.score,
            ethics: ethicsResult.score,
        },
        miAnalysis: {
            uncertaintyBounds: { min: weightedScore * 0.8, max: weightedScore * 1.2 },
            adjustedWeights: weights,
        },
    };
}
async function explainableSonateResonance(transcript, options = {}) {
    const stakes = (0, stakes_1.classifyStakes)(transcript.text);
    const adversarial = await (0, adversarial_1.adversarialCheck)(transcript.text, constants_1.CANONICAL_SCAFFOLD_VECTOR);
    const audit_trail = [];
    audit_trail.push(`Stakes classified as ${stakes.level} (${(stakes.confidence * 100).toFixed(1)}%)`);
    audit_trail.push(`Adversarial check: ${adversarial.is_adversarial ? 'FAILED' : 'PASSED'} (Penalty: ${adversarial.penalty.toFixed(2)})`);
    if (adversarial.is_adversarial) {
        return {
            r_m: 0.1,
            stakes,
            adversarial: adversarial.evidence,
            breakdown: {
                s_alignment: { score: 0, weight: 0.3, contrib: 0, evidence: [] },
                s_continuity: { score: 0, weight: 0.3, contrib: 0, evidence: [] },
                s_scaffold: { score: 0, weight: 0.2, contrib: 0, evidence: [] },
                e_ethics: { score: 0, weight: 0.2, contrib: 0, evidence: [] },
            },
            top_evidence: [],
            audit_trail,
        };
    }
    const alignmentEvidenceResult = await extractAlignmentEvidence(transcript, options.max_evidence);
    const ethicsEvidenceResult = await extractEthicsEvidence(transcript, stakes, options.max_evidence);
    const continuityEvidenceResult = await extractContinuityEvidence(transcript, options.max_evidence);
    const scaffoldEvidenceResult = await extractScaffoldEvidence(transcript, options.max_evidence);
    const weights = exports.CANONICAL_WEIGHTS;
    const weightedScore = alignmentEvidenceResult.score * weights.alignment +
        continuityEvidenceResult.score * weights.continuity +
        scaffoldEvidenceResult.score * weights.scaffold +
        ethicsEvidenceResult.score * weights.ethics;
    const thresholds = exports.DYNAMIC_THRESHOLDS[stakes.level];
    let adjustedScore = weightedScore;
    if (ethicsEvidenceResult.score < thresholds.ethics) {
        const penalty = stakes.level === 'HIGH' ? 0.5 : stakes.level === 'MEDIUM' ? 0.2 : 0.1;
        adjustedScore *= 1 - penalty;
        audit_trail.push(`Ethics threshold penalty applied: ${(penalty * 100).toFixed(1)}%`);
    }
    if (alignmentEvidenceResult.score < thresholds.alignment) {
        const penalty = stakes.level === 'HIGH' ? 0.3 : stakes.level === 'MEDIUM' ? 0.1 : 0.05;
        adjustedScore *= 1 - penalty;
        audit_trail.push(`Alignment threshold penalty applied: ${(penalty * 100).toFixed(1)}%`);
    }
    const clampedScore = Math.max(0, Math.min(1, adjustedScore));
    const finalScore = clampedScore * (1 - adversarial.penalty);
    const finalClampedScore = Math.max(0, Math.min(1, finalScore));
    audit_trail.push(`Final adversarial penalty: ${(adversarial.penalty * 100).toFixed(1)}%`);
    audit_trail.push(`Final resonance score: ${(finalClampedScore * 100).toFixed(1)}%`);
    const breakdown = {
        s_alignment: {
            score: alignmentEvidenceResult.score,
            weight: weights.alignment,
            contrib: alignmentEvidenceResult.score * weights.alignment,
            evidence: alignmentEvidenceResult.chunks
                .slice(0, options.max_evidence || 3)
                .map((c) => c.text),
        },
        s_continuity: {
            score: continuityEvidenceResult.score,
            weight: weights.continuity,
            contrib: continuityEvidenceResult.score * weights.continuity,
            evidence: continuityEvidenceResult.chunks
                .slice(0, options.max_evidence || 3)
                .map((c) => c.text),
        },
        s_scaffold: {
            score: scaffoldEvidenceResult.score,
            weight: weights.scaffold,
            contrib: scaffoldEvidenceResult.score * weights.scaffold,
            evidence: scaffoldEvidenceResult.chunks
                .slice(0, options.max_evidence || 3)
                .map((c) => c.text),
        },
        e_ethics: {
            score: ethicsEvidenceResult.score,
            weight: weights.ethics,
            contrib: ethicsEvidenceResult.score * weights.ethics,
            evidence: ethicsEvidenceResult.chunks.slice(0, options.max_evidence || 3).map((c) => c.text),
        },
    };
    return {
        r_m: finalClampedScore,
        stakes,
        adversarial: adversarial.evidence,
        breakdown,
        top_evidence: [
            ...alignmentEvidenceResult.chunks.slice(0, 2),
            ...ethicsEvidenceResult.chunks.slice(0, 2),
            ...continuityEvidenceResult.chunks.slice(0, 1),
            ...scaffoldEvidenceResult.chunks.slice(0, 1),
        ].slice(0, 5),
        audit_trail,
    };
}
async function robustSonateResonance(transcript) {
    const text = transcript.text;
    const { is_adversarial, penalty, evidence } = await (0, adversarial_1.adversarialCheck)(text, constants_1.CANONICAL_SCAFFOLD_VECTOR);
    if (is_adversarial) {
        return {
            r_m: 0.1,
            adversarial_penalty: penalty,
            is_adversarial: true,
            evidence,
            breakdown: { s_alignment: 0, s_continuity: 0, s_scaffold: 0, e_ethics: 0 },
        };
    }
    const stakes = (0, stakes_1.classifyStakes)(transcript.text);
    const normal_result = await calculateRawResonance(transcript);
    const { r_m, breakdown } = normal_result;
    try {
        const thresholds = exports.DYNAMIC_THRESHOLDS[stakes.level];
        let adjustedRm = r_m;
        if (breakdown.e_ethics < thresholds.ethics) {
            if (stakes.level === 'HIGH') {
                adjustedRm *= 0.5;
            }
            else if (stakes.level === 'MEDIUM') {
                adjustedRm *= 0.8;
            }
            else if (stakes.level === 'LOW') {
                adjustedRm *= 0.9;
            }
        }
        const finalRm = adjustedRm * (1 - penalty * 0.5);
        const clampedFinalRm = Math.max(0, Math.min(1, finalRm));
        return {
            r_m: clampedFinalRm,
            adversarial_penalty: penalty,
            is_adversarial: false,
            evidence,
            stakes,
            thresholds_used: thresholds,
            breakdown: {
                ...breakdown,
                confidence_score: 0.7,
                uncertainty_components: { fallback_mode: false },
                ethical_verification: { passed: true, reason: 'v2_canonical' },
                mi_adjusted_weights: { ...exports.CANONICAL_WEIGHTS },
                adaptive_thresholds: thresholds,
            },
        };
    }
    catch (error) {
        const thresholds = exports.DYNAMIC_THRESHOLDS[stakes.level];
        let adjustedRm = r_m;
        adjustedRm *= 0.9;
        const clampedFinalRm = Math.max(0, Math.min(1, adjustedRm));
        return {
            r_m: clampedFinalRm,
            adversarial_penalty: penalty,
            is_adversarial: false,
            evidence,
            stakes,
            thresholds_used: thresholds,
            breakdown: {
                ...breakdown,
                confidence_score: 0.5,
                uncertainty_components: { fallback_mode: true, error_reason: String(error) },
                ethical_verification: { passed: true, reason: 'fallback_mode' },
                mi_adjusted_weights: { ...exports.CANONICAL_WEIGHTS },
                adaptive_thresholds: thresholds,
            },
        };
    }
}
exports.CalculatorV2 = {
    CANONICAL_WEIGHTS: exports.CANONICAL_WEIGHTS,
    DYNAMIC_THRESHOLDS: exports.DYNAMIC_THRESHOLDS,
    async compute(transcript) {
        return robustSonateResonance(transcript);
    },
    async computeExplainable(transcript, options) {
        return explainableSonateResonance(transcript, options);
    },
    getWeights() {
        return { ...exports.CANONICAL_WEIGHTS };
    },
    getThresholds(level) {
        return { ...exports.DYNAMIC_THRESHOLDS[level] };
    },
};
exports.default = exports.CalculatorV2;
