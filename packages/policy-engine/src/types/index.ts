/**
 * Policy Engine Types
 * Core data structures for SYMBI principle enforcement
 */

import { z } from 'zod';
import { TrustReceipt } from '@sonate/schemas';

/**
 * SYMBI Principles
 * The constitution governing AI behavior
 */
export enum SymbiPrinciple {
  SINCERITY = 'sincerity',
  METICULOUSNESS = 'meticulousness',
  BENEVOLENCE = 'benevolence',
  INTEGRITY = 'integrity',
}

/**
 * Policy Decision
 * What action to take based on policy evaluation
 */
export enum PolicyDecision {
  ALLOW = 'allow',
  ANNOTATE = 'annotate',
  BLOCK = 'block',
  ESCALATE = 'escalate',
  OVERRIDE = 'override',
}

/**
 * Severity Levels
 */
export enum ConstraintSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Constraint Definition
 */
export interface Constraint {
  id: string;
  name: string;
  principle: SymbiPrinciple;
  description: string;
  threshold?: number;
  action: PolicyDecision;
  severity: ConstraintSeverity;
  categories?: string[];
  enabled: boolean;
}

/**
 * Policy Definition
 */
export interface Policy {
  id: string;
  name: string;
  version: string;
  description?: string;
  created_at: string;
  updated_at: string;
  principles: {
    [key in SymbiPrinciple]?: {
      enabled: boolean;
      constraints: Constraint[];
    };
  };
  active: boolean;
}

/**
 * Claim in a response
 */
export interface Claim {
  text: string;
  classification: 'verifiable' | 'unverifiable' | 'opinion' | 'contextual';
  confidence: number;
  source?: string;
  evidence?: string[];
}

/**
 * Truth Debt Calculation
 */
export interface TruthDebtAnalysis {
  total_claims: number;
  verifiable: number;
  unverifiable: number;
  opinion: number;
  contextual: number;
  truth_debt: number; // 0-1
  claims: Claim[];
  annotations: string[];
}

/**
 * Coherence Analysis
 */
export interface CoherenceAnalysis {
  agent_did: string;
  current_score: number; // 0-1
  history_length: number;
  anomalies: Anomaly[];
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * Anomaly Detection
 */
export interface Anomaly {
  type: 'behavior_change' | 'fact_contradiction' | 'principle_violation' | 'confidence_mismatch';
  severity: ConstraintSeverity;
  description: string;
  evidence: string;
  detected_at: string;
}

/**
 * Principle Evaluation Result
 */
export interface PrincipleEvaluationResult {
  principle: SymbiPrinciple;
  passed: boolean;
  score: number; // 0-1
  violations: ConstraintViolation[];
  metrics: Record<string, number>;
}

/**
 * Constraint Violation
 */
export interface ConstraintViolation {
  constraint_id: string;
  constraint_name: string;
  threshold?: number;
  actual: number | string;
  severity: ConstraintSeverity;
  description: string;
  evidence?: string;
}

/**
 * Policy Evaluation Result
 */
export interface PolicyEvaluationResult {
  evaluation_id: string;
  receipt_id: string;
  timestamp: string;
  policy_id: string;
  agent_did: string;
  
  // Decision
  overall_decision: PolicyDecision;
  decision_reason: string;
  
  // Principle results
  principle_results: {
    [key in SymbiPrinciple]?: PrincipleEvaluationResult;
  };
  
  // Metrics
  metrics: {
    truth_debt: number;
    coherence_score: number;
    harm_risk: number;
    completeness: number;
    clarity: number;
    integrity: number;
  };
  
  // Action
  action_taken: PolicyDecision;
  annotation?: string;
  block_reason?: string;
  escalation_reason?: string;
  
  // Override
  override?: OverrideRecord;
  
  // Signature
  signed: boolean;
  signature?: string;
}

/**
 * Override Record
 */
export interface OverrideRecord {
  override_id: string;
  reason: string;
  authorized_by: string;
  timestamp: string;
  expires_at?: string;
}

/**
 * Policy Context
 */
export interface EvaluationContext {
  agent_did: string;
  user_did: string;
  session_id: string;
  request_id: string;
  timestamp: string;
  previous_receipts?: TrustReceipt[];
}

/**
 * Zod Validators
 */
export const ConstraintSchema = z.object({
  id: z.string(),
  name: z.string(),
  principle: z.nativeEnum(SymbiPrinciple),
  description: z.string(),
  threshold: z.number().min(0).max(1).optional(),
  action: z.nativeEnum(PolicyDecision),
  severity: z.nativeEnum(ConstraintSeverity),
  categories: z.array(z.string()).optional(),
  enabled: z.boolean(),
});

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  principles: z.record(
    z.object({
      enabled: z.boolean(),
      constraints: z.array(ConstraintSchema),
    })
  ),
  active: z.boolean(),
});

export const PolicyEvaluationResultSchema = z.object({
  evaluation_id: z.string(),
  receipt_id: z.string(),
  timestamp: z.string().datetime(),
  policy_id: z.string(),
  agent_did: z.string(),
  overall_decision: z.nativeEnum(PolicyDecision),
  decision_reason: z.string(),
  action_taken: z.nativeEnum(PolicyDecision),
  annotation: z.string().optional(),
  block_reason: z.string().optional(),
  signed: z.boolean(),
});
