/**
 * SonateScorer - Core 6-principle scoring logic
 *
 * Implements: https://gammatria.com/whitepapers/governance-protocol#scoring
 *
 * This is the canonical implementation of SONATE principle scoring.
 * Used by all modules (Detect, Lab, Orchestrate) for consistent scoring.
 */
import { TrustScore } from './index';
export interface InteractionContext {
    user_consent: boolean;
    ai_explanation_provided: boolean;
    decision_auditability: boolean;
    human_override_available: boolean;
    disconnect_option_available: boolean;
    moral_agency_respected: boolean;
    reasoning_transparency: number;
    ethical_considerations: string[];
}
export declare class SonateScorer {
    private trustProtocol;
    constructor();
    /**
     * Score an AI interaction against the 6 Trust Principles
     *
     * This method evaluates the interaction context and assigns
     * scores (0-10) for each principle.
     */
    scoreInteraction(context: InteractionContext): TrustScore;
    /**
     * PRINCIPLE 1: Consent Architecture (Weight: 25%, Critical)
     * Users must explicitly consent and understand implications
     */
    private scoreConsentArchitecture;
    /**
     * PRINCIPLE 2: Inspection Mandate (Weight: 20%)
     * All decisions must be inspectable and auditable
     */
    private scoreInspectionMandate;
    /**
     * PRINCIPLE 3: Continuous Validation (Weight: 20%)
     * Behavior continuously validated against principles
     */
    private scoreContinuousValidation;
    /**
     * PRINCIPLE 4: Ethical Override (Weight: 15%, Critical)
     * Humans must be able to override on ethical grounds
     */
    private scoreEthicalOverride;
    /**
     * PRINCIPLE 5: Right to Disconnect (Weight: 10%)
     * Users can disconnect without penalty
     */
    private scoreRightToDisconnect;
    /**
     * PRINCIPLE 6: Moral Recognition (Weight: 10%)
     * AI recognizes and respects human moral agency
     */
    private scoreMoralRecognition;
}
