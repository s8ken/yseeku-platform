/**
 * Policy Evaluator Service
 * Evaluates receipts against policies and makes decisions
 */

import { TrustReceipt } from '@sonate/schemas';
import {
  Policy,
  PolicyEvaluationResult,
  PolicyDecision,
  SymbiPrinciple,
  EvaluationContext,
  PrincipleEvaluationResult,
  ConstraintSeverity,
} from '../types';
import { SymbiEvaluator } from '../evaluators/symbi-evaluator';

export class PolicyEvaluatorService {
  private symbiEvaluator: SymbiEvaluator;

  constructor() {
    this.symbiEvaluator = new SymbiEvaluator();
  }

  /**
   * Main evaluation function
   * Evaluates a receipt against a policy
   */
  async evaluate(
    receipt: TrustReceipt,
    policy: Policy,
    context?: EvaluationContext,
    agentHistory?: TrustReceipt[]
  ): Promise<PolicyEvaluationResult> {
    const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Get constraints for each principle
    const sincerity = policy.principles[SymbiPrinciple.SINCERITY];
    const meticulousness = policy.principles[SymbiPrinciple.METICULOUSNESS];
    const benevolence = policy.principles[SymbiPrinciple.BENEVOLENCE];
    const integrity = policy.principles[SymbiPrinciple.INTEGRITY];

    // Evaluate each principle
    const results: Record<SymbiPrinciple, PrincipleEvaluationResult> = {
      [SymbiPrinciple.SINCERITY]: sincerity?.enabled
        ? await this.symbiEvaluator.evaluateSincerity(receipt, sincerity.constraints)
        : {
            principle: SymbiPrinciple.SINCERITY,
            passed: true,
            score: 1,
            violations: [],
            metrics: {},
          },
      [SymbiPrinciple.METICULOUSNESS]: meticulousness?.enabled
        ? await this.symbiEvaluator.evaluateMeticulousness(receipt, meticulousness.constraints)
        : {
            principle: SymbiPrinciple.METICULOUSNESS,
            passed: true,
            score: 1,
            violations: [],
            metrics: {},
          },
      [SymbiPrinciple.BENEVOLENCE]: benevolence?.enabled
        ? await this.symbiEvaluator.evaluateBenevolence(receipt, benevolence.constraints)
        : {
            principle: SymbiPrinciple.BENEVOLENCE,
            passed: true,
            score: 1,
            violations: [],
            metrics: {},
          },
      [SymbiPrinciple.INTEGRITY]: integrity?.enabled
        ? await this.symbiEvaluator.evaluateIntegrity(receipt, integrity.constraints, agentHistory)
        : {
            principle: SymbiPrinciple.INTEGRITY,
            passed: true,
            score: 1,
            violations: [],
            metrics: {},
          },
    };

    // Decide on overall action
    const { decision, reason, annotation } = this.decide(results, policy);

    // Build result
    const evaluation: PolicyEvaluationResult = {
      evaluation_id: evaluationId,
      receipt_id: receipt.id,
      timestamp,
      policy_id: policy.id,
      agent_did: receipt.agent_did,
      
      overall_decision: decision,
      decision_reason: reason,
      
      principle_results: results,
      
      metrics: {
        truth_debt: receipt.telemetry?.truth_debt ?? 0,
        coherence_score: receipt.telemetry?.coherence_score ?? 0.8,
        harm_risk: results[SymbiPrinciple.BENEVOLENCE].metrics.harm_risk ?? 0,
        completeness: results[SymbiPrinciple.METICULOUSNESS].metrics.completeness ?? 0.7,
        clarity: receipt.telemetry?.ciq_metrics?.clarity ?? 0.7,
        integrity: receipt.telemetry?.ciq_metrics?.integrity ?? 0.7,
      },
      
      action_taken: decision,
      annotation,
      signed: receipt.signature ? true : false,
    };

    return evaluation;
  }

  /**
   * Make final decision based on principle results
   */
  private decide(
    results: Record<SymbiPrinciple, PrincipleEvaluationResult>,
    policy: Policy
  ): { decision: PolicyDecision; reason: string; annotation?: string } {
    const violations = Object.values(results)
      .flatMap(r => r.violations)
      .sort((a, b) => {
        // Sort by severity
        const severityOrder = {
          [ConstraintSeverity.CRITICAL]: 0,
          [ConstraintSeverity.ERROR]: 1,
          [ConstraintSeverity.WARNING]: 2,
          [ConstraintSeverity.INFO]: 3,
        };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

    // Check for critical violations
    const criticalViolations = violations.filter(
      v => v.severity === ConstraintSeverity.CRITICAL
    );

    if (criticalViolations.length > 0) {
      return {
        decision: PolicyDecision.BLOCK,
        reason: `Critical policy violation: ${criticalViolations[0].description}`,
        annotation: this.buildAnnotation(violations),
      };
    }

    // Check for errors
    const errorViolations = violations.filter(
      v => v.severity === ConstraintSeverity.ERROR
    );

    if (errorViolations.length > 0) {
      return {
        decision: PolicyDecision.ESCALATE,
        reason: `Policy violation requiring review: ${errorViolations[0].description}`,
        annotation: this.buildAnnotation(violations),
      };
    }

    // Check for warnings
    const warningViolations = violations.filter(
      v => v.severity === ConstraintSeverity.WARNING
    );

    if (warningViolations.length > 0) {
      return {
        decision: PolicyDecision.ANNOTATE,
        reason: `Policy warning: ${warningViolations[0].description}`,
        annotation: this.buildAnnotation(violations),
      };
    }

    // All clear
    return {
      decision: PolicyDecision.ALLOW,
      reason: 'All policy constraints satisfied',
    };
  }

  /**
   * Build annotation from violations
   */
  private buildAnnotation(violations: any[]): string {
    if (violations.length === 0) return '';

    const lines = [
      '⚠️ Policy Evaluation:',
      ...violations.slice(0, 3).map(v => `  • ${v.constraint_name}: ${v.description}`),
    ];

    if (violations.length > 3) {
      lines.push(`  • ... and ${violations.length - 3} more violations`);
    }

    return lines.join('\n');
  }

  /**
   * Get all violations from evaluation
   */
  getAllViolations(evaluation: PolicyEvaluationResult) {
    return Object.values(evaluation.principle_results)
      .flatMap(r => r.violations);
  }

  /**
   * Get violations by principle
   */
  getViolationsByPrinciple(
    evaluation: PolicyEvaluationResult,
    principle: SymbiPrinciple
  ) {
    return evaluation.principle_results[principle]?.violations ?? [];
  }

  /**
   * Check if evaluation passed all constraints
   */
  isPassed(evaluation: PolicyEvaluationResult): boolean {
    return evaluation.overall_decision === PolicyDecision.ALLOW;
  }
}
