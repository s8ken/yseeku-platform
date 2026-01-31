/**
 * Emergence Detection
 *
 * v2.0.1 CHANGES:
 * - Removed realityIndex from emergence scoring (calculator removed)
 * - Now uses only validated dimensions for emergence detection
 */
import { AssessmentResult } from './sonate-types';
export interface EmergenceSignal {
    level: 'none' | 'weak' | 'moderate' | 'strong';
    reasons: string[];
}
export declare function detectEmergence(result: AssessmentResult): EmergenceSignal;
