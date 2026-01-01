/**
 * SONATE Monitoring & Observability
 * Enterprise-grade monitoring system for AI governance
 */

import { register, collectDefaultMetrics, Gauge, Counter, Histogram, Summary } from 'prom-client';

// Core metrics collectors
export const metrics = {
  // AI Detection Metrics
  detectionRequests: new Counter({
    name: 'sonate_detection_requests_total',
    help: 'Total number of AI detection requests',
    labelNames: ['model', 'status']
  }),

  detectionLatency: new Histogram({
    name: 'sonate_detection_duration_seconds',
    help: 'Time spent processing detection requests',
    labelNames: ['model'],
    buckets: [0.1, 0.5, 1, 2.5, 5, 10]
  }),

  embeddingCacheHits: new Counter({
    name: 'sonate_embedding_cache_hits_total',
    help: 'Number of embedding cache hits'
  }),

  embeddingCacheMisses: new Counter({
    name: 'sonate_embedding_cache_misses_total',
    help: 'Number of embedding cache misses'
  }),

  // Trust & Confidence Metrics
  trustScoreDistribution: new Histogram({
    name: 'sonate_trust_score_distribution',
    help: 'Distribution of trust scores',
    buckets: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  }),

  confidenceLevel: new Gauge({
    name: 'sonate_confidence_level',
    help: 'Current confidence level in AI assessments',
    labelNames: ['session_id']
  }),

  // Security & Audit Metrics
  securityEvents: new Counter({
    name: 'sonate_security_events_total',
    help: 'Total number of security events',
    labelNames: ['type', 'severity']
  }),

  auditLogEntries: new Counter({
    name: 'sonate_audit_log_entries_total',
    help: 'Total number of audit log entries'
  }),

  // Performance Metrics
  cacheHitRate: new Gauge({
    name: 'sonate_cache_hit_rate',
    help: 'Cache hit rate percentage'
  }),

  redisConnectionStatus: new Gauge({
    name: 'sonate_redis_connection_status',
    help: 'Redis connection status (1=connected, 0=disconnected)'
  }),

  // Business Metrics
  activeUsers: new Gauge({
    name: 'sonate_active_users',
    help: 'Number of active users'
  }),

  tenantCount: new Gauge({
    name: 'sonate_tenant_count',
    help: 'Total number of tenants'
  }),

  apiRequests: new Counter({
    name: 'sonate_api_requests_total',
    help: 'Total API requests',
    labelNames: ['method', 'endpoint', 'status_code']
  }),

  // Error Metrics
  errorsTotal: new Counter({
    name: 'sonate_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'component']
  }),

  // Performance Summary
  requestDuration: new Summary({
    name: 'sonate_request_duration_seconds',
    help: 'Request duration summary',
    percentiles: [0.5, 0.9, 0.95, 0.99]
  })
};

/**
 * Initialize monitoring system
 */
export function initializeMonitoring(): void {
  // Collect default Node.js metrics
  collectDefaultMetrics({ prefix: 'sonate_' });

  console.log('SONATE monitoring system initialized');
}

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics(): void {
  register.resetMetrics();
  collectDefaultMetrics({ prefix: 'sonate_' });
}

/**
 * Health check endpoint data
 */
export async function getHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: Record<string, boolean>;
  metrics: {
    totalRequests: number;
    averageLatency: number;
    errorRate: number;
  };
}> {
  const metricsData = await register.getMetricsAsJSON();

  // Calculate health status based on metrics
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  const services: Record<string, boolean> = {};

  // Check Redis connection
  const redisMetrics = metricsData.find((m: any) => m.name === 'sonate_redis_connection_status');
  if (redisMetrics && redisMetrics.values.length > 0) {
    const redisConnected = redisMetrics.values[0].value === 1;
    services.redis = redisConnected;
    if (!redisConnected) status = 'degraded';
  }

  // Calculate request metrics
  const requestMetrics = metricsData.find((m: any) => m.name === 'sonate_api_requests_total');
  const errorMetrics = metricsData.find((m: any) => m.name === 'sonate_errors_total');
  const latencyMetrics = metricsData.find((m: any) => m.name === 'sonate_request_duration_seconds');

  const totalRequests = requestMetrics ? requestMetrics.values.reduce((sum: number, v: any) => sum + v.value, 0) : 0;
  const totalErrors = errorMetrics ? errorMetrics.values.reduce((sum: number, v: any) => sum + v.value, 0) : 0;
  const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

  // Get average latency from summary
  let averageLatency = 0;
  if (latencyMetrics && latencyMetrics.values.length > 0) {
    const quantile50 = latencyMetrics.values.find((v: any) => v.quantile === 0.5);
    if (quantile50) averageLatency = quantile50.value;
  }

  // Determine overall status
  if (errorRate > 0.05) { // >5% error rate
    status = 'degraded';
  }
  if (errorRate > 0.10 || averageLatency > 10) { // >10% error rate or >10s latency
    status = 'unhealthy';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    services,
    metrics: {
      totalRequests,
      averageLatency,
      errorRate
    }
  };
}

// Export everything needed
export * from './alerts';
export * from './dashboards';
export * from './integrations';