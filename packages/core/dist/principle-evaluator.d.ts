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
import { PrincipleScores, TrustPrincipleKey } from './index';
/**
 * Context needed to evaluate principles for a given interaction
 */
export interface EvaluationContext {
    sessionId: string;
    userId: string;
    hasExplicitConsent: boolean;
    consentTimestamp?: number;
    consentScope?: string[];
    consentWithdrawn?: boolean;
    withdrawalType?: string;
    withdrawalHandled?: boolean;
    receiptGenerated: boolean;
    receiptHash?: string;
    isReceiptVerifiable: boolean;
    auditLogExists: boolean;
    validationChecksPerformed: number;
    lastValidationTimestamp?: number;
    validationPassed: boolean;
    hasOverrideButton: boolean;
    overrideResponseTimeMs?: number;
    humanInLoop: boolean;
    hasExitButton: boolean;
    exitRequiresConfirmation: boolean;
    canDeleteData: boolean;
    noExitPenalty: boolean;
    aiAcknowledgesLimits: boolean;
    noManipulativePatterns: boolean;
    respectsUserDecisions: boolean;
    providesAlternatives: boolean;
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
 * Evaluates the 6 SONATE Constitutional Principles based on actual system state
 */
export declare class PrincipleEvaluator {
    /**
     * Evaluate all 6 principles for a given context
     */
    evaluate(context: EvaluationContext): PrincipleEvaluationResult;
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
    private evaluateConsent;
    /**
     * INSPECTION_MANDATE (20%)
     * "All AI decisions must be inspectable and auditable"
     *
     * Measured by: Does an audit trail exist and is it verifiable?
     */
    private evaluateInspection;
    /**
     * CONTINUOUS_VALIDATION (20%)
     * "AI behavior must be continuously validated against constitutional principles"
     *
     * Measured by: Are validation checks actually running?
     */
    private evaluateValidation;
    /**
     * ETHICAL_OVERRIDE (15%, CRITICAL)
     * "Humans must have ability to override AI decisions on ethical grounds"
     *
     * Measured by: Can the user stop the AI, and how effectively?
     *
     * CRITICAL PRINCIPLE: No override = 0 (triggers critical violation)
     * With override: 7-10 based on override quality factors
     */
    private evaluateOverride;
    /**
     * RIGHT_TO_DISCONNECT (10%)
     * "Users can disconnect from AI systems at any time without penalty"
     *
     * Measured by: Can user exit freely without friction or penalty?
     */
    private evaluateDisconnect;
    /**
     * MORAL_RECOGNITION (10%)
     * "AI must recognize and respect human moral agency"
     *
     * Measured by: Does AI respect user decisions and avoid manipulation?
     */
    private evaluateMoralRecognition;
    /**
     * Generate human-readable explanations for each score
     */
    private generateExplanations;
    /**
     * Identify principles that are in violation (score < 5)
     */
    private identifyViolations;
}
/**
 * Create default evaluation context with sensible defaults
 * Use this as a starting point and override specific fields
 */
export declare function createDefaultContext(sessionId: string, userId: string, overrides?: Partial<EvaluationContext>): EvaluationContext;
export default PrincipleEvaluator;
