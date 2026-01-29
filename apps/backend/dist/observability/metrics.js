"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sonateRefusalLatencySeconds = exports.sonateOverridesTotal = exports.sonateRefusalsTotal = exports.agentRestrictionsTotal = exports.agentBansTotal = exports.brainMemoryOperations = exports.brainActionEffectiveness = exports.brainFeedbackScore = exports.brainCycleDurationSeconds = exports.brainActionsTotal = exports.brainCyclesTotal = exports.secretsOperationsTotal = exports.dbQueryDuration = exports.httpRequestDuration = exports.httpRequestsTotal = void 0;
exports.recordHttpRequest = recordHttpRequest;
exports.getMetrics = getMetrics;
exports.recordDbQuery = recordDbQuery;
const prom_client_1 = require("prom-client");
(0, prom_client_1.collectDefaultMetrics)();
exports.httpRequestsTotal = new prom_client_1.Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status_code'] });
exports.httpRequestDuration = new prom_client_1.Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration seconds', labelNames: ['method', 'route'], buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5] });
function recordHttpRequest(method, route, statusCode, durationSeconds) { exports.httpRequestsTotal.inc({ method, route, status_code: String(statusCode) }); exports.httpRequestDuration.observe({ method, route }, durationSeconds); }
async function getMetrics() { return prom_client_1.register.metrics(); }
exports.dbQueryDuration = new prom_client_1.Histogram({ name: 'db_query_duration_seconds', help: 'MongoDB query duration seconds', labelNames: ['operation', 'collection'], buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2] });
function recordDbQuery(operation, collection, durationSeconds) { exports.dbQueryDuration.observe({ operation, collection }, durationSeconds); }
exports.secretsOperationsTotal = new prom_client_1.Counter({ name: 'secrets_operations_total', help: 'Total secrets operations', labelNames: ['operation', 'provider', 'status'] });
exports.brainCyclesTotal = new prom_client_1.Counter({ name: 'brain_cycles_total', help: 'Total brain cycles', labelNames: ['status'] });
exports.brainActionsTotal = new prom_client_1.Counter({ name: 'brain_actions_total', help: 'Total brain actions', labelNames: ['type', 'status'] });
exports.brainCycleDurationSeconds = new prom_client_1.Histogram({ name: 'brain_cycle_duration_seconds', help: 'Brain cycle duration seconds', buckets: [0.1, 0.5, 1, 2, 5, 10, 20] });
// Brain feedback and effectiveness metrics
exports.brainFeedbackScore = new prom_client_1.Histogram({ name: 'brain_feedback_score', help: 'Feedback score for brain actions', labelNames: ['action_type', 'success'], buckets: [-1, -0.5, 0, 0.5, 1] });
exports.brainActionEffectiveness = new prom_client_1.Gauge({ name: 'brain_action_effectiveness', help: 'Effectiveness score for action types', labelNames: ['action_type', 'tenant_id'] });
exports.brainMemoryOperations = new prom_client_1.Counter({ name: 'brain_memory_operations_total', help: 'Total brain memory operations', labelNames: ['operation', 'kind'] });
exports.agentBansTotal = new prom_client_1.Counter({ name: 'agent_bans_total', help: 'Total agent bans', labelNames: ['severity', 'reason_type'] });
exports.agentRestrictionsTotal = new prom_client_1.Counter({ name: 'agent_restrictions_total', help: 'Total agent restrictions', labelNames: ['restriction_type'] });
exports.sonateRefusalsTotal = new prom_client_1.Counter({ name: 'sonate_refusals_total', help: 'Total kernel refusals', labelNames: ['reason', 'tenant_id'] });
exports.sonateOverridesTotal = new prom_client_1.Counter({ name: 'sonate_overrides_total', help: 'Total human overrides', labelNames: ['status', 'tenant_id'] });
exports.sonateRefusalLatencySeconds = new prom_client_1.Histogram({ name: 'sonate_refusal_latency_seconds', help: 'Kernel refusal latency seconds', labelNames: ['reason', 'tenant_id'], buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5] });
