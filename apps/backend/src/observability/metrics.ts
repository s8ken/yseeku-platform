import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

const globalState = globalThis as unknown as { __sonate_default_metrics_collected__?: boolean };
if (!globalState.__sonate_default_metrics_collected__) {
  try {
    collectDefaultMetrics();
  } catch {}
  globalState.__sonate_default_metrics_collected__ = true;
}

/**
 * Helper to safely create or retrieve a metric from the registry,
 * preventing "already registered" errors in test environments.
 */
function getOrCreate<T>(MetricClass: new (config: any) => T, config: { name: string;[key: string]: any }): T {
  try {
    return new MetricClass(config);
  } catch {
    // Metric already registered — retrieve it from the registry
    return register.getSingleMetric(config.name) as unknown as T;
  }
}

export const httpRequestsTotal = getOrCreate(Counter, { name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status_code'] });
export const sonateHttpRequestsTotal = getOrCreate(Counter, { name: 'sonate_http_requests_total', help: 'Total HTTP requests (SONATE alias)', labelNames: ['method', 'route', 'status_code'] });
export const httpRequestDuration = getOrCreate(Histogram, { name: 'http_request_duration_seconds', help: 'HTTP request duration seconds', labelNames: ['method', 'route'], buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5] });
export function recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
  const labels = { method, route, status_code: String(statusCode) };
  (httpRequestsTotal as Counter).inc(labels);
  (sonateHttpRequestsTotal as Counter).inc(labels);
  (httpRequestDuration as Histogram).observe({ method, route }, durationSeconds);
}
export async function getMetrics(): Promise<string> { return register.metrics(); }
export const dbQueryDuration = getOrCreate(Histogram, { name: 'db_query_duration_seconds', help: 'MongoDB query duration seconds', labelNames: ['operation', 'collection'], buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2] });
export function recordDbQuery(operation: string, collection: string, durationSeconds: number) { (dbQueryDuration as Histogram).observe({ operation, collection }, durationSeconds); }
export const secretsOperationsTotal = getOrCreate(Counter, { name: 'secrets_operations_total', help: 'Total secrets operations', labelNames: ['operation', 'provider', 'status'] });
export const brainCyclesTotal = getOrCreate(Counter, { name: 'brain_cycles_total', help: 'Total brain cycles', labelNames: ['status'] });
export const brainActionsTotal = getOrCreate(Counter, { name: 'brain_actions_total', help: 'Total brain actions', labelNames: ['type', 'status'] });
export const brainCycleDurationSeconds = getOrCreate(Histogram, { name: 'brain_cycle_duration_seconds', help: 'Brain cycle duration seconds', buckets: [0.1, 0.5, 1, 2, 5, 10, 20] });

// Brain feedback and effectiveness metrics
export const brainFeedbackScore = getOrCreate(Histogram, { name: 'brain_feedback_score', help: 'Feedback score for brain actions', labelNames: ['action_type', 'success'], buckets: [-1, -0.5, 0, 0.5, 1] });
export const brainActionEffectiveness = getOrCreate(Gauge, { name: 'brain_action_effectiveness', help: 'Effectiveness score for action types', labelNames: ['action_type', 'tenant_id'] });
export const brainMemoryOperations = getOrCreate(Counter, { name: 'brain_memory_operations_total', help: 'Total brain memory operations', labelNames: ['operation', 'kind'] });
export const agentBansTotal = getOrCreate(Counter, { name: 'agent_bans_total', help: 'Total agent bans', labelNames: ['severity', 'reason_type'] });
export const agentRestrictionsTotal = getOrCreate(Counter, { name: 'agent_restrictions_total', help: 'Total agent restrictions', labelNames: ['restriction_type'] });
export const sonateRefusalsTotal = getOrCreate(Counter, { name: 'sonate_refusals_total', help: 'Total kernel refusals', labelNames: ['reason', 'tenant_id'] });
export const sonateOverridesTotal = getOrCreate(Counter, { name: 'sonate_overrides_total', help: 'Total human overrides', labelNames: ['status', 'tenant_id'] });
export const sonateRefusalLatencySeconds = getOrCreate(Histogram, { name: 'sonate_refusal_latency_seconds', help: 'Kernel refusal latency seconds', labelNames: ['reason', 'tenant_id'], buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5] });

export const sonateTrustReceiptsTotal = getOrCreate(Counter, { name: 'sonate_trust_receipts_total', help: 'Total trust receipts generated' });
export const sonateTrustVerificationsTotal = getOrCreate(Counter, { name: 'sonate_trust_verifications_total', help: 'Total trust receipt verifications performed' });
export const sonateResonanceReceiptsTotal = getOrCreate(Counter, { name: 'sonate_resonance_receipts_total', help: 'Total resonance analyses recorded' });

export const sonateActiveWorkflows = getOrCreate(Gauge, { name: 'sonate_active_workflows', help: 'Count of active running workflows' });
export const sonateActiveAgents = getOrCreate(Gauge, { name: 'sonate_active_agents', help: 'Count of active agents' });
