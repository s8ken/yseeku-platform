/**
 * Observability Manager for SONATE Platform
 *
 * Central management for metrics, traces, and monitoring
 */
import { Span } from '@opentelemetry/api';
import { TrustObservabilityData, DetectionObservabilityData, AgentObservabilityData, SonateSpanAttributes } from './types';
/**
 * Main observability manager class
 */
export declare class ObservabilityManager {
    private tracer;
    private meter;
    private trustScoreHistogram;
    private trustViolationsCounter;
    private detectionLatencyHistogram;
    private detectionThroughputCounter;
    private agentTaskCounter;
    private agentErrorCounter;
    private cpuUsageGauge;
    private memoryUsageGauge;
    /**
     * Record trust score metrics
     */
    recordTrustScore(data: TrustObservabilityData): void;
    /**
     * Record detection performance metrics
     */
    recordDetectionPerformance(data: DetectionObservabilityData): void;
    /**
     * Record agent orchestration metrics
     */
    recordAgentActivity(data: AgentObservabilityData): void;
    /**
     * Create a custom span with SONATE attributes
     */
    createSpan(name: string, attributes?: SonateSpanAttributes): Span;
    /**
     * Get the tracer for custom instrumentation
     */
    getTracer(name?: string): import("@opentelemetry/api").Tracer;
    /**
     * Get the meter for custom metrics
     */
    getMeter(name?: string): import("@opentelemetry/api").Meter;
    /**
     * Record an error with observability context
     */
    recordError(error: Error, context?: SonateSpanAttributes): void;
}
/**
 * Singleton instance
 */
export declare const observabilityManager: ObservabilityManager;
