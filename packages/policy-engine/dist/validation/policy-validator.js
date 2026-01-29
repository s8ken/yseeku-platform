"use strict";
/**
 * Policy Validator for SONATE Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyValidator = void 0;
const zod_1 = require("zod");
/**
 * Validation schemas
 */
const PolicyRuleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    type: zod_1.z.enum(['validation', 'enforcement', 'monitoring', 'reporting', 'escalation']),
    condition: zod_1.z.object({
        principle: zod_1.z.enum(['CONSENT_ARCHITECTURE', 'INSPECTION_MANDATE', 'CONTINUOUS_VALIDATION', 'ETHICAL_OVERRIDE', 'RIGHT_TO_DISCONNECT', 'MORAL_RECOGNITION']).optional(),
        operator: zod_1.z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 'outside']),
        value: zod_1.z.number(),
        timeWindow: zod_1.z.object({
            duration: zod_1.z.number(),
            aggregation: zod_1.z.enum(['average', 'minimum', 'maximum', 'sum', 'count', 'percentage'])
        }).optional(),
        aggregation: zod_1.z.enum(['average', 'minimum', 'maximum', 'sum', 'count', 'percentage']).optional()
    }),
    action: zod_1.z.object({
        type: zod_1.z.enum(['alert', 'block', 'log', 'escalate', 'report', 'notify', 'adjust_weights']),
        parameters: zod_1.z.object({}).catchall(zod_1.z.any()),
        escalationLevel: zod_1.z.enum(['level_1', 'level_2', 'level_3', 'level_4', 'level_5']).optional()
    }),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    enabled: zod_1.z.boolean()
});
const IndustryPolicySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    industry: zod_1.z.enum(['healthcare', 'finance', 'government', 'education', 'technology', 'manufacturing', 'retail', 'energy', 'transportation', 'legal']),
    description: zod_1.z.string(),
    basePrinciples: zod_1.z.array(zod_1.z.enum(['CONSENT_ARCHITECTURE', 'INSPECTION_MANDATE', 'CONTINUOUS_VALIDATION', 'ETHICAL_OVERRIDE', 'RIGHT_TO_DISCONNECT', 'MORAL_RECOGNITION'])),
    customWeights: zod_1.z.object({}).catchall(zod_1.z.number()).optional(),
    complianceFrameworks: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        version: zod_1.z.string(),
        principleMappings: zod_1.z.object({}).catchall(zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            description: zod_1.z.string(),
            mandatory: zod_1.z.boolean(),
            evidenceRequired: zod_1.z.boolean(),
            auditFrequency: zod_1.z.enum(['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']),
            penaltyLevel: zod_1.z.enum(['none', 'warning', 'fine', 'suspension', 'termination'])
        }))),
        auditRequirements: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            description: zod_1.z.string(),
            frequency: zod_1.z.enum(['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']),
            scope: zod_1.z.array(zod_1.z.string()),
            evidenceRequired: zod_1.z.array(zod_1.z.object({
                type: zod_1.z.enum(['log', 'report', 'screenshot', 'recording', 'document', 'metrics', 'configuration']),
                description: zod_1.z.string(),
                retention: zod_1.z.enum(['30_days', '90_days', '1_year', '3_years', '7_years', 'permanent']),
                format: zod_1.z.array(zod_1.z.string())
            }))
        })),
        reportingFrequency: zod_1.z.enum(['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly'])
    })),
    thresholds: zod_1.z.object({
        trustScore: zod_1.z.object({
            minimum: zod_1.z.number(),
            warning: zod_1.z.number(),
            critical: zod_1.z.number()
        }),
        principleScores: zod_1.z.object({}).catchall(zod_1.z.object({
            minimum: zod_1.z.number(),
            warning: zod_1.z.number(),
            critical: zod_1.z.number()
        })).optional(),
        responseTime: zod_1.z.object({
            acceptable: zod_1.z.number(),
            warning: zod_1.z.number(),
            critical: zod_1.z.number()
        }),
        errorRate: zod_1.z.object({
            acceptable: zod_1.z.number(),
            warning: zod_1.z.number(),
            critical: zod_1.z.number()
        })
    }),
    customRules: zod_1.z.array(PolicyRuleSchema),
    metadata: zod_1.z.object({
        version: zod_1.z.string(),
        lastUpdated: zod_1.z.number(),
        author: zod_1.z.string(),
        reviewDate: zod_1.z.number(),
        tags: zod_1.z.array(zod_1.z.string()),
        riskLevel: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        geographicScope: zod_1.z.enum(['global', 'region', 'country', 'state', 'city']),
        dataTypes: zod_1.z.array(zod_1.z.string()),
        integrationPoints: zod_1.z.array(zod_1.z.string())
    })
});
const PolicyCompositionRequestSchema = zod_1.z.object({
    basePolicy: zod_1.z.string(),
    industry: zod_1.z.enum(['healthcare', 'finance', 'government', 'education', 'technology', 'manufacturing', 'retail', 'energy', 'transportation', 'legal']),
    customizations: zod_1.z.array(zod_1.z.object({
        principle: zod_1.z.enum(['CONSENT_ARCHITECTURE', 'INSPECTION_MANDATE', 'CONTINUOUS_VALIDATION', 'ETHICAL_OVERRIDE', 'RIGHT_TO_DISCONNECT', 'MORAL_RECOGNITION']),
        weight: zod_1.z.number().optional(),
        threshold: zod_1.z.number().optional(),
        rules: zod_1.z.array(PolicyRuleSchema).optional()
    })),
    complianceRequirements: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        mandatory: zod_1.z.boolean(),
        evidenceRequired: zod_1.z.boolean(),
        auditFrequency: zod_1.z.enum(['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']),
        penaltyLevel: zod_1.z.enum(['none', 'warning', 'fine', 'suspension', 'termination'])
    })),
    riskTolerance: zod_1.z.enum(['conservative', 'moderate', 'aggressive']),
    operationalConstraints: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['performance', 'cost', 'regulatory', 'technical', 'operational']),
        description: zod_1.z.string(),
        impact: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        mitigation: zod_1.z.string().optional()
    }))
});
/**
 * Policy Validator class
 */
