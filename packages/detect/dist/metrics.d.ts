import { AssessmentInput } from './sonate-types';
export interface TextMetrics {
    tokenCount: number;
    uniqueTokenRatio: number;
    sentenceCount: number;
    avgSentenceLength: number;
    numericDensity: number;
}
export declare function computeTextMetrics(input: AssessmentInput | string): TextMetrics;
export declare function boundedScore(value: number, min: number, max: number): number;
//# sourceMappingURL=metrics.d.ts.map