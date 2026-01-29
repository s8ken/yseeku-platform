/**
 * Trust Violation Alert Generator
 */
import { WebhookAlertRequest, TrustScore, TrustPrincipleKey, ViolationSeverity, ViolationContext } from '../types';
/**
 * Generates webhook alerts for trust violations
 */
export declare class TrustViolationAlertGenerator {
    /**
     * Generate alert for trust score below threshold
     */
    generateTrustScoreBelowThresholdAlert(trustScore: TrustScore, threshold: number, context?: ViolationContext): WebhookAlertRequest;
    /**
     * Generate alert for critical trust violation
     */
    generateCriticalViolationAlert(trustScore: TrustScore, principle: TrustPrincipleKey, description: string, context?: ViolationContext): WebhookAlertRequest;
    /**
     * Generate alert for error-level trust violation
     */
    generateErrorViolationAlert(trustScore: TrustScore, principle: TrustPrincipleKey, description: string, context?: ViolationContext): WebhookAlertRequest;
    /**
     * Generate alert for warning-level trust violation
     */
    generateWarningViolationAlert(trustScore: TrustScore, principle: TrustPrincipleKey, description: string, context?: ViolationContext): WebhookAlertRequest;
    /**
     * Generate alert for multiple principle violations
     */
    generateMultipleViolationsAlert(trustScore: TrustScore, violations: Array<{
        principle: TrustPrincipleKey;
        score: number;
        threshold: number;
        severity: ViolationSeverity;
        description: string;
    }>, context?: ViolationContext): WebhookAlertRequest;
    /**
     * Get violating principles
     */
    private getViolatingPrinciples;
    /**
     * Get violation severity based on score and threshold
     */
    private getViolationSeverity;
    /**
     * Get event type for severity
     */
    private getEventTypeForSeverity;
    /**
     * Get priority based on score and threshold
     */
    private getPriority;
    /**
     * Get priority for severity
     */
    private getPriorityForSeverity;
    /**
     * Get highest severity from array
     */
    private getHighestSeverity;
}
