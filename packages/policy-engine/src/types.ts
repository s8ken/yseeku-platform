/**
 * Policy Engine Types for SONATE Platform
 */

import { TrustPrincipleKey, TrustScore } from '@sonate/core';

/**
 * Industry-specific policy configuration
 */
export interface IndustryPolicy {
  id: string;
  name: string;
  industry: IndustryType;
  description: string;
  basePrinciples: TrustPrincipleKey[];
  customWeights: Partial<Record<TrustPrincipleKey, number>>;
  complianceFrameworks: ComplianceFramework[];
  thresholds: PolicyThresholds;
  customRules: PolicyRule[];
  metadata: IndustryPolicyMetadata;
}

/**
 * Supported industry types
 */
export type IndustryType = 
  | 'healthcare'
  | 'finance'
  | 'government'
  | 'education'
  | 'technology'
  | 'manufacturing'
  | 'retail'
  | 'energy'
  | 'transportation'
  | 'legal';

/**
 * Compliance framework mappings
 */
export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  principleMappings: Record<TrustPrincipleKey, ComplianceRequirement[]>;
  auditRequirements: AuditRequirement[];
  reportingFrequency: ReportingFrequency;
}

/**
 * Compliance requirement for a trust principle
 */
export interface ComplianceRequirement {
  id: string;
  description: string;
  mandatory: boolean;
  evidenceRequired: boolean;
  auditFrequency: AuditFrequency;
  penaltyLevel: PenaltyLevel;
}

/**
 * Policy thresholds for different scenarios
 */
export interface PolicyThresholds {
  trustScore: {
    minimum: number;
    warning: number;
    critical: number;
  };
  principleScores: Partial<Record<TrustPrincipleKey, {
    minimum: number;
    warning: number;
    critical: number;
  }>>;
  responseTime: {
    acceptable: number; // milliseconds
    warning: number;
    critical: number;
  };
  errorRate: {
    acceptable: number; // percentage
    warning: number;
    critical: number;
  };
}

/**
 * Custom policy rules
 */
export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  condition: RuleCondition;
  action: RuleAction;
  priority: RulePriority;
  enabled: boolean;
}

/**
 * Rule types
 */
export type RuleType = 
  | 'validation'
  | 'enforcement'
  | 'monitoring'
  | 'reporting'
  | 'escalation';

/**
 * Rule conditions
 */
export interface RuleCondition {
  principle?: TrustPrincipleKey;
  operator: ComparisonOperator;
  value: number;
  timeWindow?: TimeWindow;
  aggregation?: AggregationType;
}

/**
 * Rule actions
 */
export interface RuleAction {
  type: ActionType;
  parameters: Record<string, any>;
  escalationLevel?: EscalationLevel;
}

/**
 * Comparison operators
 */
export type ComparisonOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'between'
  | 'outside';

/**
 * Time windows for rules
 */
export interface TimeWindow {
  duration: number; // milliseconds
  aggregation: AggregationType;
}

/**
 * Aggregation types
 */
export type AggregationType = 
  | 'average'
  | 'minimum'
  | 'maximum'
  | 'sum'
  | 'count'
  | 'percentage';

/**
 * Action types
 */
export type ActionType = 
  | 'alert'
  | 'block'
  | 'log'
  | 'escalate'
  | 'report'
  | 'notify'
  | 'adjust_weights';

/**
 * Rule priorities
 */
export type RulePriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Escalation levels
 */
export type EscalationLevel = 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5';

/**
 * Industry policy metadata
 */
export interface IndustryPolicyMetadata {
  version: string;
  lastUpdated: number;
  author: string;
  reviewDate: number;
  tags: string[];
  riskLevel: RiskLevel;
  geographicScope: GeographicScope;
  dataTypes: string[];
  integrationPoints: string[];
}

/**
 * Risk levels
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Geographic scopes
 */
export type GeographicScope = 'global' | 'region' | 'country' | 'state' | 'city';

/**
 * Audit frequencies
 */
export type AuditFrequency = 
  | 'real_time'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';

/**
 * Reporting frequencies
 */
export type ReportingFrequency = 
  | 'real_time'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly';

/**
 * Penalty levels
 */