class PolicyValidator {
    /**
     * Validate policy composition request
     */
    validateCompositionRequest(request) {
        try {
            PolicyCompositionRequestSchema.parse(request);
            // Additional business logic validation
            this.validateBusinessRules(request);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new Error(`Invalid policy composition request: ${error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
            }
            throw error;
        }
    }
    /**
     * Validate complete policy
     */
    validatePolicy(policy) {
        try {
            IndustryPolicySchema.parse(policy);
            // Additional business logic validation
            this.validatePolicyBusinessRules(policy);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new Error(`Invalid policy: ${error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
            }
            throw error;
        }
    }
    /**
     * Validate policy weights
     */
    validateWeights(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => (sum ?? 0) + (weight ?? 0), 0) ?? 0;
        if (totalWeight > 1.0) {
            throw new Error(`Total weight (${totalWeight}) cannot exceed 1.0`);
        }
        if (totalWeight < 0.1) {
            throw new Error(`Total weight (${totalWeight}) must be at least 0.1`);
        }
        Object.entries(weights).forEach(([principle, weight]) => {
            const w = weight ?? 0;
            if (w < 0 || w > 1) {
                throw new Error(`Weight for principle ${principle} (${w}) must be between 0 and 1`);
            }
        });
    }
    /**
     * Validate thresholds
     */
    validateThresholds(thresholds) {
        // Validate trust score thresholds
        if (thresholds.trustScore) {
            const { minimum, warning, critical } = thresholds.trustScore;
            if (minimum > warning || warning > critical) {
                throw new Error('Trust score thresholds must be: minimum <= warning <= critical');
            }
            if (minimum < 0 || critical > 10) {
                throw new Error('Trust score thresholds must be between 0 and 10');
            }
        }
        // Validate principle score thresholds
        if (thresholds.principleScores) {
            Object.entries(thresholds.principleScores).forEach(([principle, scores]) => {
                const { minimum, warning, critical } = scores;
                if (minimum > warning || warning > critical) {
                    throw new Error(`Principle ${principle} thresholds must be: minimum <= warning <= critical`);
                }
                if (minimum < 0 || critical > 10) {
                    throw new Error(`Principle ${principle} thresholds must be between 0 and 10`);
                }
            });
        }
    }
    /**
     * Validate compliance frameworks
     */
    validateComplianceFrameworks(frameworks) {
        frameworks.forEach(framework => {
            if (!framework.id || !framework.name || !framework.version) {
                throw new Error('Compliance framework must have id, name, and version');
            }
            if (!framework.principleMappings || Object.keys(framework.principleMappings).length === 0) {
                throw new Error('Compliance framework must have principle mappings');
            }
        });
    }
    /**
     * Validate custom rules
     */
    validateCustomRules(rules) {
        rules.forEach(rule => {
            if (!rule.id || !rule.name || !rule.type) {
                throw new Error('Custom rule must have id, name, and type');
            }
            if (rule.condition && !rule.condition.operator) {
                throw new Error('Custom rule condition must have an operator');
            }
            if (rule.action && !rule.action.type) {
                throw new Error('Custom rule action must have a type');
            }
        });
    }
    /**
     * Additional business rules validation
     */
    validateBusinessRules(request) {
        // Validate industry-specific requirements
        this.validateIndustryRequirements(request.industry, request.customizations);
        // Validate risk tolerance vs constraints
        this.validateRiskToleranceConstraints(request.riskTolerance, request.operationalConstraints);
        // Validate compliance requirements feasibility
        this.validateComplianceFeasibility(request.complianceRequirements, request.customizations);
    }
    /**
     * Validate industry-specific requirements
     */
    validateIndustryRequirements(industry, customizations) {
        const industryRequirements = {
            healthcare: ['CONSENT_ARCHITECTURE', 'ETHICAL_OVERRIDE'],
            finance: ['INSPECTION_MANDATE', 'CONTINUOUS_VALIDATION'],
            government: ['RIGHT_TO_DISCONNECT', 'MORAL_RECOGNITION'],
            education: ['CONSENT_ARCHITECTURE', 'INSPECTION_MANDATE'],
            technology: ['CONTINUOUS_VALIDATION', 'ETHICAL_OVERRIDE'],
            manufacturing: ['INSPECTION_MANDATE', 'RIGHT_TO_DISCONNECT'],
            retail: ['CONSENT_ARCHITECTURE', 'CONTINUOUS_VALIDATION'],
            energy: ['ETHICAL_OVERRIDE', 'MORAL_RECOGNITION'],
            transportation: ['RIGHT_TO_DISCONNECT', 'CONTINUOUS_VALIDATION'],
            legal: ['INSPECTION_MANDATE', 'ETHICAL_OVERRIDE']
        };
        const requiredPrinciples = industryRequirements[industry] || [];
        const providedPrinciples = customizations.map(c => c.principle);
        const missingPrinciples = requiredPrinciples.filter(principle => !providedPrinciples.includes(principle));
        if (missingPrinciples.length > 0) {
            throw new Error(`Industry ${industry} requires principles: ${missingPrinciples.join(', ')}`);
        }
    }
    /**
     * Validate risk tolerance vs constraints
     */
    validateRiskToleranceConstraints(riskTolerance, constraints) {
        const highImpactConstraints = constraints.filter(c => c.impact === 'high' || c.impact === 'critical');
        if (riskTolerance === 'aggressive' && highImpactConstraints.length > 0) {
            throw new Error('Aggressive risk tolerance not compatible with high/critical impact constraints');
        }
    }
    /**
     * Validate compliance requirements feasibility
     */
    validateComplianceFeasibility(requirements, customizations) {
        const mandatoryRequirements = requirements.filter(r => r.mandatory);
        const providedCapabilities = customizations.flatMap(c => c.rules || []);
        if (mandatoryRequirements.length > providedCapabilities.length) {
            throw new Error(`Insufficient custom rules to meet ${mandatoryRequirements.length} mandatory compliance requirements`);
        }
    }
    /**
     * Validate policy business rules
     */
    validatePolicyBusinessRules(policy) {
        // Validate weights
        if (policy.customWeights) {
            this.validateWeights(policy.customWeights);
        }
        // Validate thresholds
        this.validateThresholds(policy.thresholds);
        // Validate compliance frameworks
        this.validateComplianceFrameworks(policy.complianceFrameworks);
        // Validate custom rules
        this.validateCustomRules(policy.customRules);
        // Validate industry-specific rules
        this.validateIndustryRules(policy);
    }
    /**
     * Validate industry-specific rules
     */
    validateIndustryRules(policy) {
        const industryRules = {
            healthcare: {
                minEthicalWeight: 0.3,
                requiredFrameworks: ['HIPAA', 'FDA'],
                maxResponseTime: 5000 // 5 seconds
            },
            finance: {
                minInspectionWeight: 0.25,
                requiredFrameworks: ['SOX', 'PCI-DSS'],
                maxResponseTime: 2000 // 2 seconds
            },
            government: {
                minConsentWeight: 0.2,
                requiredFrameworks: ['FISMA', 'FedRAMP'],
                maxResponseTime: 10000 // 10 seconds
            }
        };
        const rules = industryRules[policy.industry];
        if (rules) {
            // Validate minimum weights
            if (policy.customWeights) {
                Object.entries(rules).forEach(([key, value]) => {
                    if (key.includes('Weight') && policy.customWeights) {
                        const principle = key.replace('Weight', '').toUpperCase();
                        const weight = policy.customWeights[principle];
                        if (weight !== undefined && weight < value) {
                            throw new Error(`Industry ${policy.industry} requires ${principle} weight >= ${value}`);
                        }
                    }
                });
            }
            // Validate required frameworks
            const providedFrameworks = policy.complianceFrameworks.map(f => f.name);
            const missingFrameworks = rules.requiredFrameworks.filter(framework => !providedFrameworks.includes(framework));
            if (missingFrameworks.length > 0) {
                throw new Error(`Industry ${policy.industry} requires compliance frameworks: ${missingFrameworks.join(', ')}`);
            }
            // Validate response time
            if (policy.thresholds.responseTime &&
                policy.thresholds.responseTime.acceptable > rules.maxResponseTime) {
                throw new Error(`Industry ${policy.industry} requires response time <= ${rules.maxResponseTime}ms`);
            }
        }
    }
}
exports.PolicyValidator = PolicyValidator;
