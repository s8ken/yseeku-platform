/**
 * @sonate/observability - Enterprise Observability & Monitoring
 *
 * OpenTelemetry-based observability for the SONATE platform
 * Provides metrics, tracing, and monitoring for enterprise deployments
 */

// Core observability setup
export { ObservabilityManager } from './observability-manager';
export { initializeObservability, shutdownObservability } from './setup';

// Metrics collection
export { TrustMetrics } from './metrics/trust-metrics';
export { DetectionMetrics } from './metrics/detection-metrics';
export { AgentMetrics } from './metrics/agent-metrics';
export { PerformanceMetrics } from './metrics/performance-metrics';

// Tracing utilities
export { createTrustSpan, createDetectionSpan, createAgentSpan } from './tracing/span-helpers';

// Export types
export * from './types';

// Configuration
export * from './config';
