/**
 * Detection Metrics for SONATE Platform
 */
import { DetectionObservabilityData } from '../types';
/**
 * Detection performance metrics collector
 */
export declare class DetectionMetrics {
    private meter;
    private detectionLatencyHistogram;
    private detectionThroughputCounter;
    private bedauIndexHistogram;
    private emergenceDetectedCounter;
    private algorithmPerformanceHistogram;
    /**
     * Record detection performance
     */
    recordDetectionPerformance(data: DetectionObservabilityData): void;
    /**
     * Record batch detection performance
     */
    recordBatchDetectionPerformance(batchData: DetectionObservabilityData[]): void;
    /**
     * Get the meter for custom detection metrics
     */
    getMeter(): import("@opentelemetry/api").Meter;
}
