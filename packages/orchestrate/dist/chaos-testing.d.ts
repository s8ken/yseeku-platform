/**
 * Chaos Testing Framework
 *
 * Provides automated chaos testing to validate system resilience
 * under failure conditions and stress scenarios
 */
export interface ChaosTest {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    scenario: ChaosScenario;
    failureProbability: number;
    duration: number;
    cooldown: number;
    lastRun?: number;
    results?: ChaosTestResult[];
}
export interface ChaosScenario {
    type: 'network_failure' | 'database_failure' | 'service_failure' | 'resource_exhaustion' | 'latency_spike' | 'data_corruption';
    target: string;
    config: Record<string, any>;
}
export interface ChaosTestResult {
    testId: string;
    runId: string;
    timestamp: number;
    scenario: ChaosScenario;
    status: 'running' | 'passed' | 'failed' | 'error';
    metrics: {
        recoveryTime: number;
        errorRate: number;
        availability: number;
        latency: number;
        dataLoss: boolean;
    };
    observations: string[];
    recommendations: string[];
}
export interface ChaosTestReport {
    testId: string;
    testName: string;
    timestamp: number;
    period: {
        start: number;
        end: number;
    };
    totalRuns: number;
    successRate: number;
    avgRecoveryTime: number;
    avgErrorRate: number;
    overallHealth: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    recommendations: string[];
}
/**
 * Chaos Testing Framework
 */
export declare class ChaosTestingFramework {
    private tests;
    private results;
    private activeTests;
    private readonly MAX_RESULTS;
    constructor();
    /**
     * Initialize default chaos tests
     */
    private initializeDefaultTests;
    /**
     * Add a new chaos test
     */
    addTest(test: ChaosTest): void;
    /**
     * Run a chaos test
     */
    runTest(testId: string): Promise<ChaosTestResult>;
    /**
     * Run network failure scenario
     */
    private runNetworkFailure;
    /**
     * Run database failure scenario
     */
    private runDatabaseFailure;
    /**
     * Run service failure scenario
     */
    private runServiceFailure;
    /**
     * Run resource exhaustion scenario
     */
    private runResourceExhaustion;
    /**
     * Run latency spike scenario
     */
    private runLatencySpike;
    /**
     * Run data corruption scenario
     */
    private runDataCorruption;
    /**
     * Simulate network failure
     */
    private simulateNetworkFailure;
    /**
     * Simulate database failure
     */
    private simulateDatabaseFailure;
    /**
     * Simulate service failure
     */
    private simulateServiceFailure;
    /**
     * Simulate resource exhaustion
     */
    private simulateResourceExhaustion;
    /**
     * Simulate latency spike
     */
    private simulateLatencySpike;
    /**
     * Simulate data corruption
     */
    private simulateDataCorruption;
    /**
     * Collect system metrics
     */
    private collectMetrics;
    /**
     * Calculate error rate
     */
    private calculateErrorRate;
    /**
     * Calculate availability
     */
    private calculateAvailability;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Generate test report
     */
    generateReport(testId: string): ChaosTestReport;
    /**
     * Get all tests
     */
    getAllTests(): ChaosTest[];
    /**
     * Enable/disable a test
     */
    setTestEnabled(testId: string, enabled: boolean): void;
    /**
     * Clear test results
     */
    clearResults(testId: string): void;
    /**
     * Clear all results
     */
    clearAllResults(): void;
}
/**
 * Create chaos testing framework instance
 */
export declare function createChaosTestingFramework(): ChaosTestingFramework;
/**
 * Global instance
 */
export declare const chaosTestingFramework: ChaosTestingFramework;
//# sourceMappingURL=chaos-testing.d.ts.map