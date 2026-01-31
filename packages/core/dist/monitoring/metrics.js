"use strict";
/**
 * @sonate/core - Prometheus Metrics Infrastructure
 *
 * Provides production-grade metrics collection for monitoring and alerting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpResponseSizeHistogram = exports.httpRequestSizeHistogram = exports.httpRequestDurationHistogram = exports.httpRequestsTotal = exports.externalApiDurationHistogram = exports.externalApiCallsTotal = exports.cacheOperationsTotal = exports.dbQueryDurationHistogram = exports.rateLimitHitsTotal = exports.authFailuresTotal = exports.securityAlertsTotal = exports.realityIndexGauge = exports.resonanceReceiptsTotal = exports.resonanceQualityHistogram = exports.agentResponseTimeHistogram = exports.agentOperationsTotal = exports.activeAgentsGauge = exports.workflowFailuresTotal = exports.workflowStepDurationHistogram = exports.activeWorkflowsGauge = exports.workflowDurationHistogram = exports.trustVerificationsTotal = exports.trustReceiptsTotal = exports.trustScoreHistogram = exports.register = void 0;
exports.getMetrics = getMetrics;
exports.getMetricsJSON = getMetricsJSON;
exports.resetMetrics = resetMetrics;
const prom_client_1 = require("prom-client");
// Use global registry to avoid duplicate registration during Next.js SSG
exports.register = prom_client_1.register;
// Singleton flag to ensure metrics are only registered once
// This is critical for Next.js SSG which may load this module multiple times
const METRICS_INITIALIZED_KEY = '__sonate_metrics_initialized__';
if (!global[METRICS_INITIALIZED_KEY]) {
    // Collect default metrics (CPU, memory, etc.) only once
    try {
        (0, prom_client_1.collectDefaultMetrics)({ register: exports.register });
    }
    catch (error) {
        // Metrics already collected, ignore
    }
    global[METRICS_INITIALIZED_KEY] = true;
}
/**
 * Helper function to safely get or create a metric
 * Prevents duplicate registration errors during Next.js SSG
 */
function getOrCreateMetric(name, createFn) {
    try {
        const existing = exports.register.getSingleMetric(name);
        if (existing) {
            return existing;
        }
        return createFn();
    }
    catch (error) {
        // If metric creation fails (already exists), try to get it
        const existing = exports.register.getSingleMetric(name);
        if (existing) {
            return existing;
        }
        throw error;
    }
}
/**
 * Trust Protocol Metrics
 */
// Trust score distribution
exports.trustScoreHistogram = getOrCreateMetric('sonate_trust_score', () => new prom_client_1.Histogram({
    name: 'sonate_trust_score',
    help: 'Distribution of trust scores',
    labelNames: ['agent_id', 'workflow_id'],
    buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    registers: [exports.register],
}));
// Trust receipt generation counter
exports.trustReceiptsTotal = getOrCreateMetric('sonate_trust_receipts_total', () => new prom_client_1.Counter({
    name: 'sonate_trust_receipts_total',
    help: 'Total number of trust receipts generated',
    labelNames: ['status', 'session_id'],
    registers: [exports.register],
}));
// Trust verification counter
exports.trustVerificationsTotal = getOrCreateMetric('sonate_trust_verifications_total', () => new prom_client_1.Counter({
    name: 'sonate_trust_verifications_total',
    help: 'Total number of trust verifications',
    labelNames: ['result', 'agent_id'],
    registers: [exports.register],
}));
/**
 * Workflow Metrics
 */
