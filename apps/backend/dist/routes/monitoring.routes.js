"use strict";
/**
 * Monitoring & Metrics Routes
 * Prometheus-style metrics and system health endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
exports.incrementMetric = incrementMetric;
exports.setMetric = setMetric;
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const metrics_1 = require("../observability/metrics");
const error_utils_1 = require("../utils/error-utils");
const tracing_1 = require("../observability/tracing");
const router = (0, express_1.Router)();
// Store server start time for uptime calculation
const SERVER_START_TIME = Date.now();
const metrics = {
    sonate_trust_receipts_total: 0,
    sonate_trust_verifications_total: 0,
    sonate_resonance_receipts_total: 0,
    sonate_active_workflows: 0,
    sonate_active_agents: 0,
    sonate_security_alerts_total: 0,
    sonate_http_requests_total: 0,
    sonate_workflow_failures_total: 0,
    sonate_auth_failures_total: 0,
    sonate_agent_operations_total: 0,
    sonate_cache_operations_total: 0,
    sonate_external_api_calls_total: 0,
    sonate_rate_limit_hits_total: 0,
};
exports.metrics = metrics;
/**
 * Increment a metric counter
 */
function incrementMetric(name, value = 1) {
    if (metrics[name] !== undefined) {
        metrics[name] += value;
    }
}
/**
 * Set a gauge metric value
 */
function setMetric(name, value) {
    metrics[name] = value;
}
/**
 * @route   GET /api/metrics
 * @desc    Get Prometheus-style metrics
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const output = await (0, metrics_1.getMetrics)();
        res.set('Content-Type', 'text/plain; version=0.0.4');
        res.send(output);
    }
    catch (error) {
        logger_1.default.error('Metrics generation error', {
            error: (0, error_utils_1.getErrorMessage)(error),
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).send('# Error generating metrics\n');
    }
});
/**
 * @route   GET /api/health
 * @desc    Enhanced health check with system details
 * @access  Public
 */
router.get('/health', async (req, res) => {
    try {
        // Calculate uptime
        const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
        // Check database connection
        let databaseStatus = 'down';
        let databaseLatency;
        let databaseError;
        const dbStartTime = Date.now();
        try {
            if (mongoose_1.default.connection.readyState === 1 && mongoose_1.default.connection.db) {
                await mongoose_1.default.connection.db.admin().ping();
                databaseStatus = 'up';
                databaseLatency = Date.now() - dbStartTime;
            }
            else {
                databaseError = 'Database not connected';
            }
        }
        catch (err) {
            databaseError = (0, error_utils_1.getErrorMessage)(err) || 'Database ping failed';
        }
        // Get memory usage
        const memUsage = process.memoryUsage();
        const totalMemMB = Math.round(memUsage.heapTotal / 1024 / 1024);
        const usedMemMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const memPercentage = Math.round((usedMemMB / totalMemMB) * 100);
        let memStatus = 'ok';
        if (memPercentage > 90)
            memStatus = 'critical';
        else if (memPercentage > 75)
            memStatus = 'warning';
        // Overall health status
        let overallStatus = 'healthy';
        if (databaseStatus === 'down')
            overallStatus = 'unhealthy';
        else if (memStatus === 'critical')
            overallStatus = 'degraded';
        else if (memStatus === 'warning')
            overallStatus = 'degraded';
        res.json({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.11.1',
            uptime: uptimeSeconds,
            checks: {
                database: {
                    status: databaseStatus,
                    latency: databaseLatency,
                    error: databaseError,
                },
                memory: {
                    status: memStatus,
                    used: usedMemMB,
                    total: totalMemMB,
                    percentage: memPercentage,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Health check error', {
            error: (0, error_utils_1.getErrorMessage)(error),
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            version: 'unknown',
            uptime: 0,
            checks: {
                database: {
                    status: 'down',
                    error: (0, error_utils_1.getErrorMessage)(error),
                },
                memory: {
                    status: 'critical',
                    used: 0,
                    total: 0,
                    percentage: 0,
                },
            },
        });
    }
});
/**
 * @route   GET /api/health/live
 * @desc    Kubernetes liveness probe - basic server liveness check
 * @access  Public
 * @note    Returns 200 if the server is running, regardless of dependency health
 */
router.get('/health/live', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});
/**
 * @route   GET /api/health/ready
 * @desc    Kubernetes readiness probe - checks if server can accept traffic
 * @access  Public
 * @note    Returns 200 if DB is connected and system is healthy, 503 otherwise
 */
router.get('/health/ready', async (req, res) => {
    try {
        // Check database connection
        let isReady = false;
        if (mongoose_1.default.connection.readyState === 1 && mongoose_1.default.connection.db) {
            try {
                await mongoose_1.default.connection.db.admin().ping();
                isReady = true;
            }
            catch (err) {
                isReady = false;
            }
        }
        // Check memory (fail if critically low)
        const memUsage = process.memoryUsage();
        const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
        if (memPercentage > 95) {
            isReady = false;
        }
        if (isReady) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
                checks: {
                    database: 'connected',
                    memory: `${memPercentage}%`,
                },
            });
        }
        else {
            res.status(503).json({
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                reason: mongoose_1.default.connection.readyState !== 1 ? 'database_disconnected' : 'memory_critical',
            });
        }
    }
    catch (error) {
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            reason: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/observability/test-trace
 * @desc    Generate a sanity trace to verify OTEL/Jaeger wiring
 * @access  Public
 */
router.get('/observability/test-trace', async (req, res) => {
    try {
        const span = tracing_1.tracer.startSpan('sanity_trace');
        span.addEvent('sanity_trace_start');
        await new Promise(resolve => setTimeout(resolve, 50));
        span.addEvent('sanity_trace_end');
        span.end();
        res.json({ success: true, message: 'Trace emitted (no-op mode)' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to emit trace', error: (0, error_utils_1.getErrorMessage)(error) });
    }
});
exports.default = router;
