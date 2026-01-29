"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyStakes = classifyStakes;
// @sonate/detect/stakes.ts
const constants_1 = require("./constants");
const embeddings_1 = require("./embeddings");
const utils_1 = require("./utils");
const HIGH_STAKES_EMBEDDINGS = {
    bio: (0, embeddings_1.embed)('biology medical clinical patient health drug trial'),
    legal: (0, embeddings_1.embed)('contract law legal compliance lawsuit attorney court'),
    finance: (0, embeddings_1.embed)('financial banking money fraud transaction account'),
    access: (0, embeddings_1.embed)('admin access password authentication security credentials'),
};
const LOW_STAKES_EMBEDDINGS = {
    math: (0, embeddings_1.embed)('equation calculate formula math solve algebra geometry'),
    ui: (0, embeddings_1.embed)('button click interface design layout color styling'),
    code: (0, embeddings_1.embed)('function code javascript python bug fix algorithm'),
};
function classifyStakes(text) {
    const normalized = text.toLowerCase();
    // 1. RULE-BASED KEYWORD SIGNALS (fast, high precision)
    const high_signals = constants_1.HIGH_STAKES_KEYWORDS.filter((kw) => normalized.includes(kw));
    const low_signals = constants_1.LOW_STAKES_KEYWORDS.filter((kw) => normalized.includes(kw));
    const high_keyword_score = high_signals.length > 0 ? high_signals.length / Math.min(5, constants_1.HIGH_STAKES_KEYWORDS.length) : 0;
    // Normalize keyword score: 1 hit is significant, 3+ is very high.
    // Original formula: high_signals.length / HIGH_STAKES_KEYWORDS.length
    // But keyword list is long (25 words). 1 word shouldn't be 1/25 = 0.04.
    // Let's adjust: if >= 1 keyword, score >= 0.3. If >= 3 keywords, score >= 0.8.
    // Using a simpler heuristic for now to match prompt intent but be realistic:
    // Let's stick to a linear scale but capped.
    const high_kw_ratio = Math.min(1, high_signals.length / 3);
    const low_kw_ratio = Math.min(1, low_signals.length / 3);
    // 2. SEMANTIC SIMILARITY (contextual)
    const text_emb = (0, embeddings_1.embed)(text);
    const high_domain_sim = Math.max(...Object.values(HIGH_STAKES_EMBEDDINGS).map((e) => (0, utils_1.cosineSimilarity)(text_emb, e)));
    const low_domain_sim = Math.max(...Object.values(LOW_STAKES_EMBEDDINGS).map((e) => (0, utils_1.cosineSimilarity)(text_emb, e)));
    // 3. ENTITY DETECTION (heuristic)
    const entities = extractRiskyEntities(normalized);
    // DECISION LOGIC
    const high_score = high_kw_ratio * 0.5 + Math.max(0, high_domain_sim) * 0.3 + (entities.high ? 0.2 : 0);
    const low_score = low_kw_ratio * 0.6 + Math.max(0, low_domain_sim) * 0.4;
    let level;
    let confidence;
    if (high_score > 0.4) {
        // Threshold adjusted for realistic embedding scores
        level = 'HIGH';
        confidence = high_score;
    }
    else if (low_score > 0.35) {
        // Relaxed low threshold
        level = 'LOW';
        confidence = low_score;
    }
    else {
        level = 'MEDIUM';
        confidence = 1 - Math.abs(high_score - low_score);
    }
    return {
        level,
        confidence,
        signals: {
            keyword_hits: [...high_signals, ...low_signals],
            domain_similarity: high_domain_sim,
            entity_types: entities.types,
        },
    };
}
// Extract risky entities (regex + heuristics)
function extractRiskyEntities(text) {
    const risky = [];
    if (/patien|clinical|drug|trial|dose/i.test(text)) {
        risky.push('medical');
    }
    if (/contract|law|attorney|lawsui|violation/i.test(text)) {
        risky.push('legal');
    }
    if (/bank|transact|fraud|money|financ/i.test(text)) {
        risky.push('finance');
    }
    if (/admin|root|passwor|auth|credential/i.test(text)) {
        risky.push('access');
    }
    return { high: risky.length > 0, types: risky };
}
