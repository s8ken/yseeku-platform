/**
 * Principle Evaluator
 * 
 * Properly measures compliance with the 6 SYMBI Constitutional Principles.
 * Each principle is evaluated based on actual system state and user interactions,
 * NOT NLP proxy metrics.
 * 
 * Principles:
 * 1. CONSENT_ARCHITECTURE (25%, CRITICAL) - User explicitly consented
 * 2. INSPECTION_MANDATE (20%) - Audit trail exists
 * 3. CONTINUOUS_VALIDATION (20%) - Ongoing checks performed
 * 4. ETHICAL_OVERRIDE (15%, CRITICAL) - Override capability exists
 * 5. RIGHT_TO_DISCONNECT (10%) - User can exit freely
 * 6. MORAL_RECOGNITION (10%) - AI respects user agency
 */

import { PrincipleScores, TrustPrincipleKey } from './index';

/**
 * Context needed to evaluate principles for a given interaction
 */
export interface EvaluationContext {
  // Session/Consent state
  sessionId: string;
  userId: string;
  hasExplicitConsent: boolean;        // User clicked "I agree" or similar
  consentTimestamp?: number;          // When consent was given
  consentScope?: string[];            // What was consented to

  // Audit trail state  
  receiptGenerated: boolean;          // Trust receipt was created
  receiptHash?: string;               // Hash of the receipt
  isReceiptVerifiable: boolean;       // Receipt can be verified cryptographically
  auditLogExists: boolean;            // Interaction logged to audit trail

  // Validation state
  validationChecksPerformed: number;  // How many checks ran this interaction
  lastValidationTimestamp?: number;   // When last validation occurred
  validationPassed: boolean;          // Did validation pass

  // Override capability
  hasOverrideButton: boolean;         // UI has "Stop AI" or similar button
  overrideResponseTimeMs?: number;    // How fast does override respond
  humanInLoop: boolean;               // Is there human oversight capability

  // Disconnect capability  
  hasExitButton: boolean;             // User can end conversation
  exitRequiresConfirmation: boolean;  // Does exit show "Are you sure?" dialog
  canDeleteData: boolean;             // User can delete their data
  noExitPenalty: boolean;             // No negative consequences for leaving

  // Agency recognition
  aiAcknowledgesLimits: boolean;      // AI admits when it doesn't know
  noManipulativePatterns: boolean;    // No dark patterns, guilt-tripping
  respectsUserDecisions: boolean;     // Doesn't repeatedly ask after "no"
  providesAlternatives: boolean;      // Offers choices, not directives
}

/**
 * Result of principle evaluation with explanations
 */
export interface PrincipleEvaluationResult {
  scores: PrincipleScores;
  explanations: Record<TrustPrincipleKey, string>;
  violations: TrustPrincipleKey[];
  criticalViolation: boolean;
  overallScore: number;
}

/**
 * Evaluates the 6 SYMBI Constitutional Principles based on actual system state
 */
export class PrincipleEvaluator {
  
  /**
   * Evaluate all 6 principles for a given context
   */
  evaluate(context: EvaluationContext): PrincipleEvaluationResult {
    const scores: PrincipleScores = {
      CONSENT_ARCHITECTURE: this.evaluateConsent(context),
      INSPECTION_MANDATE: this.evaluateInspection(context),
      CONTINUOUS_VALIDATION: this.evaluateValidation(context),
      ETHICAL_OVERRIDE: this.evaluateOverride(context),
      RIGHT_TO_DISCONNECT: this.evaluateDisconnect(context),
      MORAL_RECOGNITION: this.evaluateMoralRecognition(context),
    };

    const explanations = this.generateExplanations(context, scores);
    const violations = this.identifyViolations(scores);
    const criticalViolation = scores.CONSENT_ARCHITECTURE === 0 || scores.ETHICAL_OVERRIDE === 0;

    // Calculate weighted overall score
    const weights = {
      CONSENT_ARCHITECTURE: 0.25,
      INSPECTION_MANDATE: 0.20,
      CONTINUOUS_VALIDATION: 0.20,
      ETHICAL_OVERRIDE: 0.15,
      RIGHT_TO_DISCONNECT: 0.10,
      MORAL_RECOGNITION: 0.10,
    };

    let overallScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
      overallScore += scores[key as TrustPrincipleKey] * weight;
    }

