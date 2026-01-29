"use strict";
/**
 * SONATE Monitoring & Observability
 * Enterprise-grade monitoring system for AI governance
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
exports.initializeMonitoring = initializeMonitoring;
exports.getMetrics = getMetrics;
exports.resetMetrics = resetMetrics;
exports.getHealthStatus = getHealthStatus;
const prom_client_1 = require("prom-client");
// Core metrics collectors
exports.metrics = {
    // AI Detection Metrics
    detectionRequests: new prom_client_1.Counter({
        name: 'sonate_detection_requests_total',
        help: 'Total number of AI detection requests',
        labelNames: ['model', 'status'],
    }),
    detectionLatency: new prom_client_1.Histogram({
        name: 'sonate_detection_duration_seconds',
        help: 'Time spent processing detection requests',
        labelNames: ['model'],
        buckets: [0.1, 0.5, 1, 2.5, 5, 10],
    }),
    embeddingCacheHits: new prom_client_1.Counter({
        name: 'sonate_embedding_cache_hits_total',
        help: 'Number of embedding cache hits',
    }),
    embeddingCacheMisses: new prom_client_1.Counter({
        name: 'sonate_embedding_cache_misses_total',
        help: 'Number of embedding cache misses',
    }),
    // Trust & Confidence Metrics
    trustScoreDistribution: new prom_client_1.Histogram({
        name: 'sonate_trust_score_distribution',
        help: 'Distribution of trust scores',
        buckets: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    }),
    confidenceLevel: new prom_client_1.Gauge({
        name: 'sonate_confidence_level',
        help: 'Current confidence level in AI assessments',
        labelNames: ['session_id'],
    }),
    // Security & Audit Metrics
    securityEvents: new prom_client_1.Counter({
        name: 'sonate_security_events_total',
        help: 'Total number of security events',
        labelNames: ['type', 'severity'],
    }),
    auditLogEntries: new prom_client_1.Counter({
        name: 'sonate_audit_log_entries_total',
        help: 'Total number of audit log entries',
    }),
    // Performance Metrics
    cacheHitRate: new prom_client_1.Gauge({
        name: 'sonate_cache_hit_rate',
        help: 'Cache hit rate percentage',
    }),
    redisConnectionStatus: new prom_client_1.Gauge({
        name: 'sonate_redis_connection_status',
        help: 'Redis connection status (1=connected, 0=disconnected)',
    }),
    // Business Metrics
    activeUsers: new prom_client_1.Gauge({
        name: 'sonate_active_users',
        help: 'Number of active users',
    }),
    tenantCount: new prom_client_1.Gauge({
        name: 'sonate_tenant_count',
        help: 'Total number of tenants',
    }),
    apiRequests: new prom_client_1.Counter({
        name: 'sonate_api_requests_total',
        help: 'Total API requests',
        labelNames: ['method', 'endpoint', 'status_code'],
    }),
    // Error Metrics
    errorsTotal: new prom_client_1.Counter({
        name: 'sonate_errors_total',
        help: 'Total number of errors',
        labelNames: ['type', 'component'],
    }),
    // Performance Summary
    requestDuration: new prom_client_1.Summary({
        name: 'sonate_request_duration_seconds',
        help: 'Request duration summary',
        percentiles: [0.5, 0.9, 0.95, 0.99],
    }),
};
/**
 * Initialize monitoring system
 */
function initializeMonitoring() {
    // Collect default Node.js metrics
    (0, prom_client_1.collectDefaultMetrics)({ prefix: 'sonate_' });
    console.log('SONATE monitoring system initialized');
}
/**
 * Get metrics in Prometheus format
 */
async function getMetrics() {
    return prom_client_1.register.metrics();
}
/**
 * Reset all metrics (for testing)
 */
function resetMetrics() {
    prom_client_1.register.resetMetrics();
    (0, prom_client_1.collectDefaultMetrics)({ prefix: 'sonate_' });
}
/**
 * Health check endpoint data
 */
async function getHealthStatus() {
    const metricsData = await prom_client_1.register.getMetricsAsJSON();
    // Calculate health status based on metrics
    let status = 'healthy';
    const services = {};
    // Check Redis connection
    const redisMetrics = metricsData.find((m) => m.name === 'sonate_redis_connection_status');
    if (redisMetrics && redisMetrics.values.length > 0) {
        const redisConnected = redisMetrics.values[0].value === 1;
        services.redis = redisConnected;
        if (!redisConnected) {
            status = 'degraded';
        }
    }
    // Calculate request metrics
    const requestMetrics = metricsData.find((m) => m.name === 'sonate_api_requests_total');
    const errorMetrics = metricsData.find((m) => m.name === 'sonate_errors_total');
    const latencyMetrics = metricsData.find((m) => m.name === 'sonate_request_duration_seconds');
    const totalRequests = requestMetrics
        ? requestMetrics.values.reduce((sum, v) => sum + v.value, 0)
        : 0;
    const totalErrors = errorMetrics
        ? errorMetrics.values.reduce((sum, v) => sum + v.value, 0)
        : 0;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    // Get average latency from summary
    let averageLatency = 0;
    if (latencyMetrics && latencyMetrics.values.length > 0) {
        const quantile50 = latencyMetrics.values.find((v) => v.quantile === 0.5);
        if (quantile50) {
            averageLatency = quantile50.value;
        }
    }
    // Determine overall status
    if (errorRate > 0.05) {
        // >5% error rate
        status = 'degraded';
    }
    if (errorRate > 0.1 || averageLatency > 10) {
        // >10% error rate or >10s latency
        status = 'unhealthy';
    }
    return {
        status,
        timestamp: new Date().toISOString(),
        services,
        metrics: {
            totalRequests,
            averageLatency,
            errorRate,
        },
    };
}
// Export everything needed
__exportStar(require("./alerts"), exports);
__exportStar(require("./dashboards"), exports);
__exportStar(require("./integrations"), exports);
