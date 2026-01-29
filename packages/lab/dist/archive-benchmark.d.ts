/**
 * Archive-Based Benchmarking Suite for Conversational Metrics
 *
 * Comprehensive testing and calibration system using historical
 * conversation archives to validate Phase-Shift Velocity metrics
 * and optimize detection parameters.
 */
export interface BenchmarkConfig {
    testName: string;
    description: string;
    metricConfigs: Array<{
        name: string;
        yellowThreshold: number;
        redThreshold: number;
        identityStabilityThreshold: number;
        windowSize: number;
    }>;
    validationCriteria: {
        minDetectionRate: number;
        maxFalsePositiveRate: number;
        minPhaseShiftAccuracy: number;
    };
}
export interface BenchmarkResult {
    config: BenchmarkConfig;
    totalConversations: number;
    totalTurns: number;
    detectedPhaseShifts: number;
    falsePositives: number;
    falseNegatives: number;
    detectionRate: number;
    falsePositiveRate: number;
    accuracy: number;
    parameterOptimization: {
        optimalYellowThreshold: number;
        optimalRedThreshold: number;
        optimalIdentityThreshold: number;
        optimalWindowSize: number;
    };
    systemPerformance: {
        byAI: Record<string, {
            conversations: number;
            avgPhaseShiftVelocity: number;
            avgIdentityStability: number;
            alertRate: number;
        }>;
    };
}
export declare class ArchiveBenchmarkSuite {
    private archiveAnalyzer;
    private experimentOrchestrator;
    private statisticalEngine;
    private conversations;
    constructor();
    /**
     * Load and prepare archive data for benchmarking
     */
    initialize(): Promise<void>;
    /**
     * Run comprehensive benchmark with multiple metric configurations
     */
    runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult>;
    /**
     * Test a specific metric configuration against archive data
     */
    private testMetricConfiguration;
    /**
     * Estimate expected phase shifts based on archive analysis
     */
    private estimateExpectedPhaseShifts;
    /**
     * Calculate composite score for configuration comparison
     */
    private calculateCompositeScore;
    /**
     * Generate optimal parameters based on benchmark results
     */
    calibrateParameters(): Promise<{
        yellowThreshold: number;
        redThreshold: number;
        identityStabilityThreshold: number;
        windowSize: number;
    }>;
    /**
     * Generate comprehensive benchmark report
     */
    generateReport(result: BenchmarkResult): string;
}
//# sourceMappingURL=archive-benchmark.d.ts.map