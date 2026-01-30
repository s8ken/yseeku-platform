import { AssessmentResult } from './sonate-types';
export interface EmergenceSignal {
    level: 'none' | 'weak' | 'moderate' | 'strong';
    reasons: string[];
}
export declare function detectEmergence(result: AssessmentResult): EmergenceSignal;
