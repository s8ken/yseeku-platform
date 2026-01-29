/**
 * Performance Monitor
 *
 * Collects and analyzes performance metrics
 */
import { EventEmitter } from 'events';
import { PerformanceMetrics, PerformanceThresholds, PerformanceReport } from './types';
export declare class PerformanceMonitor extends EventEmitter {
    private metrics;
    private thresholds;
    private monitoringInterval;
    private isMonitoring;
    constructor(thresholds?: Partial<PerformanceThresholds>);
    /**
     * Start performance monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Collect current performance metrics
     */
    collectMetrics(): Promise<PerformanceMetrics>;
    /**
     * Get current metrics
     */
    getCurrentMetrics(): PerformanceMetrics | null;
    /**
     * Get metrics history
     */
    getMetricsHistory(limit?: number): PerformanceMetrics[];
    /**
     * Generate performance report
     */
    generateReport(periodMs?: number): PerformanceReport;
    /**
     * Update thresholds
     */
    updateThresholds(newThresholds: Partial<PerformanceThresholds>): void;
    private gatherSystemMetrics;
    private checkThresholds;
    private calculateSummary;
    private countCriticalIssues;
    private countWarnings;
    private generateRecommendations;
}
//# sourceMappingURL=monitor.d.ts.map