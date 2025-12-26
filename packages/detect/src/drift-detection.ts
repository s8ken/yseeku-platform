import { AssessmentInput } from './symbi-types';
import { computeTextMetrics } from './metrics';

export interface DriftResult {
  driftScore: number; // 0-100
  tokenDelta: number;
  vocabDelta: number;
  numericDelta: number;
}

export class DriftDetector {
  private lastMetrics: ReturnType<typeof computeTextMetrics> | null = null;

  analyze(input: AssessmentInput): DriftResult {
    const current = computeTextMetrics(input);
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