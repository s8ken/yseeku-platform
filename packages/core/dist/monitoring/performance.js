"use strict";
/**
 * @sonate/core - Performance Monitoring Utilities
 *
 * Provides utilities for tracking performance metrics and timing operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceBenchmark = exports.PerformanceTimer = void 0;
exports.timeworkflow = timeworkflow;
exports.timeAgentOperation = timeAgentOperation;
exports.timeAsync = timeAsync;
exports.timeDbQuery = timeDbQuery;
exports.timeExternalApi = timeExternalApi;
exports.getMemoryUsage = getMemoryUsage;
exports.logMemoryUsage = logMemoryUsage;
exports.getCPUUsage = getCPUUsage;
const logger_1 = require("../utils/logger");
const metrics_1 = require("./metrics");
/**
 * Performance timer for tracking operation duration
 */
class PerformanceTimer {
    constructor(operation, labels = {}) {
        this.operation = operation;
        this.labels = labels;
        this.startTime = Date.now();
    }
    /**
     * End the timer and record the duration
     */
    end() {
        const duration = (Date.now() - this.startTime) / 1000; // Convert to seconds
        logger_1.performanceLogger.info(`${this.operation} completed`, {
            duration_seconds: duration,
            duration_ms: duration * 1000,
            ...this.labels,
        });
        return duration;
    }
    /**
     * End the timer and record to Prometheus histogram
     */
    endWithMetric(histogram) {
        const duration = this.end();
        // Record to Prometheus histogram
        const labelValues = Object.values(this.labels);
        histogram.observe(...labelValues, duration);
        return duration;
    }
}
exports.PerformanceTimer = PerformanceTimer;
/**
 * Decorator for timing workflow operations
 */
function timeworkflow(workflowName) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const timer = new PerformanceTimer('workflow_execution', {
                workflow_name: workflowName,
            });
            try {
                const result = await originalMethod.apply(this, args);
                const duration = timer.endWithMetric(metrics_1.workflowDurationHistogram);
                // Record success
                metrics_1.workflowDurationHistogram.observe({ workflow_name: workflowName, status: 'success' }, duration);
                return result;
            }
            catch (error) {
                const duration = timer.end();
                // Record failure
                metrics_1.workflowDurationHistogram.observe({ workflow_name: workflowName, status: 'failure' }, duration);
                throw error;
            }
        };
        return descriptor;
    };
}
/**
 * Decorator for timing agent operations
 */
function timeAgentOperation(agentId, action) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const timer = new PerformanceTimer('agent_operation', {
                agent_id: agentId,
                action,
            });
            try {
                const result = await originalMethod.apply(this, args);
                timer.endWithMetric(metrics_1.agentResponseTimeHistogram);
                return result;
            }
            catch (error) {
                timer.end();
                throw error;
            }
        };
        return descriptor;
    };
}
/**
 * Helper to time async operations
 */
async function timeAsync(operation, fn, labels = {}) {
    const timer = new PerformanceTimer(operation, labels);
    try {
        const result = await fn();
        timer.end();
        return result;
    }
    catch (error) {
        timer.end();
        throw error;
    }
}
/**
 * Helper to time database queries
 */
async function timeDbQuery(operation, collection, fn) {
    const startTime = Date.now();
    try {
        const result = await fn();
        const duration = (Date.now() - startTime) / 1000;
        metrics_1.dbQueryDurationHistogram.observe({ operation, collection }, duration);
        logger_1.performanceLogger.debug('Database query completed', {
            operation,
            collection,
            duration_seconds: duration,
        });
        return result;
    }
    catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        metrics_1.dbQueryDurationHistogram.observe({ operation, collection }, duration);
        logger_1.performanceLogger.error('Database query failed', {
            operation,
            collection,
            duration_seconds: duration,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
/**
 * Helper to time external API calls
 */
async function timeExternalApi(service, endpoint, fn) {
    const startTime = Date.now();
    try {
        const result = await fn();
        const duration = (Date.now() - startTime) / 1000;
        metrics_1.externalApiDurationHistogram.observe({ service, endpoint }, duration);
        logger_1.performanceLogger.debug('External API call completed', {
            service,
            endpoint,
            duration_seconds: duration,
        });
        return result;
    }
    catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        metrics_1.externalApiDurationHistogram.observe({ service, endpoint }, duration);
        logger_1.performanceLogger.error('External API call failed', {
            service,
            endpoint,
            duration_seconds: duration,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
/**
 * Get current memory usage
 */
function getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024), // MB
    };
}
/**
 * Log memory usage
 */
function logMemoryUsage(context = 'system') {
    const usage = getMemoryUsage();
    logger_1.performanceLogger.info('Memory usage snapshot', {
        context,
        ...usage,
    });
}
/**
 * Get CPU usage since last call
 */
let lastCpuUsage = process.cpuUsage();
function getCPUUsage() {
    const current = process.cpuUsage(lastCpuUsage);
    lastCpuUsage = process.cpuUsage();
    return {
        user: Math.round(current.user / 1000), // Convert to milliseconds
        system: Math.round(current.system / 1000), // Convert to milliseconds
    };
}
/**
 * Performance benchmark helper
 */
class PerformanceBenchmark {
    constructor() {
        this.measurements = new Map();
    }
    /**
     * Record a measurement
     */
    record(name, value) {
        if (!this.measurements.has(name)) {
            this.measurements.set(name, []);
        }
        this.measurements.get(name).push(value);
    }
    /**
     * Get statistics for a measurement
     */
    getStats(name) {
        const values = this.measurements.get(name);
        if (!values || values.length === 0) {
            return null;
        }
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        return {
            count: values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: sum / values.length,
            median: sorted[Math.floor(sorted.length / 2)],
        };
    }
    /**
     * Get all statistics
     */
    getAllStats() {
        const stats = {};
        for (const [name, _] of this.measurements) {
            stats[name] = this.getStats(name);
        }
        return stats;
    }
    /**
     * Reset all measurements
     */
    reset() {
        this.measurements.clear();
    }
    /**
     * Log all statistics
     */
    logStats() {
        const stats = this.getAllStats();
        logger_1.performanceLogger.info('Performance benchmark results', {
            benchmarks: stats,
        });
    }
}
exports.PerformanceBenchmark = PerformanceBenchmark;
