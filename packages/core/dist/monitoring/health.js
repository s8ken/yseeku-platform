"use strict";
/**
 * @sonate/core - Health Check Infrastructure
 *
 * Provides health check endpoints and system status monitoring.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckManager = exports.HealthCheckManager = void 0;
exports.readinessCheck = readinessCheck;
exports.livenessCheck = livenessCheck;
exports.startupCheck = startupCheck;
const logger_1 = require("../utils/logger");
/**
 * Health check manager
 */
class HealthCheckManager {
    constructor(version = '1.4.0') {
        this.checks = new Map();
        this.startTime = Date.now();
        this.version = version;
        // Register default system checks
        this.registerCheck('memory', this.checkMemory.bind(this));
        this.registerCheck('cpu', this.checkCPU.bind(this));
    }
    /**
     * Register a health check
     */
    registerCheck(name, checkFn) {
        this.checks.set(name, checkFn);
        logger_1.log.info('Health check registered', {
            check: name,
            module: 'HealthCheckManager',
        });
    }
    /**
     * Run all health checks
     */
    async check() {
        const components = {};
        let overallStatus = 'healthy';
        // Run all checks in parallel
        const checkPromises = Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
            const startTime = Date.now();
            try {
                const result = await Promise.race([
                    checkFn(),
                    this.timeout(5000), // 5 second timeout
                ]);
                components[name] = {
                    ...result,
                    latency_ms: Date.now() - startTime,
                };
                // Determine overall status
                if (result.status === 'unhealthy') {
                    overallStatus = 'unhealthy';
                }
                else if (result.status === 'degraded' && overallStatus === 'healthy') {
                    overallStatus = 'degraded';
                }
            }
            catch (error) {
                components[name] = {
                    status: 'unhealthy',
                    message: error instanceof Error ? error.message : 'Check failed',
                    latency_ms: Date.now() - startTime,
                };
                overallStatus = 'unhealthy';
            }
        });
        await Promise.all(checkPromises);
        const uptime = (Date.now() - this.startTime) / 1000;
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime_seconds: uptime,
            version: this.version,
            components,
        };
    }
    /**
     * Timeout helper
     */
    async timeout(ms) {
        return new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), ms));
    }
    /**
     * Memory health check
     */
    async checkMemory() {
        const usage = process.memoryUsage();
        const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
        if (heapUsedPercent > 90) {
            return {
                status: 'unhealthy',
                message: 'Memory usage critical',
                details: {
                    heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
                    heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
                    heap_used_percent: Math.round(heapUsedPercent),
                },
            };
        }
        else if (heapUsedPercent > 75) {
            return {
                status: 'degraded',
                message: 'Memory usage high',
                details: {
                    heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
                    heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
                    heap_used_percent: Math.round(heapUsedPercent),
                },
            };
        }
        return {
            status: 'healthy',
            details: {
                heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
                heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
                heap_used_percent: Math.round(heapUsedPercent),
            },
        };
    }
    /**
     * CPU health check (simplified)
     */
    async checkCPU() {
        const cpuUsage = process.cpuUsage();
        const totalUsage = cpuUsage.user + cpuUsage.system;
        // Convert to percentage (simplified - actual CPU monitoring would need more logic)
        const usagePercent = (totalUsage / 1000000) * 100; // Rough estimate
        if (usagePercent > 90) {
            return {
                status: 'degraded',
                message: 'CPU usage high',
                details: {
                    user_ms: Math.round(cpuUsage.user / 1000),
                    system_ms: Math.round(cpuUsage.system / 1000),
                },
            };
        }
        return {
            status: 'healthy',
            details: {
                user_ms: Math.round(cpuUsage.user / 1000),
                system_ms: Math.round(cpuUsage.system / 1000),
            },
        };
    }
    /**
     * Get uptime in seconds
     */
    getUptime() {
        return (Date.now() - this.startTime) / 1000;
    }
    /**
     * Reset start time (useful for testing)
     */
    resetUptime() {
        this.startTime = Date.now();
    }
}
exports.HealthCheckManager = HealthCheckManager;
/**
 * Default health check manager instance
 */
exports.healthCheckManager = new HealthCheckManager();
/**
 * Readiness check - indicates if the service is ready to accept traffic
 */
async function readinessCheck() {
    const health = await exports.healthCheckManager.check();
    return health.status !== 'unhealthy';
}
/**
 * Liveness check - indicates if the service is alive (not deadlocked)
 */
async function livenessCheck() {
    // Simple check - if we can respond, we're alive
    return true;
}
/**
 * Startup check - indicates if the service has completed initialization
 */
async function startupCheck() {
    const uptime = exports.healthCheckManager.getUptime();
    // Service is considered started after 5 seconds
    return uptime > 5;
}
