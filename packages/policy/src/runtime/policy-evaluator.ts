/**
 * Policy Evaluator
 * 
 * Evaluates policy rules against receipts
 * Returns detailed violation and warning information
 */

import type { TrustReceipt } from '@sonate/schemas';
import type {
  PolicyEvaluationResult,
  PolicyRule,
  PolicyContext,
  PolicyViolation,
} from '../types';

export class PolicyEvaluator {
  /**
   * Evaluate a single rule against a receipt
   */
  private evaluateRule(rule: PolicyRule, context: PolicyContext): {
    passed: boolean;
    violation?: PolicyViolation;
  } {
    if (!rule.enabled) {
      return { passed: true };
    }

    const startTime = performance.now();
    const evaluation = rule.evaluator(context.receipt);
    const timeMs = performance.now() - startTime;

    if (evaluation.passed) {
      return { passed: true };
    }

    if (evaluation.violation) {
      const violation: PolicyViolation = {
        ...evaluation.violation,
        detectedAt: Date.now(),
      };
      return { passed: false, violation };
    }

    return { passed: false };
  }

  /**
   * Evaluate multiple rules against a receipt
   */
  evaluate(rules: PolicyRule[], context: PolicyContext): PolicyEvaluationResult {
    const startTime = performance.now();
    const violations: PolicyViolation[] = [];
    const warnings: PolicyWarning[] = [];
    const principlesApplied: string[] = [];

    for (const rule of rules) {
      const result = this.evaluateRule(rule, context);

      if (!result.passed && result.violation) {
        violations.push(result.violation);
      }
    }

    const evaluationTimeMs = performance.now() - startTime;
    const passed = violations.filter(v => v.severity === 'critical').length === 0;

    return {
      passed,
      violations,
      warnings,
      metadata: {
        evaluatedAt: context.timestamp,
        evaluationTimeMs,
        principlesApplied: context.principleIds,
      },
    };
  }

  /**
   * Get rule evaluation time (for performance tracking)
   */
  getEvaluationTime(rule: PolicyRule, receipt: TrustReceipt): number {
    const startTime = performance.now();
    rule.evaluator(receipt);
    return performance.now() - startTime;
  }
}

// Type definition for warnings (to avoid circular imports)
interface PolicyWarning {
  ruleId: string;
  ruleName: string;
  message: string;
  context: Record<string, unknown>;
}
