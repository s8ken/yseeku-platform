/**
 * Policy Validator for SONATE Platform
 */
import { IndustryPolicy, PolicyCompositionRequest, TrustPrincipleKey } from '../types';
/**
 * Policy Validator class
 */
export declare class PolicyValidator {
    /**
     * Validate policy composition request
     */
    validateCompositionRequest(request: PolicyCompositionRequest): void;
    /**
     * Validate complete policy
     */
    validatePolicy(policy: IndustryPolicy): void;
    /**
     * Validate policy weights
     */
    validateWeights(weights: Partial<Record<TrustPrincipleKey, number>>): void;
    /**
     * Validate thresholds
     */
    validateThresholds(thresholds: any): void;
    /**
     * Validate compliance frameworks
     */
    validateComplianceFrameworks(frameworks: any[]): void;
    /**
     * Validate custom rules
     */
    validateCustomRules(rules: any[]): void;
    /**
     * Additional business rules validation
     */
    private validateBusinessRules;
    /**
     * Validate industry-specific requirements
     */
    private validateIndustryRequirements;
    /**
     * Validate risk tolerance vs constraints
     */
    private validateRiskToleranceConstraints;
    /**
     * Validate compliance requirements feasibility
     */
    private validateComplianceFeasibility;
    /**
     * Validate policy business rules
     */
    private validatePolicyBusinessRules;
    /**
     * Validate industry-specific rules
     */
    private validateIndustryRules;
}
