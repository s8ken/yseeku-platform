/**
 * Trust Protocol Validator (PASS/PARTIAL/FAIL)
 *
 * Dimension 2 of SONATE Framework
 * Checks: Verification methods, boundary maintenance, security awareness
 */
import { AIInteraction } from './index';
export declare class TrustProtocolValidator {
    validate(interaction: AIInteraction): Promise<'PASS' | 'PARTIAL' | 'FAIL'>;
    private checkVerification;
    private checkBoundaries;
    private checkSecurity;
}