export type PenaltyLevel = 'none' | 'warning' | 'fine' | 'suspension' | 'termination';

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  policyId: string;
  policyName: string;
  trustScore: number;
  principleScores: Record<TrustPrincipleKey, number>;
  violations: PolicyViolation[];
  complianceStatus: ComplianceStatus;
  recommendations: PolicyRecommendation[];
  evaluationTime: number;
  metadata: EvaluationMetadata;
}

/**
 * Policy violations
 */
export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  principle: TrustPrincipleKey;
  severity: ViolationSeverity;
  description: string;
  actualValue: number;
  expectedValue: number;
  timestamp: number;
  context: ViolationContext;
}

/**
 * Violation severity
 */
export type ViolationSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Violation context
 */
export interface ViolationContext {
  interactionId?: string;
  agentId?: string;
  tenant?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Compliance status
 */
export interface ComplianceStatus {
  overall: ComplianceLevel;
  frameworks: Record<string, ComplianceLevel>;
  lastAudit: number;
  nextAudit: number;
  openIssues: number;
  criticalIssues: number;
}

/**
 * Compliance levels
 */
export type ComplianceLevel = 'compliant' | 'partial' | 'non_compliant' | 'unknown';

/**
 * Policy recommendations
 */
export interface PolicyRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  description: string;
  actionItems: ActionItem[];
  estimatedImpact: ImpactAssessment;
  deadline?: number;
}

/**
 * Recommendation types
 */
export type RecommendationType = 
  | 'configuration'
  | 'process'
  | 'training'
  | 'monitoring'
  | 'reporting';

/**
 * Recommendation priorities
 */
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Action items
 */
export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  status: ActionStatus;
  dueDate?: number;
  estimatedEffort?: number; // hours
}

/**
 * Action status
 */
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

/**
 * Impact assessment
 */
export interface ImpactAssessment {
  riskReduction: number; // percentage
  costImpact: CostImpact;
  timeToImplement: number; // days
  dependencies: string[];
}

/**
 * Cost impact
 */
export type CostImpact = 'none' | 'low' | 'medium' | 'high' | 'unknown';

/**
 * Evaluation metadata
 */
export interface EvaluationMetadata {
  evaluator: string;
  evaluationVersion: string;
  processingTime: number;
  confidence: number;
  additionalContext: Record<string, any>;
}

/**
 * Policy composition request
 */
export interface PolicyCompositionRequest {
  basePolicy: string;
  industry: IndustryType;
  customizations: PolicyCustomization[];
  complianceRequirements: ComplianceRequirement[];
  riskTolerance: RiskTolerance;
  operationalConstraints: OperationalConstraint[];
}

/**
 * Policy customizations
 */
export interface PolicyCustomization {
  principle: TrustPrincipleKey;
  weight: number;
  threshold: number;
  rules: PolicyRule[];
}

/**
 * Risk tolerance levels
 */
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

/**
 * Operational constraints
 */
export interface OperationalConstraint {
  type: ConstraintType;
  description: string;
  impact: ConstraintImpact;
  mitigation?: string;
}

/**
 * Constraint types
 */
export type ConstraintType = 
  | 'performance'
  | 'cost'
  | 'regulatory'
  | 'technical'
  | 'operational';

/**
 * Constraint impacts
 */
export type ConstraintImpact = 'low' | 'medium' | 'high' | 'critical';

/**
 * Audit requirement
 */
export interface AuditRequirement {
  id: string;
  description: string;
  frequency: AuditFrequency;
  scope: string[];
  evidenceRequired: EvidenceRequirement[];
}

/**
 * Evidence requirement
 */
export interface EvidenceRequirement {
  type: EvidenceType;
  description: string;
  retention: RetentionPeriod;
  format: string[];
}

/**
 * Evidence types
 */
export type EvidenceType = 
  | 'log'
  | 'report'
  | 'screenshot'
  | 'recording'
  | 'document'
  | 'metrics'
  | 'configuration';

/**
 * Retention periods
 */
export type RetentionPeriod = 
  | '30_days'
  | '90_days'
  | '1_year'
  | '3_years'
  | '7_years'
  | 'permanent';
