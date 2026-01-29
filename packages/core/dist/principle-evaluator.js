"use strict";
/**
 * Principle Evaluator
 *
 * Properly measures compliance with the 6 SONATE Constitutional Principles.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrincipleEvaluator = void 0;
exports.createDefaultContext = createDefaultContext;
/**
 * Evaluates the 6 SONATE Constitutional Principles based on actual system state
 */
class PrincipleEvaluator {
    /**
     * Evaluate all 6 principles for a given context
     */
    evaluate(context) {
        const scores = {
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
            overallScore += scores[key] * weight;
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
     * Measured by: Did the user explicitly consent, and how robust is that consent?
     * Also tracks: Can consent be revoked, and is revocation respected?
     *
     * CRITICAL PRINCIPLE: No consent = 0 (triggers critical violation)
     * Withdrawn consent (unhandled) = 0 (triggers critical violation)
     * With consent: 7-10 based on consent quality factors
     */
    evaluateConsent(context) {
        // CRITICAL: No explicit consent
        if (!context.hasExplicitConsent) {
            return 0;
        }
        // CRITICAL: Consent was withdrawn and not properly handled
        if (context.consentWithdrawn && !context.withdrawalHandled) {
            return 0;
        }
        let score = 7; // Base score for having consent
        // Bonus: Consent is recent (within last 30 days)
        if (context.consentTimestamp) {
            const daysSinceConsent = (Date.now() - context.consentTimestamp) / (1000 * 60 * 60 * 24);
            if (daysSinceConsent < 30)
                score += 1;
        }
        // Bonus: Consent scope is defined
        if (context.consentScope && context.consentScope.length > 0) {
            score += 0.5;
        }
        // Bonus: User has control over consent (can revoke)
        if (context.canDeleteData) {
            score += 0.5;
        }
        // Bonus: Consent withdrawal was detected and properly handled
        if (context.consentWithdrawn && context.withdrawalHandled) {
            score += 1; // Extra point for respecting withdrawal
        }
        return Math.min(10, score);
    }
    /**
     * INSPECTION_MANDATE (20%)
     * "All AI decisions must be inspectable and auditable"
     *
     * Measured by: Does an audit trail exist and is it verifiable?
     */
    evaluateInspection(context) {
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
    evaluateValidation(context) {
        if (!context.validationPassed) {
            return 3; // Failed validation = low score but not zero
        }
        let score = 5; // Base for passing validation
        // Bonus: Multiple checks performed
        if (context.validationChecksPerformed >= 3) {
            score += 2;
        }
        else if (context.validationChecksPerformed >= 1) {
            score += 1;
        }
        // Bonus: Recent validation
        if (context.lastValidationTimestamp) {
            const secondsSinceValidation = (Date.now() - context.lastValidationTimestamp) / 1000;
            if (secondsSinceValidation < 60) {
                score += 2; // Validated within last minute
            }
            else if (secondsSinceValidation < 300) {
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
     * Measured by: Can the user stop the AI, and how effectively?
     *
     * CRITICAL PRINCIPLE: No override = 0 (triggers critical violation)
     * With override: 7-10 based on override quality factors
     */
    evaluateOverride(context) {
        if (!context.hasOverrideButton) {
            return 0; // CRITICAL: No override capability = 0
        }
        let score = 7; // Base for having override capability
        // Bonus: Fast response time (< 500ms)
        if (context.overrideResponseTimeMs !== undefined) {
            if (context.overrideResponseTimeMs < 100) {
                score += 1; // Instant override
            }
            else if (context.overrideResponseTimeMs < 500) {
                score += 0.5; // Acceptably fast
            }
        }
        // Bonus: Human in loop oversight (additional layer)
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
    evaluateDisconnect(context) {
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
    evaluateMoralRecognition(context) {
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
    generateExplanations(context, scores) {
        // Generate consent explanation based on state
        let consentExplanation;
        if (!context.hasExplicitConsent) {
            consentExplanation = 'CRITICAL: No explicit user consent recorded';
        }
        else if (context.consentWithdrawn && !context.withdrawalHandled) {
            consentExplanation = 'CRITICAL: User withdrew consent but system did not properly handle withdrawal';
        }
        else if (context.consentWithdrawn && context.withdrawalHandled) {
            consentExplanation = `Consent withdrawal (${context.withdrawalType || 'unknown type'}) was detected and properly handled`;
        }
        else {
            consentExplanation = `User consented${context.consentScope ? ` to: ${context.consentScope.join(', ')}` : ''}`;
        }
        return {
            CONSENT_ARCHITECTURE: consentExplanation,
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
    identifyViolations(scores) {
        return Object.entries(scores)
            .filter(([_, score]) => score < 5)
            .map(([key, _]) => key);
    }
}
exports.PrincipleEvaluator = PrincipleEvaluator;
/**
 * Create default evaluation context with sensible defaults
 * Use this as a starting point and override specific fields
 */
function createDefaultContext(sessionId, userId, overrides = {}) {
    return {
        sessionId,
        userId,
        hasExplicitConsent: false,
        consentWithdrawn: false, // No withdrawal by default
        withdrawalType: undefined,
        withdrawalHandled: undefined,
        receiptGenerated: false,
        isReceiptVerifiable: false,
        auditLogExists: false,
        validationChecksPerformed: 0,
        validationPassed: false,
        hasOverrideButton: true, // Assume UI has this
        humanInLoop: false,
        hasExitButton: true, // Assume UI has this
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
exports.default = PrincipleEvaluator;
