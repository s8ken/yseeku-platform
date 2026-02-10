/**
 * Policy Evaluator Service
 * 
 * Main service for evaluating AI policies against receipts
 */

import type { TrustReceipt } from '@sonate/schemas';
import { ConstraintEvaluatorFactory } from './evaluators/index';
import type {
  AIPolicy,
  PolicyEnforcementResult,
  EnforcedTrustReceipt,
  BatchPolicyEvaluationResult,
  PolicyEvaluationContext,
  ConstraintViolation,
  PolicyAction,
} from './interfaces/index';

export class PolicyEvaluator {
  private policies: Map<string, AIPolicy> = new Map();
  private evaluationHistory: Map<string, PolicyEnforcementResult[]> = new Map();

  /**
   * Register a policy
   */
  registerPolicy(policy: AIPolicy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId: string): AIPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * List all policies
   */
  listPolicies(): AIPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Evaluate a single receipt against a policy
   */
  async evaluateReceipt(receipt: TrustReceipt, policy: AIPolicy): Promise<PolicyEnforcementResult> {
    const startTime = Date.now();
    const violations: ConstraintViolation[] = [];

    // Evaluate all enabled constraints
    for (const constraint of policy.constraints) {
      if (!constraint.enabled) continue;

      try {
        const evaluator = ConstraintEvaluatorFactory.create(constraint);
        const violation = await evaluator.evaluate(receipt);

        if (violation) {
          violations.push(violation);
        }
      } catch (error) {
        console.error(`Error evaluating constraint ${constraint.id}:`, error);
        // Continue evaluating other constraints
      }
    }

    const duration = Date.now() - startTime;

    // Determine overall status and action
    const passed = violations.length === 0;
    const hasCriticalViolations = violations.some((v) => v.severity === 'block');
    const requiresHumanReview = violations.some((v) => v.severity === 'escalate' || v.severity === 'block');

    const result: PolicyEnforcementResult = {
      receipt_id: receipt.id,
      policy_id: policy.id,
      passed,
      violations,
      status: hasCriticalViolations ? 'BLOCKED' : violations.length > 0 ? 'FLAGGED' : 'CLEAR',
      human_review_required: requiresHumanReview,
      recommended_action: this.determineAction(violations, policy.severity),
      enforcement_timestamp: new Date().toISOString(),
      duration_ms: duration,
    };

    // Store in history
    if (!this.evaluationHistory.has(receipt.id)) {
      this.evaluationHistory.set(receipt.id, []);
    }
    this.evaluationHistory.get(receipt.id)!.push(result);

    return result;
  }

  /**
   * Evaluate a receipt against multiple policies
   */
  async evaluateMultiplePolicies(
    receipt: TrustReceipt,
    policies: AIPolicy[],
    strictMode = false
  ): Promise<PolicyEnforcementResult[]> {
    const results: PolicyEnforcementResult[] = [];

    for (const policy of policies) {
      const result = await this.evaluateReceipt(receipt, policy);
      results.push(result);

      // In strict mode, stop on first violation
      if (strictMode && !result.passed) {
        break;
      }
    }

    return results;
  }

  /**
   * Enforce a policy on a receipt (add policy enforcement to receipt)
   */
  async enforcePolicy(receipt: TrustReceipt, policy: AIPolicy): Promise<EnforcedTrustReceipt> {
    const result = await this.evaluateReceipt(receipt, policy);

    // Determine actions taken based on violations
    const actionsTaken: PolicyAction[] = [];
    if (result.status === 'BLOCKED') {
      actionsTaken.push('BLOCK');
    } else if (result.status === 'FLAGGED') {
      actionsTaken.push('ALERT');
      if (result.human_review_required) {
        actionsTaken.push('REQUIRE_HUMAN_REVIEW');
      }
    }

    return {
      ...receipt,
      policy_enforcement: {
        policies_evaluated: [policy.id],
        violations: result.violations,
        status: result.status,
        human_review_required: result.human_review_required,
        enforcement_timestamp: result.enforcement_timestamp,
        actions_taken: actionsTaken,
      },
    };
  }

  /**
   * Batch evaluate receipts
   */
  async batchEvaluate(
    receipts: TrustReceipt[],
    policies: AIPolicy[],
    context?: Partial<PolicyEvaluationContext>
  ): Promise<BatchPolicyEvaluationResult> {
    const startTime = Date.now();
    const results: PolicyEnforcementResult[] = [];
    const allViolations: ConstraintViolation[] = [];

    for (const receipt of receipts) {
      for (const policy of policies) {
        const result = await this.evaluateReceipt(receipt, policy);
        results.push(result);
        allViolations.push(...result.violations);
      }
    }

    const duration = Date.now() - startTime;

    // Generate summary
    const summary = {
      passed: results.filter((r) => r.passed).length,
      flagged: results.filter((r) => r.status === 'FLAGGED').length,
      blocked: results.filter((r) => r.status === 'BLOCKED').length,
      total_violations: allViolations.length,
      critical_violations: allViolations.filter((v) => v.severity === 'block').length,
      requires_review: results.filter((r) => r.human_review_required).length,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, allViolations);

    return {
      total_receipts: receipts.length,
      total_policies: policies.length,
      evaluation_timestamp: new Date().toISOString(),
      duration_ms: duration,
      results,
      summary,
      recommendations,
    };
  }

  /**
   * Get evaluation history for a receipt
   */
  getEvaluationHistory(receiptId: string): PolicyEnforcementResult[] {
    return this.evaluationHistory.get(receiptId) || [];
  }

  /**
   * Determine recommended action based on violations
   */
  private determineAction(violations: ConstraintViolation[], policySeverity: string): PolicyAction {
    if (violations.length === 0) {
      return 'ALERT';
    }

    const hasCritical = violations.some((v) => v.severity === 'block');
    const hasEscalate = violations.some((v) => v.severity === 'escalate');

    if (hasCritical) {
      return 'BLOCK';
    } else if (hasEscalate || violations.length > 1) {
      return 'REQUIRE_HUMAN_REVIEW';
    } else {
      return 'ANNOTATE';
    }
  }

  /**
   * Generate recommendations based on evaluation results
   */
  private generateRecommendations(results: PolicyEnforcementResult[], violations: ConstraintViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.length === 0) {
      recommendations.push('All policies passed. No action required.');
      return recommendations;
    }

    // Analyze violation patterns
    const violationTypes = new Map<string, number>();
    for (const violation of violations) {
      violationTypes.set(
        violation.violation_type,
        (violationTypes.get(violation.violation_type) || 0) + 1
      );
    }

    for (const [type, count] of violationTypes) {
      if (type === 'PII_DETECTED') {
        recommendations.push(`${count} PII detection violations found. Ensure sensitive data is redacted before user exposure.`);
      } else if (type === 'TRUTH_DEBT_EXCEEDED') {
        recommendations.push(`${count} high truth debt violations detected. Consider adding more verifiable sources or human review steps.`);
      } else if (type === 'COMPLIANCE_BOUNDARY_VIOLATED') {
        recommendations.push(
          `${count} compliance boundary violations found. Require human expert review before final output.`
        );
      }
    }

    const blockedCount = violations.filter((v) => v.severity === 'block').length;
    if (blockedCount > 0) {
      recommendations.push(`${blockedCount} critical violations require immediate escalation.`);
    }

    const reviewRequired = results.filter((r) => r.human_review_required).length;
    if (reviewRequired > 0) {
      recommendations.push(`${reviewRequired} receipts require human review before production use.`);
    }

    return recommendations;
  }
}

export * from './interfaces/index';
export * from './evaluators/index';
export * from './policies/index';