// Workflow execution duration
exports.workflowDurationHistogram = getOrCreateMetric('sonate_workflow_duration_seconds', () => new prom_client_1.Histogram({
    name: 'sonate_workflow_duration_seconds',
    help: 'Workflow execution duration in seconds',
    labelNames: ['workflow_name', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
    registers: [exports.register],
}));
// Active workflows gauge
exports.activeWorkflowsGauge = getOrCreateMetric('sonate_active_workflows', () => new prom_client_1.Gauge({
    name: 'sonate_active_workflows',
    help: 'Number of currently active workflows',
    labelNames: ['workflow_type'],
    registers: [exports.register],
}));
// Workflow step duration
exports.workflowStepDurationHistogram = getOrCreateMetric('sonate_workflow_step_duration_seconds', () => new prom_client_1.Histogram({
    name: 'sonate_workflow_step_duration_seconds',
    help: 'Workflow step execution duration in seconds',
    labelNames: ['workflow_name', 'step_name', 'agent_id'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [exports.register],
}));
// Workflow failures counter
exports.workflowFailuresTotal = getOrCreateMetric('sonate_workflow_failures_total', () => new prom_client_1.Counter({
    name: 'sonate_workflow_failures_total',
    help: 'Total number of workflow failures',
    labelNames: ['workflow_name', 'error_type'],
    registers: [exports.register],
}));
/**
 * Agent Metrics
 */
// Active agents gauge
exports.activeAgentsGauge = getOrCreateMetric('sonate_active_agents', () => new prom_client_1.Gauge({
    name: 'sonate_active_agents',
    help: 'Number of currently active agents',
    labelNames: ['status'],
    registers: [exports.register],
}));
// Agent operations counter
exports.agentOperationsTotal = getOrCreateMetric('sonate_agent_operations_total', () => new prom_client_1.Counter({
    name: 'sonate_agent_operations_total',
    help: 'Total number of agent operations',
    labelNames: ['agent_id', 'operation', 'status'],
    registers: [exports.register],
}));
// Agent response time
exports.agentResponseTimeHistogram = getOrCreateMetric('sonate_agent_response_time_seconds', () => new prom_client_1.Histogram({
    name: 'sonate_agent_response_time_seconds',
    help: 'Agent response time in seconds',
    labelNames: ['agent_id', 'action'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [exports.register],
}));
/**
 * Resonance Metrics
 */
// Resonance quality distribution
exports.resonanceQualityHistogram = getOrCreateMetric('sonate_resonance_quality', () => new prom_client_1.Histogram({
    name: 'sonate_resonance_quality',
    help: 'Distribution of resonance quality scores',
    labelNames: ['interaction_type'],
    buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    registers: [exports.register],
}));
// Resonance receipts counter
exports.resonanceReceiptsTotal = getOrCreateMetric('sonate_resonance_receipts_total', () => new prom_client_1.Counter({
    name: 'sonate_resonance_receipts_total',
    help: 'Total number of resonance receipts generated',
    labelNames: ['trust_protocol', 'resonance_level'],
    registers: [exports.register],
}));
/**
 * @deprecated v2.0.1 - RealityIndex calculator was removed (trivially gamed)
 * This metric is kept for backward compatibility but will always be 0
 */
exports.realityIndexGauge = getOrCreateMetric('sonate_reality_index', () => new prom_client_1.Gauge({
    name: 'sonate_reality_index',
    help: 'DEPRECATED: Reality index value (always 0 in v2.0.1+)',
    labelNames: ['session_id'],
    registers: [exports.register],
}));
/**
 * Security Metrics
 */
// Security alerts counter
exports.securityAlertsTotal = getOrCreateMetric('sonate_security_alerts_total', () => new prom_client_1.Counter({
    name: 'sonate_security_alerts_total',
    help: 'Total number of security alerts',
    labelNames: ['severity', 'alert_type'],
    registers: [exports.register],
}));
// Failed authentications counter
exports.authFailuresTotal = getOrCreateMetric('sonate_auth_failures_total', () => new prom_client_1.Counter({
    name: 'sonate_auth_failures_total',
    help: 'Total number of authentication failures',
    labelNames: ['method', 'reason'],
    registers: [exports.register],
}));
// API rate limit hits counter
exports.rateLimitHitsTotal = getOrCreateMetric('sonate_rate_limit_hits_total', () => new prom_client_1.Counter({
    name: 'sonate_rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['endpoint', 'client_id'],
    registers: [exports.register],
}));
/**
 * Performance Metrics
 */
// Database query duration
exports.dbQueryDurationHistogram = getOrCreateMetric('sonate_db_query_duration_seconds', () => new prom_client_1.Histogram({
    name: 'sonate_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'collection'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [exports.register],
}));
// Cache hit/miss counter
exports.cacheOperationsTotal = getOrCreateMetric('sonate_cache_operations_total', () => new prom_client_1.Counter({
    name: 'sonate_cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'result'],
    registers: [exports.register],
}));
// External API calls
exports.externalApiCallsTotal = getOrCreateMetric('sonate_external_api_calls_total', () => new prom_client_1.Counter({
    name: 'sonate_external_api_calls_total',
    help: 'Total number of external API calls',
    labelNames: ['service', 'status_code'],
    registers: [exports.register],
}));
// External API duration
exports.externalApiDurationHistogram = getOrCreateMetric('sonate_external_api_duration_seconds', () => new prom_client_1.Histogram({
    name: 'sonate_external_api_duration_seconds',
    help: 'External API call duration in seconds',
    labelNames: ['service', 'endpoint'],
    buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
    registers: [exports.register],
}));
/**
 * HTTP Metrics
 */
// HTTP requests counter
exports.httpRequestsTotal = getOrCreateMetric('sonate_http_requests_total', () => new prom_client_1.Counter({
    name: 'sonate_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [exports.register],
}));
// HTTP request duration
exports.httpRequestDurationHistogram = getOrCreateMetric('sonate_http_request_duration_seconds', () => new prom_client_1.Histogram({
    name: 'sonate_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [exports.register],
}));
// HTTP request size
exports.httpRequestSizeHistogram = getOrCreateMetric('sonate_http_request_size_bytes', () => new prom_client_1.Histogram({
    name: 'sonate_http_request_size_bytes',
    help: 'HTTP request size in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
    registers: [exports.register],
}));
// HTTP response size
exports.httpResponseSizeHistogram = getOrCreateMetric('sonate_http_response_size_bytes', () => new prom_client_1.Histogram({
    name: 'sonate_http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
    registers: [exports.register],
}));
/**
 * Helper function to get all metrics as text
 */
async function getMetrics() {
    return exports.register.metrics();
}
/**
 * Helper function to get metrics as JSON
 */
async function getMetricsJSON() {
    return exports.register.getMetricsAsJSON();
}
/**
 * Reset all metrics (useful for testing)
 */
function resetMetrics() {
    exports.register.resetMetrics();
}
