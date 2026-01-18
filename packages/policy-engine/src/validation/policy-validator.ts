/**
 * Policy Validator for SONATE Platform
 */

import { z } from 'zod';
import { 
  IndustryPolicy, 
  PolicyCompositionRequest, 
  IndustryType,
  TrustPrincipleKey 
} from '../types';

/**
 * Validation schemas
 */
const PolicyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['validation', 'enforcement', 'monitoring', 'reporting', 'escalation']),
  condition: z.object({
    principle: z.enum(['CONSENT_ARCHITECTURE', 'INSPECTION_MANDATE', 'CONTINUOUS_VALIDATION', 'ETHICAL_OVERRIDE', 'RIGHT_TO_DISCONNECT', 'MORAL_RECOGNITION']).optional(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 'outside']),
    value: z.number(),
    timeWindow: z.object({
      duration: z.number(),
      aggregation: z.enum(['average', 'minimum', 'maximum', 'sum', 'count', 'percentage'])
    }).optional(),
    aggregation: z.enum(['average', 'minimum', 'maximum', 'sum', 'count', 'percentage']).optional()
  }),
  action: z.object({
    type: z.enum(['alert', 'block', 'log', 'escalate', 'report', 'notify', 'adjust_weights']),
    parameters: z.record(z.any()),
    escalationLevel: z.enum(['level_1', 'level_2', 'level_3', 'level_4', 'level_5']).optional()
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  enabled: z.boolean()
});

const IndustryPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.enum(['healthcare', 'finance', 'government', 'education', 'technology', 'manufacturing', 'retail', 'energy', 'transportation', 'legal']),
  description: z.string(),
  basePrinciples: z.array(z.enum(['CONSENT_ARCHITECTURE', 'INSPECTION_MANDATE', 'CONTINUOUS_VALIDATION', 'ETHICAL_OVERRIDE', 'RIGHT_TO_DISCONNECT', 'MORAL_RECOGNITION'])),
  customWeights: z.record(z.number()).optional(),
  complianceFrameworks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    principleMappings: z.record(z.array(z.object({
      id: z.string(),
      description: z.string(),
      mandatory: z.boolean(),
      evidenceRequired: z.boolean(),
      auditFrequency: z.enum(['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']),
      penaltyLevel: z.enum(['none', 'warning', 'fine', 'suspension', 'termination'])
    }))),
    auditRequirements: z.array(z.object({
      id: z.string(),
      description: z.string(),
      frequency: z.enum(['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']),
      scope: z.array(z.string()),
      evidenceRequired: z.array(z.object({
        type: z.enum(['log', 'report', 'screenshot', 'recording', 'document', 'metrics', 'configuration']),
        description: z.string(),
        retention: z.enum(['30_days', '90_days', '1_year', '3_years', '7_years', 'permanent']),
        format: z.array(z.string())
      }))
    })),
    reportingFrequency: z.enum(['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly'])
  })),
  thresholds: z.object({
    trustScore: z.object({
      minimum: z.number(),
      warning: z.number(),
      critical: z.number()
    }),
    principleScores: z.record(z.object({
      minimum: z.number(),
      warning: z.number(),
      critical: z.number()
    })).optional(),
    responseTime: z.object({
      acceptable: z.number(),
      warning: z.number(),
      critical: z.number()
    }),
    errorRate: z.object({
      acceptable: z.number(),
      warning: z.number(),
      critical: z.number()
    })
  }),
  customRules: z.array(PolicyRuleSchema),
  metadata: z.object({
    version: z.string(),
    lastUpdated: z.number(),
    author: z.string(),
    reviewDate: z.number(),
    tags: z.array(z.string()),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    geographicScope: z.enum(['global', 'region', 'country', 'state', 'city']),
    dataTypes: z.array(z.string()),
    integrationPoints: z.array(z.string())
  })
});

const PolicyCompositionRequestSchema = z.object({
  basePolicy: z.string(),
  industry: z.enum(['healthcare', 'finance', 'government', 'education', 'technology', 'manufacturing', 'retail', 'energy', 'transportation', 'legal']),
  customizations: z.array(z.object({
    principle: z.enum(['CONSENT_ARCHITECTURE', 'INSPECTION_MANDATE', 'CONTINUOUS_VALIDATION', 'ETHICAL_OVERRIDE', 'RIGHT_TO_DISCONNECT', 'MORAL_RECOGNITION']),
    weight: z.number().optional(),
    threshold: z.number().optional(),
    rules: z.array(PolicyRuleSchema).optional()
  })),
  complianceRequirements: z.array(z.object({
    id: z.string(),
    name: z.string(),
    mandatory: z.boolean(),
    evidenceRequired: z.boolean(),
    auditFrequency: z.enum(['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']),
    penaltyLevel: z.enum(['none', 'warning', 'fine', 'suspension', 'termination'])
  })),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  operationalConstraints: z.array(z.object({
    type: z.enum(['performance', 'cost', 'regulatory', 'technical', 'operational']),
    description: z.string(),
    impact: z.enum(['low', 'medium', 'high', 'critical']),
    mitigation: z.string().optional()
  }))
});

