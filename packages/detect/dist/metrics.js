"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTextMetrics = computeTextMetrics;
exports.boundedScore = boundedScore;
function computeTextMetrics(input) {
    const content = typeof input === 'string' ? input : input.content;
    const tokens = content.split(/\s+/).filter(Boolean);
    const tokenCount = tokens.length;
    const uniqueTokenRatio = tokenCount === 0 ? 0 : new Set(tokens.map((t) => t.toLowerCase())).size / tokenCount;
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;
    const avgSentenceLength = sentenceCount === 0 ? 0 : tokens.length / sentenceCount;
    const numericDensity = tokenCount === 0 ? 0 : (content.match(/\d+(?:\.\d+)?%?/g)?.length || 0) / tokenCount;
    return { tokenCount, uniqueTokenRatio, sentenceCount, avgSentenceLength, numericDensity };
}
function boundedScore(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
