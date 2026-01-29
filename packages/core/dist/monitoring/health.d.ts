/**
 * @sonate/core - Health Check Infrastructure
 *
 * Provides health check endpoints and system status monitoring.
 */
/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
/**
 * Health check result for a component
 */
export interface ComponentHealth {
    status: HealthStatus;
    message?: string;
    latency_ms?: number;
    details?: Record<string, any>;
}
/**
 * Overall system health
 */
export interface SystemHealth {
    status: HealthStatus;
    timestamp: string;
    uptime_seconds: number;
    version: string;
    components: Record<string, ComponentHealth>;
}
/**
 * Health check function type
 */
export type HealthCheckFunction = () => Promise<ComponentHealth>;
/**
 * Health check manager
 */
export declare class HealthCheckManager {
    private checks;
    private startTime;
    private version;
    constructor(version?: string);
    /**
     * Register a health check
     */
    registerCheck(name: string, checkFn: HealthCheckFunction): void;
    /**
     * Run all health checks
     */
    check(): Promise<SystemHealth>;
    /**
     * Timeout helper
     */
    private timeout;
    /**
     * Memory health check
     */
    private checkMemory;
    /**
     * CPU health check (simplified)
     */
    private checkCPU;
    /**
     * Get uptime in seconds
     */
    getUptime(): number;
    /**
     * Reset start time (useful for testing)
     */
    resetUptime(): void;
}
/**
 * Default health check manager instance
 */
export declare const healthCheckManager: HealthCheckManager;
/**
 * Readiness check - indicates if the service is ready to accept traffic
 */
export declare function readinessCheck(): Promise<boolean>;
/**
 * Liveness check - indicates if the service is alive (not deadlocked)
 */
export declare function livenessCheck(): Promise<boolean>;
/**
 * Startup check - indicates if the service has completed initialization
 */
export declare function startupCheck(): Promise<boolean>;
