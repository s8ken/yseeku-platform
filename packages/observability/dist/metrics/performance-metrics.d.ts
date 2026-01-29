/**
 * Performance Metrics for SONATE Platform
 */
import { PerformanceObservabilityData } from '../types';
/**
 * System performance metrics collector
 */
export declare class PerformanceMetrics {
    private meter;
    private cpuUsageGauge;
    private memoryUsageGauge;
    private diskUsageGauge;
    private responseTimeHistogram;
    private errorRateGauge;
    private networkIOCounter;
    /**
     * Record performance metrics
     */
    recordPerformanceMetrics(data: PerformanceObservabilityData): void;
    /**
     * Setup observable gauges for system metrics
     */
    setupObservableGauges(): void;
    /**
     * Get current CPU usage (simplified implementation)
     */
    private getCPUUsage;
    /**
     * Get current memory usage in bytes
     */
    private getMemoryUsage;
    /**
     * Get current disk usage in bytes (placeholder)
     */
    private getDiskUsage;
    /**
     * Get current error rate (placeholder)
     */
    private getErrorRate;
    /**
     * Record custom performance metric
     */
    recordCustomMetric(name: string, value: number, attributes?: Record<string, string>): void;
    /**
     * Create a custom counter
     */
    createCounter(name: string, description: string, unit?: string): import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
    /**
     * Create a custom histogram
     */
    createHistogram(name: string, description: string, unit?: string): import("@opentelemetry/api").Histogram<import("@opentelemetry/api").Attributes>;
    /**
     * Create a custom gauge
     */
    createGauge(name: string, description: string, unit?: string): import("@opentelemetry/api").ObservableGauge<import("@opentelemetry/api").Attributes>;
    /**
     * Get the meter for custom performance metrics
     */
    getMeter(): import("@opentelemetry/api").Meter;
}
