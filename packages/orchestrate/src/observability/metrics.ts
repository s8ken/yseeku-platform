import { register, Gauge, Counter, Histogram } from 'prom-client';

export function initDefaultMetrics(): void {
  try {
    // Lazy import to avoid duplicate registrations across packages
    // The caller should ensure this is called only once per process
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { collectDefaultMetrics } = require('prom-client');
    collectDefaultMetrics();
  } catch {
    // no-op
  }
}

// Custom metrics
export const metrics = {
  // Request metrics
  httpRequestsTotal: new Counter({
    name: 'orchestrate_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  }),

  httpRequestDuration: new Histogram({
    name: 'orchestrate_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  // Error metrics
  errorsTotal: new Counter({
    name: 'orchestrate_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'component']
  }),

  // Database metrics
  dbConnectionsActive: new Gauge({
    name: 'orchestrate_db_connections_active',
    help: 'Number of active database connections'
  }),

  dbQueryDuration: new Histogram({
    name: 'orchestrate_db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
  }),

  // Business metrics
  activeAgents: new Gauge({
    name: 'orchestrate_active_agents_total',
    help: 'Number of active agents'
  }),

  workflowsRunning: new Gauge({
    name: 'orchestrate_workflows_running_total',
    help: 'Number of currently running workflows'
  }),

  trustScoreAverage: new Gauge({
    name: 'orchestrate_trust_score_average',
    help: 'Average trust score across all agents'
  }),

  // Security metrics
  authAttemptsTotal: new Counter({
    name: 'orchestrate_auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['result']
  }),

  apiKeyValidationsTotal: new Counter({
    name: 'orchestrate_api_key_validations_total',
    help: 'Total API key validations',
    labelNames: ['result']
  })
};

// Metrics endpoint handler
export async function getMetrics() {
  return register.metrics();
}

// Helper functions to record metrics
export const recordHttpRequest = (method: string, route: string, statusCode: number, duration: number) => {
  metrics.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
  metrics.httpRequestDuration.observe({ method, route }, duration);
};

export const recordError = (type: string, component: string) => {
  metrics.errorsTotal.inc({ type, component });
};

export const recordDbQuery = (operation: string, duration: number) => {
  metrics.dbQueryDuration.observe({ operation }, duration);
};

export const recordAuthAttempt = (result: 'success' | 'failure') => {
  metrics.authAttemptsTotal.inc({ result });
};

export const recordApiKeyValidation = (result: 'valid' | 'invalid' | 'expired') => {
  metrics.apiKeyValidationsTotal.inc({ result });
};

export const updateActiveAgents = (count: number) => {
  metrics.activeAgents.set(count);
};

export const updateWorkflowsRunning = (count: number) => {
  metrics.workflowsRunning.set(count);
};

export const updateTrustScoreAverage = (score: number) => {
  metrics.trustScoreAverage.set(score);
};
