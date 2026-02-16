// @sonate/core/detection/model-normalize.ts

/**
 * Model-specific bias correction factors
 * 
 * Different LLM models exhibit different scoring biases. These factors correct
 * for known model tendencies (e.g., Gemini tends high, DeepSeek tends low).
 * 
 * Formula: corrected_score = raw_score * scale + offset
 * 
 * Use ONLY when explicitly using a specific LLM model. For generic/unknown models,
 * do NOT call this function (the score is already in [0,1] range).
 */
interface ModelNorm {
    scale: number;
    offset: number;
}

const MODEL_NORMS: Record<string, ModelNorm> = {
    'gemini-2.0-pro': { scale: 1.15, offset: 0.05 }, // Tends high
    'gpt-4o-2024-08-06': { scale: 0.92, offset: 0.02 }, // Tends low
    'claude-3-5-sonnet': { scale: 1.08, offset: -0.01 },
    'claude-sonnet-4-20250514': { scale: 1.08, offset: -0.01 },
    'claude-opus-4-20250514': { scale: 1.05, offset: -0.01 },
    'gemini-2.5-pro': { scale: 1.22, offset: 0.08 }, // High bias
    'deepseek-r1': { scale: 0.88, offset: -0.03 }, // Low bias
    // DO NOT ADD 'default': always use the model name explicitly
};

export function normalizeEmbedding(emb: number[], model: string): number[] {
    const norm = MODEL_NORMS[model];
    if (!norm) {
        console.warn(`[model-normalize] Unknown model: ${model}. Returning embedding unchanged.`);
        return emb;
    }
    return emb.map((v) => v * norm.scale + norm.offset);
}

/**
 * Apply model-specific bias correction to a score
 * 
 * IMPORTANT: Only call this if you know the specific LLM model was used.
 * For generic scoring or unknown models, return the score directly.
 * 
 * @param raw_score Score in [0, 1] range from the scoring function
 * @param model Specific LLM model name (e.g., 'gemini-2.5-pro', 'gpt-4o-2024-08-06')
 * @returns Bias-corrected score, clamped to [0, 1]
 */
export function applyModelBiasCorrection(raw_score: number, model: string): number {
    const norm = MODEL_NORMS[model];
    if (!norm) {
        console.warn(`[model-normalize] Unknown model: ${model}. Returning score unchanged.`);
        return Math.max(0, Math.min(1, raw_score));
    }
    return Math.max(0, Math.min(1, raw_score * norm.scale + norm.offset));
}

/**
 * @deprecated Use applyModelBiasCorrection() instead. This function's name was misleading.
 */
export function normalizeScore(raw_rm: number, model: string): number {
    return applyModelBiasCorrection(raw_rm, model);
}