/**
 * Policy Validator class
 */
export class PolicyValidator {
  /**
   * Validate policy composition request
   */
  validateCompositionRequest(request: PolicyCompositionRequest): void {
    try {
      PolicyCompositionRequestSchema.parse(request);
      
      // Additional business logic validation
      this.validateBusinessRules(request);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid policy composition request: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate complete policy
   */
  validatePolicy(policy: IndustryPolicy): void {
    try {
      IndustryPolicySchema.parse(policy);
      
      // Additional business logic validation
      this.validatePolicyBusinessRules(policy);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid policy: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate policy weights
   */
  validateWeights(weights: Partial<Record<TrustPrincipleKey, number>>): void {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight > 1.0) {
      throw new Error(`Total weight (${totalWeight}) cannot exceed 1.0`);
    }
    
    if (totalWeight < 0.1) {
      throw new Error(`Total weight (${totalWeight}) must be at least 0.1`);
    }
    
    Object.entries(weights).forEach(([principle, weight]) => {
      if (weight < 0 || weight > 1) {
        throw new Error(`Weight for principle ${principle} (${weight}) must be between 0 and 1`);
      }
    });
  }

  /**
   * Validate thresholds
   */
  validateThresholds(thresholds: any): void {
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
      Object.entries(thresholds.principleScores).forEach(([principle, scores]: [string, any]) => {
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
  validateComplianceFrameworks(frameworks: any[]): void {
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
  validateCustomRules(rules: any[]): void {
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
  private validateBusinessRules(request: PolicyCompositionRequest): void {
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
  private validateIndustryRequirements(industry: IndustryType, customizations: any[]): void {
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
    
    const missingPrinciples = requiredPrinciples.filter(principle => !providedPrinciples.includes(principle as TrustPrincipleKey));
    
    if (missingPrinciples.length > 0) {
      throw new Error(`Industry ${industry} requires principles: ${missingPrinciples.join(', ')}`);
    }
  }

  /**
   * Validate risk tolerance vs constraints
   */
  private validateRiskToleranceConstraints(riskTolerance: string, constraints: any[]): void {
    const highImpactConstraints = constraints.filter(c => c.impact === 'high' || c.impact === 'critical');
    
    if (riskTolerance === 'aggressive' && highImpactConstraints.length > 0) {
      throw new Error('Aggressive risk tolerance not compatible with high/critical impact constraints');
    }
  }

  /**
   * Validate compliance requirements feasibility
   */
  private validateComplianceFeasibility(requirements: any[], customizations: any[]): void {
    const mandatoryRequirements = requirements.filter(r => r.mandatory);
    const providedCapabilities = customizations.flatMap(c => c.rules || []);
    
    if (mandatoryRequirements.length > providedCapabilities.length) {
      throw new Error(`Insufficient custom rules to meet ${mandatoryRequirements.length} mandatory compliance requirements`);
    }
  }

  /**
   * Validate policy business rules
   */
  private validatePolicyBusinessRules(policy: IndustryPolicy): void {
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
  private validateIndustryRules(policy: IndustryPolicy): void {
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

    const rules = industryRules[policy.industry as keyof typeof industryRules];
    
    if (rules) {
      // Validate minimum weights
      if (policy.customWeights) {
        Object.entries(rules).forEach(([key, value]) => {
          if (key.includes('Weight') && policy.customWeights) {
            const principle = key.replace('Weight', '').toUpperCase();
            const weight = policy.customWeights[principle as TrustPrincipleKey];
            
            if (weight && weight < (value as number)) {
              throw new Error(`Industry ${policy.industry} requires ${principle} weight >= ${value}`);
            }
          }
        });
      }
      
      // Validate required frameworks
      const providedFrameworks = policy.complianceFrameworks.map(f => f.name);
      const missingFrameworks = (rules.requiredFrameworks as string[]).filter(
        framework => !providedFrameworks.includes(framework)
      );
      
      if (missingFrameworks.length > 0) {
        throw new Error(`Industry ${policy.industry} requires compliance frameworks: ${missingFrameworks.join(', ')}`);
      }
      
      // Validate response time
      if (policy.thresholds.responseTime && 
          policy.thresholds.responseTime.acceptable > (rules.maxResponseTime as number)) {
        throw new Error(`Industry ${policy.industry} requires response time <= ${rules.maxResponseTime}ms`);
      }
    }
  }
}
