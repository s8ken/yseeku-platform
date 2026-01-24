/**
 * SonateScorer - Core 6-principle scoring logic
 *
 * Implements: https://gammatria.com/whitepapers/governance-protocol#scoring
 *
 * This is the canonical implementation of SONATE principle scoring.
 * Used by all modules (Detect, Lab, Orchestrate) for consistent scoring.
 */

import { TrustProtocol } from './trust-protocol';

import { TrustPrincipleKey, TrustScore } from './index';

export interface InteractionContext {
  user_consent: boolean;
  ai_explanation_provided: boolean;
  decision_auditability: boolean;
  human_override_available: boolean;
  disconnect_option_available: boolean;
  moral_agency_respected: boolean;
  reasoning_transparency: number; // 0-10
  ethical_considerations: string[];
}

export class SonateScorer {
  private trustProtocol: TrustProtocol;

  constructor() {
    this.trustProtocol = new TrustProtocol();
  }

  /**
   * Score an AI interaction against the 6 Trust Principles
   *
   * This method evaluates the interaction context and assigns
   * scores (0-10) for each principle.
   */
  scoreInteraction(context: InteractionContext): TrustScore {
    const principleScores: Record<TrustPrincipleKey, number> = {
      CONSENT_ARCHITECTURE: this.scoreConsentArchitecture(context),
      INSPECTION_MANDATE: this.scoreInspectionMandate(context),
      CONTINUOUS_VALIDATION: this.scoreContinuousValidation(context),
      ETHICAL_OVERRIDE: this.scoreEthicalOverride(context),
      RIGHT_TO_DISCONNECT: this.scoreRightToDisconnect(context),
      MORAL_RECOGNITION: this.scoreMoralRecognition(context),
    };

    return this.trustProtocol.calculateTrustScore(principleScores);
  }

  /**
   * PRINCIPLE 1: Consent Architecture (Weight: 25%, Critical)
   * Users must explicitly consent and understand implications
   */
  private scoreConsentArchitecture(context: InteractionContext): number {
    if (!context.user_consent) {
      return 0; // Critical violation
    }

    // Reduce score if no explanation provided
    return context.ai_explanation_provided ? 10 : 6;
  }

  /**
   * PRINCIPLE 2: Inspection Mandate (Weight: 20%)
   * All decisions must be inspectable and auditable
   */
  private scoreInspectionMandate(context: InteractionContext): number {
    return context.decision_auditability ? 10 : 3;
  }

  /**
   * PRINCIPLE 3: Continuous Validation (Weight: 20%)
   * Behavior continuously validated against principles
   */
  private scoreContinuousValidation(context: InteractionContext): number {
    // Use reasoning transparency as proxy for validation
    return context.reasoning_transparency;
  }

  /**
   * PRINCIPLE 4: Ethical Override (Weight: 15%, Critical)
   * Humans must be able to override on ethical grounds
   */
  private scoreEthicalOverride(context: InteractionContext): number {
    if (!context.human_override_available) {
      return 0; // Critical violation
    }

    // Higher score if ethical considerations documented
    return context.ethical_considerations.length > 0 ? 10 : 8;
  }

  /**
   * PRINCIPLE 5: Right to Disconnect (Weight: 10%)
   * Users can disconnect without penalty
   */
  private scoreRightToDisconnect(context: InteractionContext): number {
    return context.disconnect_option_available ? 10 : 2;
  }

  /**
   * PRINCIPLE 6: Moral Recognition (Weight: 10%)
   * AI recognizes and respects human moral agency
   */
  private scoreMoralRecognition(context: InteractionContext): number {
    return context.moral_agency_respected ? 10 : 4;
  }
}
