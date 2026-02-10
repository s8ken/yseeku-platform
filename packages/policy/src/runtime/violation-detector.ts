/**
 * Violation Detector
 * 
 * Specialized detector for policy breaches
 * Groups and prioritizes violations for action
 */

import type { PolicyViolation, PolicyEvaluationResult } from '../types';

export interface ViolationReport {
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  byRule: Map<string, PolicyViolation[]>;
  shouldBlock: boolean;
}

export class ViolationDetector {
  /**
   * Detect and report violations from evaluation result
   */
  detect(result: PolicyEvaluationResult): ViolationReport {
    const byRule = new Map<string, PolicyViolation[]>();
    const severity = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const violation of result.violations) {
      if (!byRule.has(violation.ruleId)) {
        byRule.set(violation.ruleId, []);
      }
      byRule.get(violation.ruleId)!.push(violation);
      severity[violation.severity]++;
    }

    const shouldBlock = severity.critical > 0 || severity.high > 0;

    return {
      totalViolations: result.violations.length,
      criticalCount: severity.critical,
      highCount: severity.high,
      mediumCount: severity.medium,
      lowCount: severity.low,
      byRule,
      shouldBlock,
    };
  }

  /**
   * Check if violations should cause immediate blocking
   */
  shouldBlockResponse(violations: PolicyViolation[]): boolean {
    return violations.some(v => v.severity === 'critical');
  }

  /**
   * Get most severe violation
   */
  getMostSevereViolation(violations: PolicyViolation[]): PolicyViolation | undefined {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return violations.reduce((prev, current) => {
      const prevSeverity = severityOrder[prev.severity];
      const currentSeverity = severityOrder[current.severity];
      return currentSeverity < prevSeverity ? current : prev;
    });
  }

  /**
   * Group violations by severity
   */
  groupBySeverity(violations: PolicyViolation[]): Map<string, PolicyViolation[]> {
    const grouped = new Map<string, PolicyViolation[]>();

    for (const violation of violations) {
      if (!grouped.has(violation.severity)) {
        grouped.set(violation.severity, []);
      }
      grouped.get(violation.severity)!.push(violation);
    }

    return grouped;
  }

  /**
   * Generate human-readable violation summary
   */
  summarizeViolations(violations: PolicyViolation[]): string {
    if (violations.length === 0) {
      return 'No violations detected';
    }

    const counts = this.groupBySeverity(violations);
    const parts: string[] = [];

    if (counts.has('critical')) {
      parts.push(`${counts.get('critical')!.length} critical`);
    }
    if (counts.has('high')) {
      parts.push(`${counts.get('high')!.length} high`);
    }
    if (counts.has('medium')) {
      parts.push(`${counts.get('medium')!.length} medium`);
    }
    if (counts.has('low')) {
      parts.push(`${counts.get('low')!.length} low`);
    }

    return `${violations.length} violation(s): ${parts.join(', ')}`;
  }
}
