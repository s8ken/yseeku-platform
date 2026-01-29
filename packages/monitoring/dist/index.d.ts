/**
 * SONATE Monitoring & Observability
 * Enterprise-grade monitoring system for AI governance
 */
import { Gauge, Counter, Histogram, Summary } from 'prom-client';
export declare const metrics: {
    detectionRequests: Counter<"status" | "model">;
    detectionLatency: Histogram<"model">;
    embeddingCacheHits: Counter<string>;
    embeddingCacheMisses: Counter<string>;
    trustScoreDistribution: Histogram<string>;
    confidenceLevel: Gauge<"session_id">;
    securityEvents: Counter<"type" | "severity">;
    auditLogEntries: Counter<string>;
    cacheHitRate: Gauge<string>;
    redisConnectionStatus: Gauge<string>;
    activeUsers: Gauge<string>;
    tenantCount: Gauge<string>;
    apiRequests: Counter<"method" | "endpoint" | "status_code">;
    errorsTotal: Counter<"type" | "component">;
    requestDuration: Summary<string>;
};
/**
 * Initialize monitoring system
 */
export declare function initializeMonitoring(): void;
/**
 * Get metrics in Prometheus format
 */
export declare function getMetrics(): Promise<string>;
/**
 * Reset all metrics (for testing)
 */
export declare function resetMetrics(): void;
/**
 * Health check endpoint data
 */
export declare function getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: Record<string, boolean>;
    metrics: {
        totalRequests: number;
        averageLatency: number;
        errorRate: number;
    };
}>;
export * from './alerts';
export * from './dashboards';
export * from './integrations';
//# sourceMappingURL=index.d.ts.map