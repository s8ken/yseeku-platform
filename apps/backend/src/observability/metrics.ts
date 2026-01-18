import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
collectDefaultMetrics();
export const httpRequestsTotal = new Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status_code'] });
export const httpRequestDuration = new Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration seconds', labelNames: ['method', 'route'], buckets: [0.05,0.1,0.25,0.5,1,2,5] });
export function recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number) { httpRequestsTotal.inc({ method, route, status_code: String(statusCode) }); httpRequestDuration.observe({ method, route }, durationSeconds); }
export async function getMetrics(): Promise<string> { return register.metrics(); }
export const dbQueryDuration = new Histogram({ name: 'db_query_duration_seconds', help: 'MongoDB query duration seconds', labelNames: ['operation','collection'], buckets: [0.001,0.005,0.01,0.05,0.1,0.5,1,2] });
export function recordDbQuery(operation: string, collection: string, durationSeconds: number) { dbQueryDuration.observe({ operation, collection }, durationSeconds); }
export const secretsOperationsTotal = new Counter({ name: 'secrets_operations_total', help: 'Total secrets operations', labelNames: ['operation','provider','status'] });
export const brainCyclesTotal = new Counter({ name: 'brain_cycles_total', help: 'Total brain cycles', labelNames: ['status'] });
export const brainActionsTotal = new Counter({ name: 'brain_actions_total', help: 'Total brain actions', labelNames: ['type','status'] });
export const brainCycleDurationSeconds = new Histogram({ name: 'brain_cycle_duration_seconds', help: 'Brain cycle duration seconds', buckets: [0.1,0.5,1,2,5,10,20] });

// Brain feedback and effectiveness metrics
export const brainFeedbackScore = new Histogram({ name: 'brain_feedback_score', help: 'Feedback score for brain actions', labelNames: ['action_type', 'success'], buckets: [-1, -0.5, 0, 0.5, 1] });
export const brainActionEffectiveness = new Gauge({ name: 'brain_action_effectiveness', help: 'Effectiveness score for action types', labelNames: ['action_type', 'tenant_id'] });
export const brainMemoryOperations = new Counter({ name: 'brain_memory_operations_total', help: 'Total brain memory operations', labelNames: ['operation', 'kind'] });
export const agentBansTotal = new Counter({ name: 'agent_bans_total', help: 'Total agent bans', labelNames: ['severity', 'reason_type'] });
export const agentRestrictionsTotal = new Counter({ name: 'agent_restrictions_total', help: 'Total agent restrictions', labelNames: ['restriction_type'] });
export const sonateRefusalsTotal = new Counter({ name: 'sonate_refusals_total', help: 'Total kernel refusals', labelNames: ['reason', 'tenant_id'] });
export const sonateOverridesTotal = new Counter({ name: 'sonate_overrides_total', help: 'Total human overrides', labelNames: ['status', 'tenant_id'] });
export const sonateRefusalLatencySeconds = new Histogram({ name: 'sonate_refusal_latency_seconds', help: 'Kernel refusal latency seconds', labelNames: ['reason','tenant_id'], buckets: [0.001,0.005,0.01,0.05,0.1,0.5,1,2,5] });