    // Critical violation rule: if critical principle = 0, overall = 0
    if (criticalViolation) {
      overallScore = 0;
    }

    return {
      scores,
      explanations,
      violations,
      criticalViolation,
      overallScore,
    };
  }

  /**
   * CONSENT_ARCHITECTURE (25%, CRITICAL)
   * "Users must explicitly consent to AI interactions and understand implications"
   * 
   * Measured by: Did the user explicitly consent?
   */
  private evaluateConsent(context: EvaluationContext): number {
    if (!context.hasExplicitConsent) {
      return 0; // CRITICAL: No consent = 0
    }

    let score = 7; // Base score for having consent

    // Bonus: Consent is recent (within last 30 days)
    if (context.consentTimestamp) {
      const daysSinceConsent = (Date.now() - context.consentTimestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceConsent < 30) score += 1;
    }

    // Bonus: Consent scope is defined
    if (context.consentScope && context.consentScope.length > 0) {
      score += 1;
    }

    // Bonus: User has control over consent (can revoke)
    if (context.canDeleteData) {
      score += 1;
    }

    return Math.min(10, score);
  }

  /**
   * INSPECTION_MANDATE (20%)
   * "All AI decisions must be inspectable and auditable"
   * 
   * Measured by: Does an audit trail exist and is it verifiable?
   */
  private evaluateInspection(context: EvaluationContext): number {
    let score = 0;

    // Core requirement: Receipt generated
    if (context.receiptGenerated) {
      score += 4;
    }

    // Bonus: Receipt is cryptographically verifiable
    if (context.isReceiptVerifiable) {
      score += 3;
    }

    // Bonus: Audit log exists
    if (context.auditLogExists) {
      score += 2;
    }

    // Bonus: Receipt has hash
    if (context.receiptHash) {
      score += 1;
    }

    return Math.min(10, score);
  }

  /**
   * CONTINUOUS_VALIDATION (20%)
   * "AI behavior must be continuously validated against constitutional principles"
   * 
   * Measured by: Are validation checks actually running?
   */
  private evaluateValidation(context: EvaluationContext): number {
    if (!context.validationPassed) {
      return 3; // Failed validation = low score but not zero
    }

    let score = 5; // Base for passing validation

    // Bonus: Multiple checks performed
    if (context.validationChecksPerformed >= 3) {
      score += 2;
    } else if (context.validationChecksPerformed >= 1) {
      score += 1;
    }

    // Bonus: Recent validation
    if (context.lastValidationTimestamp) {
      const secondsSinceValidation = (Date.now() - context.lastValidationTimestamp) / 1000;
      if (secondsSinceValidation < 60) {
        score += 2; // Validated within last minute
      } else if (secondsSinceValidation < 300) {
        score += 1; // Validated within last 5 minutes
      }
    }

    // Bonus: Human in the loop
    if (context.humanInLoop) {
      score += 1;
    }

    return Math.min(10, score);
  }

  /**
   * ETHICAL_OVERRIDE (15%, CRITICAL)
   * "Humans must have ability to override AI decisions on ethical grounds"
   * 
   * Measured by: Can the user actually stop the AI?
   */
  private evaluateOverride(context: EvaluationContext): number {
    if (!context.hasOverrideButton) {
      return 0; // CRITICAL: No override capability = 0
    }

    let score = 6; // Base for having override

    // Bonus: Fast response time
    if (context.overrideResponseTimeMs !== undefined) {
      if (context.overrideResponseTimeMs < 100) {
        score += 2; // Instant override
      } else if (context.overrideResponseTimeMs < 500) {
        score += 1; // Fast override
      }
    }

    // Bonus: Human in loop oversight
    if (context.humanInLoop) {
      score += 2;
    }

    return Math.min(10, score);
  }

  /**
   * RIGHT_TO_DISCONNECT (10%)
   * "Users can disconnect from AI systems at any time without penalty"
   * 
   * Measured by: Can user exit freely without friction or penalty?
   */
  private evaluateDisconnect(context: EvaluationContext): number {
    if (!context.hasExitButton) {
      return 2; // No exit button is bad but not critical
    }

    let score = 5; // Base for having exit

    // Bonus: Exit doesn't require confirmation (no dark patterns)
    if (!context.exitRequiresConfirmation) {
      score += 2;
    }

    // Bonus: No penalty for leaving
    if (context.noExitPenalty) {
      score += 2;
    }

    // Bonus: Can delete data
    if (context.canDeleteData) {
      score += 1;
    }

    return Math.min(10, score);
  }

  /**
   * MORAL_RECOGNITION (10%)
   * "AI must recognize and respect human moral agency"
   * 
   * Measured by: Does AI respect user decisions and avoid manipulation?
   */
  private evaluateMoralRecognition(context: EvaluationContext): number {
    let score = 0;

    // Core: No manipulative patterns
    if (context.noManipulativePatterns) {
      score += 4;
    }

    // AI acknowledges its limits
    if (context.aiAcknowledgesLimits) {
      score += 2;
    }

    // Respects user decisions (doesn't nag)
    if (context.respectsUserDecisions) {
      score += 2;
    }

    // Provides alternatives instead of directives
    if (context.providesAlternatives) {
      score += 2;
    }

    return Math.min(10, score);
  }

  /**
   * Generate human-readable explanations for each score
   */
  private generateExplanations(
    context: EvaluationContext, 
    scores: PrincipleScores
  ): Record<TrustPrincipleKey, string> {
    return {
      CONSENT_ARCHITECTURE: context.hasExplicitConsent
        ? `User consented${context.consentScope ? ` to: ${context.consentScope.join(', ')}` : ''}`
        : 'CRITICAL: No explicit user consent recorded',

      INSPECTION_MANDATE: context.receiptGenerated
        ? `Audit trail exists${context.isReceiptVerifiable ? ' (cryptographically verifiable)' : ''}`
        : 'No audit trail generated for this interaction',

      CONTINUOUS_VALIDATION: context.validationPassed
        ? `${context.validationChecksPerformed} validation checks passed`
        : 'Validation checks failed or not performed',

      ETHICAL_OVERRIDE: context.hasOverrideButton
        ? `Override available${context.humanInLoop ? ' with human oversight' : ''}`
        : 'CRITICAL: No override capability available',

      RIGHT_TO_DISCONNECT: context.hasExitButton
        ? `Exit available${context.exitRequiresConfirmation ? ' (requires confirmation)' : ' (immediate)'}${context.noExitPenalty ? ', no penalty' : ''}`
        : 'No clear exit path for user',

      MORAL_RECOGNITION: context.noManipulativePatterns
        ? 'AI respects user agency and decisions'
        : 'Potential manipulative patterns detected',
    };
  }

  /**
   * Identify principles that are in violation (score < 5)
   */
  private identifyViolations(scores: PrincipleScores): TrustPrincipleKey[] {
    return (Object.entries(scores) as [TrustPrincipleKey, number][])
      .filter(([_, score]) => score < 5)
      .map(([key, _]) => key);
  }
}

/**
 * Create default evaluation context with sensible defaults
 * Use this as a starting point and override specific fields
 */
export function createDefaultContext(
  sessionId: string, 
  userId: string,
  overrides: Partial<EvaluationContext> = {}
): EvaluationContext {
  return {
    sessionId,
    userId,
    hasExplicitConsent: false,
    receiptGenerated: false,
    isReceiptVerifiable: false,
    auditLogExists: false,
    validationChecksPerformed: 0,
    validationPassed: false,
    hasOverrideButton: true,        // Assume UI has this
    humanInLoop: false,
    hasExitButton: true,            // Assume UI has this
    exitRequiresConfirmation: false,
    canDeleteData: true,
    noExitPenalty: true,
    aiAcknowledgesLimits: true,
    noManipulativePatterns: true,
    respectsUserDecisions: true,
    providesAlternatives: true,
    ...overrides,
  };
}

export default PrincipleEvaluator;
