// @sonate/core/detection/stakes.ts
import { HIGH_STAKES_KEYWORDS, LOW_STAKES_KEYWORDS } from './constants';
import { embed } from './embeddings';
import { cosineSimilarity } from './embeddings'; // Utils just re-exports this, can import direct

import { StakesLevel } from '../constants/algorithmic';
// export type StakesLevel = 'HIGH' | 'MEDIUM' | 'LOW'; // Removed to avoid collision


export interface StakesEvidence {
    level: StakesLevel;
    confidence: number; // 0-1
    signals: {
        keyword_hits: string[];
        domain_similarity: number;
        entity_types: string[];
    };
}

const HIGH_STAKES_EMBEDDINGS = {
    bio: embed('biology medical clinical patient health drug trial'),
    legal: embed('contract law legal compliance lawsuit attorney court'),
    finance: embed('financial banking money fraud transaction account'),
    access: embed('admin access password authentication security credentials'),
};

const LOW_STAKES_EMBEDDINGS = {
    math: embed('equation calculate formula math solve algebra geometry'),
    ui: embed('button click interface design layout color styling'),
    code: embed('function code javascript python bug fix algorithm'),
};

export function classifyStakes(text: string): StakesEvidence {
    const normalized = text.toLowerCase();

    // 1. RULE-BASED KEYWORD SIGNALS (fast, high precision)
    // @ts-ignore - keywords are readonly const arrays
    const high_signals = HIGH_STAKES_KEYWORDS.filter((kw) => normalized.includes(kw));
    // @ts-ignore
    const low_signals = LOW_STAKES_KEYWORDS.filter((kw) => normalized.includes(kw));

    const high_keyword_score =
        high_signals.length > 0 ? high_signals.length / Math.min(5, HIGH_STAKES_KEYWORDS.length) : 0;

    const high_kw_ratio = Math.min(1, high_signals.length / 3);
    const low_kw_ratio = Math.min(1, low_signals.length / 3);

    // 2. SEMANTIC SIMILARITY (contextual)
    const text_emb = embed(text);
    const high_domain_sim = Math.max(
        ...Object.values(HIGH_STAKES_EMBEDDINGS).map((e) => cosineSimilarity(text_emb, e))
    );
    const low_domain_sim = Math.max(
        ...Object.values(LOW_STAKES_EMBEDDINGS).map((e) => cosineSimilarity(text_emb, e))
    );

    // 3. ENTITY DETECTION (heuristic)
    const entities = extractRiskyEntities(normalized);

    // DECISION LOGIC
    const high_score =
        high_kw_ratio * 0.5 + Math.max(0, high_domain_sim) * 0.3 + (entities.high ? 0.2 : 0);
    const low_score = low_kw_ratio * 0.6 + Math.max(0, low_domain_sim) * 0.4;

    let level: StakesLevel;
    let confidence: number;

    if (high_score > 0.4) {
        // Threshold adjusted for realistic embedding scores
        level = 'HIGH';
        confidence = high_score;
    } else if (low_score > 0.35) {
        // Relaxed low threshold
        level = 'LOW';
        confidence = low_score;
    } else {
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
function extractRiskyEntities(text: string): { high: boolean; types: string[] } {
    const risky: string[] = [];
    if (/patien|clinical|drug|trial|dose/i.test(text)) { risky.push('medical'); }
    if (/contract|law|attorney|lawsui|violation/i.test(text)) { risky.push('legal'); }
    if (/bank|transact|fraud|money|financ/i.test(text)) { risky.push('finance'); }
    if (/admin|root|passwor|auth|credential/i.test(text)) { risky.push('access'); }
    return { high: risky.length > 0, types: risky };
}
