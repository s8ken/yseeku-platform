/**
 * @sonate/core - Prometheus Metrics Infrastructure
 *
 * Provides production-grade metrics collection for monitoring and alerting.
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a Registry to register the metrics
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

/**
 * Trust Protocol Metrics
 */

// Trust score distribution
export const trustScoreHistogram = new Histogram({
  name: 'sonate_trust_score',
  help: 'Distribution of trust scores',
  labelNames: ['agent_id', 'workflow_id'],
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register],
});

// Trust receipt generation counter
export const trustReceiptsTotal = new Counter({
  name: 'sonate_trust_receipts_total',
  help: 'Total number of trust receipts generated',
  labelNames: ['status', 'session_id'],
  registers: [register],
});

// Trust verification counter
export const trustVerificationsTotal = new Counter({
  name: 'sonate_trust_verifications_total',
  help: 'Total number of trust verifications',
  labelNames: ['result', 'agent_id'],
  registers: [register],
});

/**
 * Workflow Metrics
 */

// Workflow execution duration
export const workflowDurationHistogram = new Histogram({
  name: 'sonate_workflow_duration_seconds',
  help: 'Workflow execution duration in seconds',
  labelNames: ['workflow_name', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [register],
});

// Active workflows gauge
export const activeWorkflowsGauge = new Gauge({
  name: 'sonate_active_workflows',
  help: 'Number of currently active workflows',
  labelNames: ['workflow_type'],
  registers: [register],
});

// Workflow step duration
export const workflowStepDurationHistogram = new Histogram({
  name: 'sonate_workflow_step_duration_seconds',
  help: 'Workflow step execution duration in seconds',
  labelNames: ['workflow_name', 'step_name', 'agent_id'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Workflow failures counter
export const workflowFailuresTotal = new Counter({
  name: 'sonate_workflow_failures_total',
  help: 'Total number of workflow failures',
  labelNames: ['workflow_name', 'error_type'],
  registers: [register],
});

/**
 * Agent Metrics
 */

// Active agents gauge
export const activeAgentsGauge = new Gauge({
  name: 'sonate_active_agents',
  help: 'Number of currently active agents',
  labelNames: ['status'],
  registers: [register],
});

// Agent operations counter
export const agentOperationsTotal = new Counter({
  name: 'sonate_agent_operations_total',
  help: 'Total number of agent operations',
  labelNames: ['agent_id', 'operation', 'status'],
  registers: [register],
});

// Agent response time
export const agentResponseTimeHistogram = new Histogram({
  name: 'sonate_agent_response_time_seconds',
  help: 'Agent response time in seconds',
  labelNames: ['agent_id', 'action'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Resonance Metrics
 */

// Resonance quality distribution
export const resonanceQualityHistogram = new Histogram({
  name: 'sonate_resonance_quality',
  help: 'Distribution of resonance quality scores',
  labelNames: ['interaction_type'],
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register],
});

// Resonance receipts counter
export const resonanceReceiptsTotal = new Counter({
  name: 'sonate_resonance_receipts_total',
  help: 'Total number of resonance receipts generated',
  labelNames: ['trust_protocol', 'resonance_level'],
  registers: [register],
});

// Reality index gauge
export const realityIndexGauge = new Gauge({
  name: 'sonate_reality_index',
  help: 'Current reality index value',
  labelNames: ['session_id'],
  registers: [register],
});

/**
 * Security Metrics
 */

// Security alerts counter
export const securityAlertsTotal = new Counter({
  name: 'sonate_security_alerts_total',
  help: 'Total number of security alerts',
  labelNames: ['severity', 'alert_type'],
  registers: [register],
});

// Failed authentications counter
export const authFailuresTotal = new Counter({
  name: 'sonate_auth_failures_total',
  help: 'Total number of authentication failures',
  labelNames: ['method', 'reason'],
  registers: [register],
});

// API rate limit hits counter
export const rateLimitHitsTotal = new Counter({
  name: 'sonate_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'client_id'],
  registers: [register],
});

/**
 * Performance Metrics
 */

// Database query duration
export const dbQueryDurationHistogram = new Histogram({
  name: 'sonate_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Cache hit/miss counter
export const cacheOperationsTotal = new Counter({
  name: 'sonate_cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result'],
  registers: [register],
});

// External API calls
export const externalApiCallsTotal = new Counter({
  name: 'sonate_external_api_calls_total',
  help: 'Total number of external API calls',
  labelNames: ['service', 'status_code'],
  registers: [register],
});

// External API duration
export const externalApiDurationHistogram = new Histogram({
  name: 'sonate_external_api_duration_seconds',
  help: 'External API call duration in seconds',
  labelNames: ['service', 'endpoint'],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  registers: [register],
});

/**
 * HTTP Metrics
 */

// HTTP requests counter
export const httpRequestsTotal = new Counter({
  name: 'sonate_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request duration
export const httpRequestDurationHistogram = new Histogram({
  name: 'sonate_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// HTTP request size
export const httpRequestSizeHistogram = new Histogram({
  name: 'sonate_http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
  registers: [register],
});

// HTTP response size
export const httpResponseSizeHistogram = new Histogram({
  name: 'sonate_http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

/**
 * Helper function to get all metrics as text
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Helper function to get metrics as JSON
 */
export async function getMetricsJSON(): Promise<any> {
  return register.getMetricsAsJSON();
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics(): void {
  register.resetMetrics();
}
