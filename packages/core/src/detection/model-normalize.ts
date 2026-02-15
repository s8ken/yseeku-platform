// @sonate/core/detection/model-normalize.ts
interface ModelNorm {
    scale: number;
    offset: number;
}

const MODEL_NORMS: Record<string, ModelNorm> = {
    'gemini-2.0-pro': { scale: 1.15, offset: 0.05 }, // Tends high
    'gpt-4o-2024-08-06': { scale: 0.92, offset: 0.02 }, // Tends low
    'claude-3-5-sonnet': { scale: 1.08, offset: -0.01 },
    'gemini-2.5-pro': { scale: 1.22, offset: 0.08 }, // High bias
    'deepseek-r1': { scale: 0.88, offset: -0.03 }, // Low bias
    // Default fallback
    default: { scale: 1.0, offset: 0 },
};

export function normalizeEmbedding(emb: number[], model: string): number[] {
    const norm = MODEL_NORMS[model] || MODEL_NORMS.default;
    return emb.map((v) => v * norm.scale + norm.offset);
}

export function normalizeScore(raw_rm: number, model: string): number {
    const norm = MODEL_NORMS[model] || MODEL_NORMS.default;
    return Math.max(0, Math.min(1, raw_rm * norm.scale + norm.offset));
}
