/**
 * Policy Runtime Interfaces
 * 
 * Defines the contract for AI governance policies
 */

import type { TrustReceipt } from '@sonate/schemas';

export type PolicySeverity = 'warn' | 'block' | 'escalate';
export type PolicyAction = 'ALERT' | 'ANNOTATE' | 'BLOCK' | 'ESCALATE' | 'REQUIRE_HUMAN_REVIEW';
export type ConstraintViolationType = 
  | 'PII_DETECTED'
  | 'TRUTH_DEBT_EXCEEDED'
  | 'COMPLIANCE_BOUNDARY_VIOLATED'
  | 'POLICY_CONSTRAINT_FAILED'
  | 'CUSTOM_VIOLATION';

/**
 * Policy constraint definition
 */
export interface PolicyConstraint {
  id: string;
  name: string;
  description: string;
  type: string;
  severity: PolicySeverity;
  enabled: boolean;
  config: Record<string, any>;
}

/**
 * AI Policy definition
 */
export interface AIPolicy {
  id: string;
  name: string;
  description: string;
  version: string;
  constraints: PolicyConstraint[];
  severity: PolicySeverity;
  auditTrail: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Constraint violation result
 */
export interface ConstraintViolation {
  id: string;
  constraint_id: string;
  constraint_name: string;
  violation_type: ConstraintViolationType;
  severity: PolicySeverity;
  message: string;
  evidence: Record<string, any>;
  receipt_annotation: string;
  detected_at: string;
  remediation_suggested?: string;
}

/**
 * Policy enforcement result for a single receipt
 */
export interface PolicyEnforcementResult {
  receipt_id: string;
  policy_id: string;
  passed: boolean;
  violations: ConstraintViolation[];
  status: 'CLEAR' | 'FLAGGED' | 'BLOCKED';
  human_review_required: boolean;
  recommended_action: PolicyAction;
  enforcement_timestamp: string;
  duration_ms: number;
}

/**
 * Updated receipt with policy enforcement
 */
export interface EnforcedTrustReceipt extends TrustReceipt {
  policy_enforcement: {
    policies_evaluated: string[];
    violations: ConstraintViolation[];
    status: 'CLEAR' | 'FLAGGED' | 'BLOCKED';
    human_review_required: boolean;
    enforcement_timestamp: string;
    actions_taken: PolicyAction[];
  };
}

/**
 * Policy evaluation context
 */
export interface PolicyEvaluationContext {
  receipt: TrustReceipt;
  policies: AIPolicy[];
  agent_did: string;
  evaluation_timestamp: string;
  include_remediation: boolean;
  strict_mode: boolean; // true = fail on first violation, false = evaluate all
}

/**
 * Batch policy evaluation result
 */
export interface BatchPolicyEvaluationResult {
  total_receipts: number;
  total_policies: number;
  evaluation_timestamp: string;
  duration_ms: number;
  results: PolicyEnforcementResult[];
  summary: {
    passed: number;
    flagged: number;
    blocked: number;
    total_violations: number;
    critical_violations: number;
    requires_review: number;
  };
  recommendations: string[];
}

/**
 * Policy template for predefined policies
 */
export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  domain: 'healthcare' | 'financial' | 'legal' | 'general';
  constraints: PolicyConstraint[];
  default_enabled: boolean;
}

/**
 * Review queue item
 */
export interface ReviewQueueItem {
  id: string;
  receipt_id: string;
  policy_id: string;
  violation_count: number;
  critical_violation: boolean;
  flagged_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  notes?: string;
  resolution?: string;
}
