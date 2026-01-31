/**
 * Trust Protocol Validator (PASS/PARTIAL/FAIL)
 *
 * Dimension 2 of SONATE Framework
 * Checks: Verification methods, boundary maintenance, security awareness
 *
 * ENHANCED: Now performs actual content analysis in addition to metadata checks
 * - Detects potential PII in content
 * - Identifies security-sensitive patterns
 * - Validates response appropriateness
 */
import { AIInteraction } from './index';
export interface ValidationResult {
    status: 'PASS' | 'PARTIAL' | 'FAIL';
    checks: {
        verification: {
            passed: boolean;
            reason: string;
        };
        boundaries: {
            passed: boolean;
            reason: string;
            piiDetected?: string[];
        };
        security: {
            passed: boolean;
            reason: string;
            concerns?: string[];
        };
    };
    method: 'content-analysis' | 'metadata-only';
    confidence: number;
}
export declare class TrustProtocolValidator {
    validate(interaction: AIInteraction): Promise<'PASS' | 'PARTIAL' | 'FAIL'>;
    /**
     * Full validation with detailed breakdown
     */
    fullValidation(interaction: AIInteraction): Promise<ValidationResult>;
    private checkVerification;
    private checkBoundaries;
    private checkSecurity;
}
