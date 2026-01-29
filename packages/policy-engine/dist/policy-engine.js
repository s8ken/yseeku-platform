"use strict";
/**
 * Policy Composition Engine for SONATE Platform
 *
 * Enables industry-specific trust policy composition and evaluation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyEngine = void 0;
const policy_validator_1 = require("./validation/policy-validator");
const compliance_engine_1 = require("./compliance/compliance-engine");
const industry_policies_1 = require("./policies/industry-policies");
/**
 * Main Policy Engine class
 */
class PolicyEngine {
    constructor() {
        this.validator = new policy_validator_1.PolicyValidator();
        this.complianceEngine = new compliance_engine_1.ComplianceEngine();
        this.industryPolicies = new industry_policies_1.IndustryPolicies();
    }
    /**
     * Compose a custom policy from base policy and customizations
     */
    async composePolicy(request) {
        // Validate request
        this.validator.validateCompositionRequest(request);
        // Get base policy
        const basePolicy = await this.industryPolicies.getBasePolicy(request.basePolicy);
        // Apply industry-specific customizations
        const industryPolicy = await this.industryPolicies.getIndustryPolicy(request.industry);
        // Merge customizations
        const composedPolicy = this.mergePolicies(basePolicy, industryPolicy, request.customizations);
        // Apply compliance requirements
        const complianceEnhancedPolicy = await this.applyComplianceRequirements(composedPolicy, request.complianceRequirements);
        // Apply risk tolerance adjustments
        const riskAdjustedPolicy = this.applyRiskTolerance(complianceEnhancedPolicy, request.riskTolerance);
        // Apply operational constraints
        const finalPolicy = this.applyOperationalConstraints(riskAdjustedPolicy, request.operationalConstraints);
        // Validate final policy
        this.validator.validatePolicy(finalPolicy);
        return finalPolicy;
    }
    /**
     * Evaluate trust score against a policy
     */
    async evaluatePolicy(policy, trustScore, context) {
        const startTime = Date.now();
        // Evaluate principle scores against policy thresholds
        const violations = this.evaluateViolations(policy, trustScore);
        // Assess compliance status
        const complianceStatus = await this.complianceEngine.assessCompliance(policy, trustScore, violations);
        // Generate recommendations
        const recommendations = this.generateRecommendations(policy, violations, complianceStatus);
        // Calculate overall compliance level
        const overallCompliance = this.calculateOverallCompliance(complianceStatus);
        const evaluationTime = Date.now() - startTime;
        return {
            policyId: policy.id,
            policyName: policy.name,
            trustScore: trustScore.overall,
            principleScores: trustScore.principles,
            violations,
            complianceStatus: {
                ...complianceStatus,
                overall: overallCompliance
            },
            recommendations,
            evaluationTime,
            metadata: {
                evaluator: 'PolicyEngine',
                evaluationVersion: '1.0.0',
                processingTime: evaluationTime,
                confidence: this.calculateEvaluationConfidence(trustScore, policy),
                additionalContext: context || {}
            }
        };
    }
    /**
     * Get available industry policies
     */
    async getAvailableIndustries() {
        return this.industryPolicies.getSupportedIndustries();
    }
    /**
     * Get policy templates for an industry
     */
    async getIndustryTemplates(industry) {
        return this.industryPolicies.getIndustryTemplates(industry);
    }
    /**
     * Validate a policy against industry standards
     */
    async validatePolicy(policy) {
        try {
            this.validator.validatePolicy(policy);
            await this.complianceEngine.validatePolicyCompliance(policy);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Merge base policy with industry policy and customizations
     */
    mergePolicies(basePolicy, industryPolicy, customizations) {
        const merged = {
            ...basePolicy,
            id: `${basePolicy.id}-${industryPolicy.industry}-custom`,
            name: `${basePolicy.name} - ${industryPolicy.industry} Custom`,
            industry: industryPolicy.industry,
            description: `Custom policy for ${industryPolicy.industry} based on ${basePolicy.name}`,
            // Merge custom weights
            customWeights: {
                ...basePolicy.customWeights,
                ...industryPolicy.customWeights,
                ...customizations.reduce((acc, custom) => {
                    if (custom.weight !== undefined) {
                        acc[custom.principle] = custom.weight;
                    }
                    return acc;
                }, {})
            },
            // Merge thresholds
            thresholds: {
                ...basePolicy.thresholds,
                ...industryPolicy.thresholds,
                ...customizations.reduce((acc, custom) => {
                    if (custom.threshold !== undefined) {
                        acc.principleScores = {
                            ...acc.principleScores,
                            [custom.principle]: {
                                minimum: custom.threshold,
                                warning: custom.threshold * 1.2,
                                critical: custom.threshold * 0.8
                            }
                        };
                    }
                    return acc;
                }, { principleScores: {} })
            },
            // Combine compliance frameworks
            complianceFrameworks: [
                ...basePolicy.complianceFrameworks,
                ...industryPolicy.complianceFrameworks
            ],
            // Merge custom rules
            customRules: [
                ...basePolicy.customRules,
                ...industryPolicy.customRules,
                ...customizations.flatMap(c => c.rules || [])
            ],
            // Update metadata
            metadata: {
                ...basePolicy.metadata,
                lastUpdated: Date.now(),
                version: `${basePolicy.metadata.version}.${industryPolicy.metadata.version}`,
                tags: [
                    ...basePolicy.metadata.tags,
                    ...industryPolicy.metadata.tags,
                    'custom'
                ]
            }
        };
        return merged;
    }
    /**
     * Apply compliance requirements to policy
     */
    async applyComplianceRequirements(policy, requirements) {
        const enhancedPolicy = { ...policy };
        // Add new compliance frameworks if required
        const newFrameworks = requirements.map(req => ({
            id: req.id,
            name: req.name,
            version: '1.0.0',
            principleMappings: {},
            auditRequirements: [],
            reportingFrequency: 'monthly'
        }));
        enhancedPolicy.complianceFrameworks = [
            ...policy.complianceFrameworks,
            ...newFrameworks
        ];
        return enhancedPolicy;
    }
    /**
     * Apply risk tolerance adjustments
     */
    applyRiskTolerance(policy, riskTolerance) {
        const adjustedPolicy = { ...policy };
        // Adjust thresholds based on risk tolerance
        const riskMultiplier = {
            conservative: 1.2,
            moderate: 1.0,
            aggressive: 0.8
        }[riskTolerance] || 1.0;
        adjustedPolicy.thresholds.trustScore = {
            minimum: policy.thresholds.trustScore.minimum * riskMultiplier,
            warning: policy.thresholds.trustScore.warning * riskMultiplier,
            critical: policy.thresholds.trustScore.critical * riskMultiplier
        };
        return adjustedPolicy;
    }
    /**
     * Apply operational constraints
     */
    applyOperationalConstraints(policy, constraints) {
        const constrainedPolicy = { ...policy };
        // Add constraint-based rules
        const constraintRules = constraints.map(constraint => ({
            id: `constraint-${constraint.type}`,
            name: `Operational Constraint: ${constraint.type}`,
            description: constraint.description,
            type: 'enforcement',
            condition: {
                operator: 'less_than',
                value: 100, // Default constraint value
                timeWindow: { duration: 60000, aggregation: 'average' }
            },
            action: {
                type: 'alert',
                parameters: { message: constraint.description }
            },
            priority: 'medium',
            enabled: true
        }));
        constrainedPolicy.customRules = [
            ...policy.customRules,
            ...constraintRules
        ];
        return constrainedPolicy;
    }
    /**
     * Evaluate policy violations
     */
    evaluateViolations(policy, trustScore) {
        const violations = [];
        // Check overall trust score
        if (trustScore.overall < policy.thresholds.trustScore.minimum) {
            violations.push({
                ruleId: 'trust-score-minimum',
                ruleName: 'Minimum Trust Score',
                principle: 'CONSENT_ARCHITECTURE',
                severity: 'critical',
                description: `Trust score ${trustScore.overall} below minimum ${policy.thresholds.trustScore.minimum}`,
                actualValue: trustScore.overall,
                expectedValue: policy.thresholds.trustScore.minimum,
                timestamp: Date.now(),
                context: {}
            });
        }
        // Check principle scores
        Object.entries(trustScore.principles).forEach(([principle, rawScore]) => {
            const principleKey = principle;
            const score = rawScore;
            const threshold = policy.thresholds.principleScores?.[principleKey];
            if (threshold && score < threshold.minimum) {
                violations.push({
                    ruleId: `principle-${principle}-minimum`,
                    ruleName: `Minimum ${principle} Score`,
                    principle: principleKey,
                    severity: score < threshold.critical ? 'critical' : 'error',
                    description: `${principle} score ${score} below minimum ${threshold.minimum}`,
                    actualValue: score,
                    expectedValue: threshold.minimum,
                    timestamp: Date.now(),
                    context: {}
                });
            }
        });
        return violations;
    }
    /**
     * Generate policy recommendations
     */
    generateRecommendations(policy, violations, complianceStatus) {
        const recommendations = [];
        // Generate recommendations for violations
        violations.forEach(violation => {
            recommendations.push({
                id: `fix-${violation.ruleId}`,
                type: 'configuration',
                priority: violation.severity === 'critical' ? 'urgent' : 'high',
                description: `Address ${violation.ruleName} violation`,
                actionItems: [{
                        id: 'investigate',
                        description: 'Investigate root cause of violation',
                        status: 'pending'
                    }],
                estimatedImpact: {
                    riskReduction: 25,
                    costImpact: 'low',
                    timeToImplement: 1,
                    dependencies: []
                }
            });
        });
        return recommendations;
    }
    /**
     * Calculate overall compliance level
     */
    calculateOverallCompliance(complianceStatus) {
        const frameworkLevels = Object.values(complianceStatus.frameworks);
        if (frameworkLevels.every(level => level === 'compliant')) {
            return 'compliant';
        }
        else if (frameworkLevels.some(level => level === 'non_compliant')) {
            return 'non_compliant';
        }
        else if (frameworkLevels.some(level => level === 'partial')) {
            return 'partial';
        }
        return 'unknown';
    }
    /**
     * Calculate evaluation confidence
     */
    calculateEvaluationConfidence(trustScore, policy) {
        // Base confidence on data completeness and policy coverage
        const principleCoverage = Object.keys(policy.customWeights).length / Object.keys(trustScore.principles).length;
        const dataCompleteness = Object.values(trustScore.principles).filter((score) => score > 0).length / Object.keys(trustScore.principles).length;
        return Math.min(0.95, (principleCoverage + dataCompleteness) / 2);
    }
}
exports.PolicyEngine = PolicyEngine;
