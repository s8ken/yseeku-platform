/**
 * Policy Engine Type Definitions
 * 
 * Core types for policy rules, evaluations, and violations
 */

import type { TrustReceipt } from '@sonate/schemas';

/**
 * Policy Evaluation Result
 */
export interface PolicyEvaluationResult {
  passed: boolean;
  violations: PolicyViolation[];
  warnings: PolicyWarning[];
  metadata: {
    evaluatedAt: number;
    evaluationTimeMs: number;
    principlesApplied: string[];
  };
}

/**
 * Policy Violation - A rule breach
 */
export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  context: Record<string, unknown>;
  detectedAt: number;
}

/**
 * Policy Warning - A potential issue (not a hard violation)
 */
export interface PolicyWarning {
  ruleId: string;
  ruleName: string;
  message: string;
  context: Record<string, unknown>;
}

/**
 * Policy Rule Configuration
 */
export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evaluator: (receipt: TrustReceipt) => PolicyRuleEvaluation;
}

/**
 * Result of a single rule evaluation
 */
export interface PolicyRuleEvaluation {
  passed: boolean;
  violation?: Omit<PolicyViolation, 'detectedAt'>;
  warning?: Omit<PolicyWarning, 'detectedAt'>;
}

/**
 * Policy Context - Environment during evaluation
 */
export interface PolicyContext {
  receipt: TrustReceipt;
  principleIds: string[];
  timestamp: number;
}

/**
 * SONATE Principle Definition
 */
export interface SonatePrinciple {
  id: string;
  name: string;
  description: string;
  rules: string[]; // Array of rule IDs that implement this principle
}

/**
 * Policy Engine Configuration
 */
export interface PolicyEngineConfig {
  enabledPrinciples?: string[];
  maxEvaluationTimeMs?: number;
  strictMode?: boolean;
}

/**
 * Policy Batch Evaluation
 */
export interface PolicyBatchResult {
  total: number;
  passed: number;
  failed: number;
  violations: Map<string, PolicyEvaluationResult>;
  evaluationTimeMs: number;
}
