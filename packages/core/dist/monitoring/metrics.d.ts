/**
 * @sonate/core - Prometheus Metrics Infrastructure
 *
 * Provides production-grade metrics collection for monitoring and alerting.
 */
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
export declare const register: Registry<"text/plain; version=0.0.4; charset=utf-8">;
/**
 * Trust Protocol Metrics
 */
export declare const trustScoreHistogram: Histogram<"agent_id" | "workflow_id">;
export declare const trustReceiptsTotal: Counter<"session_id" | "status">;
export declare const trustVerificationsTotal: Counter<"agent_id" | "result">;
/**
 * Workflow Metrics
 */
export declare const workflowDurationHistogram: Histogram<"status" | "workflow_name">;
export declare const activeWorkflowsGauge: Gauge<"workflow_type">;
export declare const workflowStepDurationHistogram: Histogram<"agent_id" | "workflow_name" | "step_name">;
export declare const workflowFailuresTotal: Counter<"workflow_name" | "error_type">;
/**
 * Agent Metrics
 */
export declare const activeAgentsGauge: Gauge<"status">;
export declare const agentOperationsTotal: Counter<"operation" | "agent_id" | "status">;
export declare const agentResponseTimeHistogram: Histogram<"agent_id" | "action">;
/**
 * Resonance Metrics
 */
export declare const resonanceQualityHistogram: Histogram<"interaction_type">;
export declare const resonanceReceiptsTotal: Counter<"trust_protocol" | "resonance_level">;
export declare const realityIndexGauge: Gauge<"session_id">;
/**
 * Security Metrics
 */
export declare const securityAlertsTotal: Counter<"severity" | "alert_type">;
export declare const authFailuresTotal: Counter<"method" | "reason">;
export declare const rateLimitHitsTotal: Counter<"endpoint" | "client_id">;
/**
 * Performance Metrics
 */
export declare const dbQueryDurationHistogram: Histogram<"operation" | "collection">;
export declare const cacheOperationsTotal: Counter<"operation" | "result">;
export declare const externalApiCallsTotal: Counter<"service" | "status_code">;
export declare const externalApiDurationHistogram: Histogram<"service" | "endpoint">;
/**
 * HTTP Metrics
 */
export declare const httpRequestsTotal: Counter<"method" | "status_code" | "route">;
export declare const httpRequestDurationHistogram: Histogram<"method" | "status_code" | "route">;
export declare const httpRequestSizeHistogram: Histogram<"method" | "route">;
export declare const httpResponseSizeHistogram: Histogram<"method" | "route">;
/**
 * Helper function to get all metrics as text
 */
export declare function getMetrics(): Promise<string>;
/**
 * Helper function to get metrics as JSON
 */
export declare function getMetricsJSON(): Promise<any>;
/**
 * Reset all metrics (useful for testing)
 */
export declare function resetMetrics(): void;
