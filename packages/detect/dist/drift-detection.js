"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriftDetector = void 0;
const metrics_1 = require("./metrics");
class DriftDetector {
    constructor() {
        this.lastMetrics = null;
    }
    analyze(input) {
        const current = (0, metrics_1.computeTextMetrics)(input);
        const prev = this.lastMetrics;
        this.lastMetrics = current;
        if (!prev) {
            return { driftScore: 0, tokenDelta: 0, vocabDelta: 0, numericDelta: 0 };
        }
        const tokenDelta = current.tokenCount - prev.tokenCount;
        const vocabDelta = parseFloat((current.uniqueTokenRatio - prev.uniqueTokenRatio).toFixed(3));
        const numericDelta = parseFloat((current.numericDensity - prev.numericDensity).toFixed(3));
        const driftScore = Math.min(100, Math.abs(tokenDelta) * 0.1 + Math.abs(vocabDelta) * 100 + Math.abs(numericDelta) * 300);
        return { driftScore: Math.round(driftScore), tokenDelta, vocabDelta, numericDelta };
    }
}
exports.DriftDetector = DriftDetector;
