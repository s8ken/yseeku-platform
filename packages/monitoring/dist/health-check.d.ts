/**
 * Comprehensive Health Check System
 *
 * Provides deep health monitoring with dependency checks,
 * circuit breakers, and automated recovery suggestions
 */
export interface HealthCheck {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    checkFunction: () => Promise<HealthCheckResult>;
    timeout: number;
    interval: number;
    lastChecked?: number;
    lastResult?: HealthCheckResult;
    consecutiveFailures: number;
    maxConsecutiveFailures: number;
    critical: boolean;
}
export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: number;
    duration: number;
    message: string;
    details?: Record<string, any>;
    dependencies?: HealthDependency[];
    recommendations?: string[];
}
export interface HealthDependency {
    name: string;
    type: 'database' | 'service' | 'cache' | 'queue' | 'external_api';
    status: 'available' | 'degraded' | 'unavailable';
    latency: number;
    metadata?: Record<string, any>;
}
export interface HealthReport {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: number;
    checks: Record<string, HealthCheckResult>;
    summary: {
        total: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
        criticalFailures: number;
    };
    affectedSystems: string[];
    recommendations: string[];
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    timeout: number;
    halfOpenAttempts: number;
}
/**
 * Comprehensive Health Check System
 */
export declare class HealthCheckSystem {
    private checks;
    private circuitBreakers;
    private healthHistory;
    private readonly MAX_HISTORY;
    private checkIntervals;
    constructor();
    /**
     * Initialize default health checks
     */
    private initializeDefaultChecks;
    /**
     * Initialize circuit breakers
     */
    private initializeCircuitBreakers;
    /**
     * Add a health check
     */
    addCheck(check: HealthCheck): void;
    /**
     * Start periodic health check
     */
    private startPeriodicCheck;
    /**
     * Stop periodic health check
     */
    private stopPeriodicCheck;
    /**
     * Run a single health check
     */
    runCheck(checkId: string): Promise<HealthCheckResult>;
    /**
     * Check database health
     */
    private checkDatabase;
    /**
     * Check Redis health
     */
    private checkRedis;
    /**
     * Check API Gateway health
     */
    private checkAPIGateway;
    /**
     * Check Trust Protocol service health
     */
    private checkTrustProtocol;
    /**
     * Check Detect service health
     */
    private checkDetectService;
    /**
     * Check HSM health
     */
    private checkHSM;
    /**
     * Check file system health
     */
    private checkFileSystem;
    /**
     * Check memory health
     */
    private checkMemory;
    /**
     * Check CPU health
     */
    private checkCPU;
    /**
     * Check network health
     */
    private checkNetwork;
    /**
     * Generate comprehensive health report
     */
    generateHealthReport(): Promise<HealthReport>;
    /**
     * Check if circuit breaker is open
     */
    private isCircuitOpen;
    /**
     * Update circuit breaker
     */
    private updateCircuitBreaker;
    /**
     * Create timeout result
     */
    private createTimeoutResult;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Get health history
     */
    getHealthHistory(count?: number): HealthReport[];
    /**
     * Stop all health checks
     */
    stopAllChecks(): void;
    /**
     * Shutdown health check system
     */
    shutdown(): void;
}
/**
 * Create health check system instance
 */
export declare function createHealthCheckSystem(): HealthCheckSystem;
/**
 * Global instance
 */
export declare const healthCheckSystem: HealthCheckSystem;
//# sourceMappingURL=health-check.d.ts.map