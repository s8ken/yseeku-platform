/**
 * Policy Composition Engine for SONATE Platform
 *
 * Enables industry-specific trust policy composition and evaluation
 */
import { IndustryPolicy, PolicyEvaluationResult, PolicyCompositionRequest, IndustryType, TrustScore } from './types';
/**
 * Main Policy Engine class
 */
export declare class PolicyEngine {
    private validator;
    private complianceEngine;
    private industryPolicies;
    constructor();
    /**
     * Compose a custom policy from base policy and customizations
     */
    composePolicy(request: PolicyCompositionRequest): Promise<IndustryPolicy>;
    /**
     * Evaluate trust score against a policy
     */
    evaluatePolicy(policy: IndustryPolicy, trustScore: TrustScore, context?: Record<string, any>): Promise<PolicyEvaluationResult>;
    /**
     * Get available industry policies
     */
    getAvailableIndustries(): Promise<IndustryType[]>;
    /**
     * Get policy templates for an industry
     */
    getIndustryTemplates(industry: IndustryType): Promise<IndustryPolicy[]>;
    /**
     * Validate a policy against industry standards
     */
    validatePolicy(policy: IndustryPolicy): Promise<boolean>;
    /**
     * Merge base policy with industry policy and customizations
     */
    private mergePolicies;
    /**
     * Apply compliance requirements to policy
     */
    private applyComplianceRequirements;
    /**
     * Apply risk tolerance adjustments
     */
    private applyRiskTolerance;
    /**
     * Apply operational constraints
     */
    private applyOperationalConstraints;
    /**
     * Evaluate policy violations
     */
    private evaluateViolations;
    /**
     * Generate policy recommendations
     */
    private generateRecommendations;
    /**
     * Calculate overall compliance level
     */
    private calculateOverallCompliance;
    /**
     * Calculate evaluation confidence
     */
    private calculateEvaluationConfidence;
}
