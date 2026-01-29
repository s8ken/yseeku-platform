"use strict";
/**
 * Performance Metrics for SONATE Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMetrics = void 0;
const api_1 = require("@opentelemetry/api");
/**
 * System performance metrics collector
 */
class PerformanceMetrics {
    constructor() {
        this.meter = api_1.metrics.getMeter('sonate-performance');
        this.cpuUsageGauge = this.meter.createObservableGauge('sonate_cpu_usage_percent', {
            description: 'CPU usage percentage',
            unit: '%',
        });
        this.memoryUsageGauge = this.meter.createObservableGauge('sonate_memory_usage_bytes', {
            description: 'Memory usage in bytes',
            unit: 'bytes',
        });
        this.diskUsageGauge = this.meter.createObservableGauge('sonate_disk_usage_bytes', {
            description: 'Disk usage in bytes',
            unit: 'bytes',
        });
        this.responseTimeHistogram = this.meter.createHistogram('sonate_response_time_ms', {
            description: 'Response time in milliseconds',
            unit: 'ms',
        });
        this.errorRateGauge = this.meter.createObservableGauge('sonate_error_rate_percent', {
            description: 'Error rate percentage',
            unit: '%',
        });
        this.networkIOCounter = this.meter.createCounter('sonate_network_io_bytes_total', {
            description: 'Total network I/O in bytes',
            unit: 'bytes',
        });
    }
    /**
     * Record performance metrics
     */
    recordPerformanceMetrics(data) {
        // Record response time
        this.responseTimeHistogram.record(data.responseTime, {
            'sonate.service': data.service,
        });
        // Record network I/O
        this.networkIOCounter.add(data.networkIO, {
            'sonate.service': data.service,
            'sonate.network.direction': 'total',
        });
    }
    /**
     * Setup observable gauges for system metrics
     */
    setupObservableGauges() {
        // CPU usage gauge
        this.cpuUsageGauge.addCallback((observableResult) => {
            const cpuUsage = this.getCPUUsage();
            observableResult.observe(cpuUsage, {
                'sonate.service': 'system',
            });
        });
        // Memory usage gauge
        this.memoryUsageGauge.addCallback((observableResult) => {
            const memoryUsage = this.getMemoryUsage();
            observableResult.observe(memoryUsage, {
                'sonate.service': 'system',
            });
        });
        // Disk usage gauge
        this.diskUsageGauge.addCallback((observableResult) => {
            const diskUsage = this.getDiskUsage();
            observableResult.observe(diskUsage, {
                'sonate.service': 'system',
            });
        });
        // Error rate gauge
        this.errorRateGauge.addCallback((observableResult) => {
            const errorRate = this.getErrorRate();
            observableResult.observe(errorRate, {
                'sonate.service': 'system',
            });
        });
    }
    /**
     * Get current CPU usage (simplified implementation)
     */
    getCPUUsage() {
        // In a real implementation, this would use system monitoring libraries
        // For now, return a placeholder value
        return Math.random() * 100;
    }
    /**
     * Get current memory usage in bytes
     */
    getMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            return usage.heapUsed;
        }
        // Fallback for browser or other environments
        return 0;
    }
    /**
     * Get current disk usage in bytes (placeholder)
     */
    getDiskUsage() {
        // In a real implementation, this would check actual disk usage
        // For now, return a placeholder value
        return 1024 * 1024 * 1024; // 1GB placeholder
    }
    /**
     * Get current error rate (placeholder)
     */
    getErrorRate() {
        // In a real implementation, this would track actual error rates
        // For now, return a placeholder value
        return Math.random() * 5; // 0-5% error rate
    }
    /**
     * Record custom performance metric
     */
    recordCustomMetric(name, value, attributes) {
        const histogram = this.meter.createHistogram(name, {
            description: `Custom performance metric: ${name}`,
            unit: 'value',
        });
        histogram.record(value, attributes);
    }
    /**
     * Create a custom counter
     */
    createCounter(name, description, unit) {
        return this.meter.createCounter(name, {
            description,
            unit: unit || '1',
        });
    }
    /**
     * Create a custom histogram
     */
    createHistogram(name, description, unit) {
        return this.meter.createHistogram(name, {
            description,
            unit: unit || 'value',
        });
    }
    /**
     * Create a custom gauge
     */
    createGauge(name, description, unit) {
        return this.meter.createObservableGauge(name, {
            description,
            unit: unit || 'value',
        });
    }
    /**
     * Get the meter for custom performance metrics
     */
    getMeter() {
        return this.meter;
    }
}
exports.PerformanceMetrics = PerformanceMetrics;
