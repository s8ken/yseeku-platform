/**
 * Prometheus Metrics Middleware
 * 
 * Collects application metrics for export
 * Compatible with Prometheus scraping
 */

import { Counter, Histogram, register } from 'prom-client';

/**
 * Helper to safely create or retrieve a metric from the registry
 */
function getOrCreate<T>(MetricClass: new (config: any) => T, config: { name: string;[key: string]: any }): T {
  try {
    return new MetricClass(config);
  } catch {
    return register.getSingleMetric(config.name) as unknown as T;
  }
}

// Policy evaluation metrics
export const policyEvaluationsTotal = getOrCreate(Counter, {
  name: 'policy_evaluations_total',
  help: 'Total number of policy evaluations',
  labelNames: ['rule', 'status'],
});

export const evaluationDurationMs = getOrCreate(Histogram, {
  name: 'policy_evaluation_duration_ms',
  help: 'Policy evaluation duration in milliseconds',
  labelNames: ['rule'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500],
});

// Alert metrics
export const alertsRaisedTotal = getOrCreate(Counter, {
  name: 'alerts_raised_total',
  help: 'Total number of alerts raised',
  labelNames: ['type', 'severity'],
});

// Violation metrics
export const violationsSeverity = getOrCreate(Histogram, {
  name: 'violations_severity_score',
  help: 'Severity score distribution of violations',
  labelNames: ['type'],
  buckets: [0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
});

// Metrics data collection
export const metricsData = {
  evaluationCount: 0,
  violationCount: 0,
  alertCount: 0,
  averageEvaluationTime: 0,
};

/**
 * Record a policy evaluation
 */
export function recordPolicyEvaluation(
  ruleName: string,
  durationMs: number,
  passed: boolean
): void {
  evaluationDurationMs.observe({ rule: ruleName }, durationMs);
  policyEvaluationsTotal.inc({ rule: ruleName, status: passed ? 'pass' : 'fail' });
  metricsData.evaluationCount++;
  metricsData.averageEvaluationTime =
    (metricsData.averageEvaluationTime * (metricsData.evaluationCount - 1) + durationMs) /
    metricsData.evaluationCount;
}

/**
 * Record an alert
 */
export function recordAlert(
  type: string,
  severity: string
): void {
  alertsRaisedTotal.inc({ type, severity });
  metricsData.alertCount++;
}

/**
 * Record a violation
 */
export function recordViolation(
  type: string,
  severityScore: number
): void {
  violationsSeverity.observe({ type }, severityScore);
  metricsData.violationCount++;
}

/**
 * Get Prometheus-formatted metrics
 */
export async function getMetrics(): Promise<string> {
  return await register.metrics();
}

/**
 * Get metrics data
 */
export function getMetricsData() {
  return { ...metricsData };
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics(): void {
  metricsData.evaluationCount = 0;
  metricsData.violationCount = 0;
  metricsData.alertCount = 0;
  metricsData.averageEvaluationTime = 0;
}
