/**
 * Performance Benchmarks for Emergence Detection System
 *
 * Provides comprehensive performance measurement and benchmarking:
 * - Bedau Index calculation performance
 * - Temporal tracking throughput
 * - Memory usage analysis
 * - Scalability testing
 * - Regression detection
 */
export interface BenchmarkResult {
    benchmark_name: string;
    timestamp: number;
    metrics: PerformanceMetrics;
    target_performance: PerformanceTargets;
    passed: boolean;
    details: BenchmarkDetails;
}
export interface PerformanceMetrics {
    execution_time_ms: number;
    memory_usage_mb: number;
    throughput_ops_per_second: number;
    latency_p50_ms: number;
    latency_p95_ms: number;
    latency_p99_ms: number;
    error_rate: number;
    cpu_usage_percent: number;
}
export interface PerformanceTargets {
    max_execution_time_ms: number;
    max_memory_usage_mb: number;
    min_throughput_ops_per_second: number;
    max_latency_p95_ms: number;
    max_error_rate: number;
}
export interface BenchmarkDetails {
    input_size: number;
    iterations: number;
    test_duration_ms: number;
    samples: number[];
    outliers: number[];
    regression_detected: boolean;
    performance_trend: 'improving' | 'stable' | 'degrading';
}
export interface ScalabilityResult {
    test_name: string;
    load_levels: LoadLevel[];
    scalability_factor: number;
    bottleneck_identified: string;
    recommendations: string[];
}
export interface LoadLevel {
    load_factor: number;
    execution_time_ms: number;
    memory_usage_mb: number;
    throughput_ops_per_second: number;
    efficiency: number;
}
export interface RegressionReport {
    test_name: string;
    baseline_metrics: PerformanceMetrics;
    current_metrics: PerformanceMetrics;
    regression_detected: boolean;
    performance_change_percent: number;
    affected_components: string[];
    severity: 'minor' | 'moderate' | 'major' | 'critical';
}
/**
 * Performance Benchmarking Engine
 *
 * Executes comprehensive performance tests and tracks regressions
 */
export declare class PerformanceBenchmarkingEngine {
    private readonly TARGET_BEDAU_CALCULATION_TIME;
    private readonly TARGET_TEMPORAL_TRACKING_THROUGHPUT;
    private readonly TARGET_MEMORY_USAGE;
    private readonly TARGET_LATENCY_P95;
    private historicalResults;
    private readonly random;
    private nextRandom;
    /**
     * Run comprehensive performance benchmark suite
     */
    runBenchmarkSuite(): Promise<{
        overall_passed: boolean;
        results: BenchmarkResult[];
        scalability: ScalabilityResult[];
        regressions: RegressionReport[];
        summary: BenchmarkSummary;
    }>;
    /**
     * Benchmark Bedau Index calculation performance
     */
    benchmarkBedauCalculation(): Promise<BenchmarkResult>;
    /**
     * Benchmark temporal tracking performance
     */
    benchmarkTemporalTracking(): Promise<BenchmarkResult>;
    /**
     * Benchmark emergence fingerprinting performance
     */
    benchmarkFingerprinting(): Promise<BenchmarkResult>;
    /**
     * Benchmark cross-modality coherence validation performance
     */
    benchmarkCoherenceValidation(): Promise<BenchmarkResult>;
    /**
     * Benchmark full pipeline performance
     */
    benchmarkFullPipeline(): Promise<BenchmarkResult>;
    /**
     * Benchmark concurrent load performance
     */
    benchmarkConcurrentLoad(): Promise<BenchmarkResult>;
    /**
     * Run scalability tests
     */
    runScalabilityTests(): Promise<ScalabilityResult[]>;
    private getBedauCalculationTargets;
    private getTemporalTrackingTargets;
    private getFingerprintingTargets;
    private getCoherenceValidationTargets;
    private getFullPipelineTargets;
    private getConcurrentLoadTargets;
    private calculateMetrics;
    private meetsTargets;
    private mean;
    private getMemoryUsage;
    private getCpuUsage;
    private detectOutliers;
    private detectRegression;
    private calculateTrend;
    private saveBenchmarkResult;
    private analyzeRegressions;
    private generateBenchmarkSummary;
    private calculatePerformanceGrade;
    private generateRecommendations;
    private testInputSizeScalability;
    private testTemporalScalability;
    private testMemoryScalability;
    private calculateScalabilityFactor;
    private identifyBottleneck;
    private generateScalabilityRecommendations;
    private createSemanticIntent;
    private createSurfacePattern;
    private createTemporalRecord;
    private createEmergenceSignature;
    private createModalityMetrics;
}
export interface BenchmarkSummary {
    total_tests: number;
    tests_passed: number;
    tests_failed: number;
    success_rate: number;
    average_execution_time_ms: number;
    max_memory_usage_mb: number;
    min_throughput_ops_per_second: number;
    overall_performance_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    recommendations: string[];
}
/**
 * Factory function for creating performance benchmarking engines
 */
export declare function createPerformanceBenchmarkingEngine(): PerformanceBenchmarkingEngine;
/**
 * Quick performance benchmark function
 */
export declare function runQuickPerformanceBenchmark(): Promise<BenchmarkSummary>;
