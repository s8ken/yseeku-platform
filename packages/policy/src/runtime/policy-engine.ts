/**
 * Policy Engine
 * 
 * Main policy runtime executor
 * Orchestrates rule evaluation, violation detection, and policy enforcement
 * 
 * Performance target: <50ms overhead per interaction
 * Scalability target: 1000+ receipts/second
 */

import type { TrustReceipt } from '@sonate/schemas';
import type {
  PolicyEvaluationResult,
  PolicyEngineConfig,
  PolicyContext,
  PolicyBatchResult,
  PolicyRule,
} from '../types';
import { PolicyRegistry } from '../rules/registry';
import { PolicyEvaluator } from './policy-evaluator';
import { ViolationDetector } from './violation-detector';

export class PolicyEngine {
  private registry: PolicyRegistry;
  private evaluator: PolicyEvaluator;
  private detector: ViolationDetector;
  private config: PolicyEngineConfig;
  private evaluationStats = {
    totalEvaluations: 0,
    totalTimeMs: 0,
    violations: 0,
    blocked: 0,
  };

  constructor(registry: PolicyRegistry, config: PolicyEngineConfig = {}) {
    this.registry = registry;
    this.evaluator = new PolicyEvaluator();
    this.detector = new ViolationDetector();
    this.config = {
      enabledPrinciples: config.enabledPrinciples || [],
      maxEvaluationTimeMs: config.maxEvaluationTimeMs || 50,
      strictMode: config.strictMode ?? true,
    };
  }

  /**
   * Evaluate a single receipt against enabled policies
   * Returns detailed evaluation result with violations
   */
  evaluate(receipt: TrustReceipt, principleIds?: string[]): PolicyEvaluationResult {
    const startTime = performance.now();
    const timestamp = Date.now();

    // Determine which principles to apply
    const appliedPrinciples = principleIds || this.config.enabledPrinciples || [];

    // Collect all rules for applied principles
    const rules: PolicyRule[] = [];
    const ruleSet = new Set<string>();

    for (const principleId of appliedPrinciples) {
      const principle = this.registry.getPrinciple(principleId);
      if (principle) {
        for (const ruleId of principle.rules) {
          if (!ruleSet.has(ruleId)) {
            const rule = this.registry.getRule(ruleId);
            if (rule) {
              rules.push(rule);
              ruleSet.add(ruleId);
            }
          }
        }
      }
    }

    // Build evaluation context
    const context: PolicyContext = {
      receipt,
      principleIds: appliedPrinciples,
      timestamp,
    };

    // Evaluate all rules
    const result = this.evaluator.evaluate(rules, context);

    // Update statistics
    this.evaluationStats.totalEvaluations++;
    this.evaluationStats.totalTimeMs += result.metadata.evaluationTimeMs;
    this.evaluationStats.violations += result.violations.length;

    // Check performance
    if (this.config.strictMode && result.metadata.evaluationTimeMs > this.config.maxEvaluationTimeMs!) {
      console.warn(
        `Policy evaluation exceeded max time: ${result.metadata.evaluationTimeMs}ms > ${this.config.maxEvaluationTimeMs}ms`,
      );
    }

    return result;
  }

  /**
   * Evaluate multiple receipts in batch
   * Returns aggregated results
   */
  evaluateBatch(receipts: TrustReceipt[], principleIds?: string[]): PolicyBatchResult {
    const startTime = performance.now();
    const violations = new Map<string, PolicyEvaluationResult>();
    let passed = 0;
    let failed = 0;

    for (const receipt of receipts) {
      const result = this.evaluate(receipt, principleIds);
      violations.set(receipt.id, result);

      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    }

    const evaluationTimeMs = performance.now() - startTime;

    return {
      total: receipts.length,
      passed,
      failed,
      violations,
      evaluationTimeMs,
    };
  }

  /**
   * Check if a receipt should be blocked
   * Returns true if any critical violations exist
   */
  shouldBlock(receipt: TrustReceipt, principleIds?: string[]): boolean {
    const result = this.evaluate(receipt, principleIds);
    const report = this.detector.detect(result);

    if (report.shouldBlock) {
      this.evaluationStats.blocked++;
    }

    return report.shouldBlock;
  }

  /**
   * Get formatted violation report for a receipt
   */
  getViolationReport(receipt: TrustReceipt, principleIds?: string[]) {
    const result = this.evaluate(receipt, principleIds);
    return this.detector.detect(result);
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const avgTimeMs =
      this.evaluationStats.totalEvaluations > 0
        ? this.evaluationStats.totalTimeMs / this.evaluationStats.totalEvaluations
        : 0;

    return {
      ...this.evaluationStats,
      averageTimeMs: avgTimeMs,
      blockRate: this.evaluationStats.totalEvaluations > 0 
        ? (this.evaluationStats.blocked / this.evaluationStats.totalEvaluations) * 100
        : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.evaluationStats = {
      totalEvaluations: 0,
      totalTimeMs: 0,
      violations: 0,
      blocked: 0,
    };
  }

  /**
   * Get active configuration
   */
  getConfig(): PolicyEngineConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PolicyEngineConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
