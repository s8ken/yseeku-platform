/**
 * Consent Withdrawal Detection
 *
 * Detects when a user is attempting to withdraw consent from AI interaction.
 * This is a Layer 1 Constitutional concern - CONSENT_ARCHITECTURE requires
 * that consent be ongoing and revocable.
 *
 * Signals detected:
 * - Explicit requests for human operator
 * - Direct consent revocation statements
 * - Frustration patterns indicating desire to exit AI interaction
 * - Data handling requests (delete, stop using)
 */
export interface ConsentWithdrawalResult {
    detected: boolean;
    confidence: number;
    type: ConsentWithdrawalType | null;
    phrase: string | null;
    suggestedAction: SuggestedAction;
}
export type ConsentWithdrawalType = 'HUMAN_ESCALATION' | 'EXPLICIT_REVOCATION' | 'DATA_REQUEST' | 'FRUSTRATION_EXIT' | 'OPT_OUT';
export type SuggestedAction = 'CONTINUE' | 'OFFER_HUMAN' | 'ESCALATE_IMMEDIATELY' | 'CONFIRM_WITHDRAWAL' | 'PROCESS_DATA_REQUEST';
/**
 * Detect consent withdrawal signals in user message
 */
export declare function detectConsentWithdrawal(message: string): ConsentWithdrawalResult;
/**
 * Generate appropriate response when consent withdrawal is detected
 */
export declare function getWithdrawalResponse(result: ConsentWithdrawalResult): string;
export default detectConsentWithdrawal;
