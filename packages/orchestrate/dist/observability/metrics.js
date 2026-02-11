"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTrustScoreAverage = exports.updateWorkflowsRunning = exports.updateActiveAgents = exports.recordApiKeyValidation = exports.recordAuthAttempt = exports.recordDbQuery = exports.recordError = exports.recordHttpRequest = exports.metrics = void 0;
exports.initDefaultMetrics = initDefaultMetrics;
exports.getMetrics = getMetrics;
const prom_client_1 = require("prom-client");
function initDefaultMetrics() {
    try {
        // Check if default metrics are already registered to prevent build errors
        const defaultCpuMetric = prom_client_1.register.getSingleMetric('process_cpu_user_seconds_total');
        if (defaultCpuMetric) {
            return; // Already initialized
        }
        // Lazy import to avoid duplicate registrations across packages
        // The caller should ensure this is called only once per process
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { collectDefaultMetrics } = require('prom-client');
        collectDefaultMetrics();
    }
    catch {
        // no-op
    }
}
// Helper to get or create a metric (prevents duplicate registration errors)
function getOrCreateMetric(name, factory) {
    const existing = prom_client_1.register.getSingleMetric(name);
    if (existing) {
        return existing;
    }
    return factory();
}
// Custom metrics (using singleton pattern to prevent duplicate registration)
exports.metrics = {
    // Request metrics
    httpRequestsTotal: getOrCreateMetric('orchestrate_http_requests_total', () => new prom_client_1.Counter({
        name: 'orchestrate_http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
    })),
    httpRequestDuration: getOrCreateMetric('orchestrate_http_request_duration_seconds', () => new prom_client_1.Histogram({
        name: 'orchestrate_http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route'],
        buckets: [0.1, 0.5, 1, 2, 5, 10],
    })),
    // Error metrics
    errorsTotal: getOrCreateMetric('orchestrate_errors_total', () => new prom_client_1.Counter({
        name: 'orchestrate_errors_total',
        help: 'Total number of errors',
        labelNames: ['type', 'component'],
    })),
    // Database metrics
    dbConnectionsActive: getOrCreateMetric('orchestrate_db_connections_active', () => new prom_client_1.Gauge({
        name: 'orchestrate_db_connections_active',
        help: 'Number of active database connections',
    })),
    dbQueryDuration: getOrCreateMetric('orchestrate_db_query_duration_seconds', () => new prom_client_1.Histogram({
        name: 'orchestrate_db_query_duration_seconds',
        help: 'Duration of database queries in seconds',
        labelNames: ['operation'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    })),
    // Business metrics
    activeAgents: getOrCreateMetric('orchestrate_active_agents_total', () => new prom_client_1.Gauge({
        name: 'orchestrate_active_agents_total',
        help: 'Number of active agents',
    })),
    workflowsRunning: getOrCreateMetric('orchestrate_workflows_running_total', () => new prom_client_1.Gauge({
        name: 'orchestrate_workflows_running_total',
        help: 'Number of currently running workflows',
    })),
    trustScoreAverage: getOrCreateMetric('orchestrate_trust_score_average', () => new prom_client_1.Gauge({
        name: 'orchestrate_trust_score_average',
        help: 'Average trust score across all agents',
    })),
    // Security metrics
    authAttemptsTotal: getOrCreateMetric('orchestrate_auth_attempts_total', () => new prom_client_1.Counter({
        name: 'orchestrate_auth_attempts_total',
        help: 'Total authentication attempts',
        labelNames: ['result'],
    })),
    apiKeyValidationsTotal: getOrCreateMetric('orchestrate_api_key_validations_total', () => new prom_client_1.Counter({
        name: 'orchestrate_api_key_validations_total',
        help: 'Total API key validations',
        labelNames: ['result'],
    })),
};
// Metrics endpoint handler
async function getMetrics() {
    return prom_client_1.register.metrics();
}
// Helper functions to record metrics
const recordHttpRequest = (method, route, statusCode, duration) => {
    exports.metrics.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    exports.metrics.httpRequestDuration.observe({ method, route }, duration);
};
exports.recordHttpRequest = recordHttpRequest;
const recordError = (type, component) => {
    exports.metrics.errorsTotal.inc({ type, component });
};
exports.recordError = recordError;
const recordDbQuery = (operation, duration) => {
    exports.metrics.dbQueryDuration.observe({ operation }, duration);
};
exports.recordDbQuery = recordDbQuery;
const recordAuthAttempt = (result) => {
    exports.metrics.authAttemptsTotal.inc({ result });
};
exports.recordAuthAttempt = recordAuthAttempt;
const recordApiKeyValidation = (result) => {
    exports.metrics.apiKeyValidationsTotal.inc({ result });
};
exports.recordApiKeyValidation = recordApiKeyValidation;
const updateActiveAgents = (count) => {
    exports.metrics.activeAgents.set(count);
};
exports.updateActiveAgents = updateActiveAgents;
const updateWorkflowsRunning = (count) => {
    exports.metrics.workflowsRunning.set(count);
};
exports.updateWorkflowsRunning = updateWorkflowsRunning;
const updateTrustScoreAverage = (score) => {
    exports.metrics.trustScoreAverage.set(score);
};
exports.updateTrustScoreAverage = updateTrustScoreAverage;
