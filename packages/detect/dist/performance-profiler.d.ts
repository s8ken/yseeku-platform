/**
 * Performance Profiler for Detection Pipeline
 *
 * Real-time performance monitoring and optimization recommendations
 */
export interface PerformanceMetrics {
    detectionTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    throughput: number;
    errorRate: number;
}
export interface PerformanceReport {
    timestamp: number;
    metrics: PerformanceMetrics;
    bottlenecks: string[];
    recommendations: string[];
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
export interface DetectionProfile {
    contentLength: number;
    complexity: 'low' | 'medium' | 'high';
    dimensions: {
        reality: number;
        trust: number;
        ethical: number;
        resonance: number;
        canvas: number;
    };
    duration: number;
    cacheHit: boolean;
}
export declare class PerformanceProfiler {
    private profiles;
    private metrics;
    private startTime;
    private detectionCount;
    private errorCount;
    private cacheHits;
    /**
     * Record a detection profile
     */
    recordProfile(profile: DetectionProfile): void;
    /**
     * Record an error
     */
    recordError(): void;
    /**
     * Get current performance metrics
     */
    getCurrentMetrics(): PerformanceMetrics;
    /**
     * Generate performance report
     */
    generateReport(): PerformanceReport;
    /**
     * Get detailed analytics
     */
    getAnalytics(): {
        byComplexity: Record<string, DetectionProfile[]>;
        byContentLength: {
            short: DetectionProfile[];
            medium: DetectionProfile[];
            long: DetectionProfile[];
        };
        dimensionPerformance: Record<string, {
            avg: number;
            min: number;
            max: number;
        }>;
        trends: {
            detectionTime: number[];
            cacheHitRate: number[];
        };
    };
    /**
     * Reset profiler
     */
    reset(): void;
    private updateMetrics;
    private getAverageDetectionTime;
    private identifyBottlenecks;
    private generateRecommendations;
    private calculateGrade;
    private calculateDimensionStats;
    private calculateCacheHitTrends;
    /**
     * Export performance data for analysis
     */
    exportData(): {
        profiles: DetectionProfile[];
        metrics: PerformanceMetrics[];
        summary: PerformanceReport;
    };
    /**
     * Get real-time performance alerts
     */
    getAlerts(): {
        level: 'info' | 'warning' | 'critical';
        message: string;
        metric: keyof PerformanceMetrics;
        value: number;
        threshold: number;
    }[];
}
//# sourceMappingURL=performance-profiler.d.ts.map