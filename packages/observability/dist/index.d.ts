/**
 * @sonate/observability - Enterprise Observability & Monitoring
 *
 * OpenTelemetry-based observability for the SONATE platform
 * Provides metrics, tracing, and monitoring for enterprise deployments
 */
export { ObservabilityManager } from './observability-manager';
export { initializeObservability, shutdownObservability } from './setup';
export { TrustMetrics } from './metrics/trust-metrics';
export { DetectionMetrics } from './metrics/detection-metrics';
export { AgentMetrics } from './metrics/agent-metrics';
export { PerformanceMetrics } from './metrics/performance-metrics';
export { createTrustSpan, createDetectionSpan, createAgentSpan } from './tracing/span-helpers';
export * from './types';
export * from './config';
