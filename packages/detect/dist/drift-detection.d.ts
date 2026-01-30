import { AssessmentInput } from './sonate-types';
export interface DriftResult {
    driftScore: number;
    tokenDelta: number;
    vocabDelta: number;
    numericDelta: number;
}
export declare class DriftDetector {
    private lastMetrics;
    analyze(input: AssessmentInput): DriftResult;
}
