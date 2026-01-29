/**
 * @sonate/core - Performance Monitoring Utilities
 *
 * Provides utilities for tracking performance metrics and timing operations.
 */
/**
 * Performance timer for tracking operation duration
 */
export declare class PerformanceTimer {
    private startTime;
    private operation;
    private labels;
    constructor(operation: string, labels?: Record<string, string>);
    /**
     * End the timer and record the duration
     */
    end(): number;
    /**
     * End the timer and record to Prometheus histogram
     */
    endWithMetric(histogram: any): number;
}
/**
 * Decorator for timing workflow operations
 */
export declare function timeworkflow(workflowName: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Decorator for timing agent operations
 */
export declare function timeAgentOperation(agentId: string, action: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Helper to time async operations
 */
export declare function timeAsync<T>(operation: string, fn: () => Promise<T>, labels?: Record<string, string>): Promise<T>;
/**
 * Helper to time database queries
 */
export declare function timeDbQuery<T>(operation: string, collection: string, fn: () => Promise<T>): Promise<T>;
/**
 * Helper to time external API calls
 */
export declare function timeExternalApi<T>(service: string, endpoint: string, fn: () => Promise<T>): Promise<T>;
/**
 * Memory usage snapshot
 */
export interface MemorySnapshot {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
}
/**
 * Get current memory usage
 */
export declare function getMemoryUsage(): MemorySnapshot;
/**
 * Log memory usage
 */
export declare function logMemoryUsage(context?: string): void;
/**
 * CPU usage tracking (simplified)
 */
export interface CPUUsage {
    user: number;
    system: number;
}
export declare function getCPUUsage(): CPUUsage;
/**
 * Performance benchmark helper
 */
export declare class PerformanceBenchmark {
    private measurements;
    /**
     * Record a measurement
     */
    record(name: string, value: number): void;
    /**
     * Get statistics for a measurement
     */
    getStats(name: string): {
        count: number;
        min: number;
        max: number;
        avg: number;
        median: number;
    } | null;
    /**
     * Get all statistics
     */
    getAllStats(): Record<string, any>;
    /**
     * Reset all measurements
     */
    reset(): void;
    /**
     * Log all statistics
     */
    logStats(): void;
}
