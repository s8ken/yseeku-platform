/**
 * Chaos Testing Framework
 * 
 * Provides automated chaos testing to validate system resilience
 * under failure conditions and stress scenarios
 */

import {
  SystemError,
  NetworkError,
  DatabaseError
} from '@sonate/core/errors';

export interface ChaosTest {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scenario: ChaosScenario;
  failureProbability: number; // 0-1
  duration: number; // milliseconds
  cooldown: number; // milliseconds
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
  period: { start: number; end: number };
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
export class ChaosTestingFramework {
  private tests: Map<string, ChaosTest> = new Map();
  private results: Map<string, ChaosTestResult[]> = new Map();
  private activeTests: Map<string, boolean> = new Map();
  private readonly MAX_RESULTS = 1000;

  constructor() {
    this.initializeDefaultTests();
  }

  /**
   * Initialize default chaos tests
   */
  private initializeDefaultTests(): void {
    // Network failure test
    this.addTest({
      id: 'network_failure_test',
      name: 'Network Failure Resilience',
      description: 'Test system behavior under network failures',
      enabled: false, // Disabled by default
      failureProbability: 0.3,
      duration: 30000, // 30 seconds
      cooldown: 300000, // 5 minutes
      scenario: {
        type: 'network_failure',
        target: 'api_gateway',
        config: {
          failureMode: 'timeout',
          latency: 10000,
          packetLoss: 0.5
        }
      }
    });

    // Database failure test
    this.addTest({
      id: 'database_failure_test',
      name: 'Database Failure Resilience',
      description: 'Test system behavior under database failures',
      enabled: false,
      failureProbability: 0.2,
      duration: 20000, // 20 seconds
      cooldown: 600000, // 10 minutes
      scenario: {
        type: 'database_failure',
        target: 'primary_db',
        config: {
          failureMode: 'connection_refused',
          duration: 15000
        }
      }
    });

    // Service failure test
    this.addTest({
      id: 'service_failure_test',
      name: 'Service Failure Resilience',
      description: 'Test system behavior when services fail',
      enabled: false,
      failureProbability: 0.25,
      duration: 15000, // 15 seconds
      cooldown: 300000, // 5 minutes
      scenario: {
        type: 'service_failure',
        target: 'trust_protocol_service',
        config: {
          failureMode: 'crash',
          restartDelay: 5000
        }
      }
    });

    // Resource exhaustion test
    this.addTest({
      id: 'resource_exhaustion_test',
      name: 'Resource Exhaustion Resilience',
      description: 'Test system behavior under resource pressure',
      enabled: false,
      failureProbability: 0.2,
      duration: 60000, // 1 minute
      cooldown: 1800000, // 30 minutes
      scenario: {
        type: 'resource_exhaustion',
        target: 'application',
        config: {
          resource: 'memory',
          targetUsage: 0.9, // 90% usage
          duration: 45000
        }
      }
    });

    // Latency spike test
    this.addTest({
      id: 'latency_spike_test',
      name: 'Latency Spike Resilience',
      description: 'Test system behavior under latency spikes',
      enabled: false,
      failureProbability: 0.3,
      duration: 20000, // 20 seconds
      cooldown: 300000, // 5 minutes
      scenario: {
        type: 'latency_spike',
        target: 'api_gateway',
        config: {
          spikeDuration: 15000,
          spikeMultiplier: 10,
          affectedEndpoints: ['/*']
        }
      }
    });

    // Data corruption test
    this.addTest({
      id: 'data_corruption_test',
      name: 'Data Corruption Detection',
      description: 'Test data corruption detection and recovery',
      enabled: false,
      failureProbability: 0.1,
      duration: 10000, // 10 seconds
      cooldown: 3600000, // 1 hour (dangerous test)
      scenario: {
        type: 'data_corruption',
        target: 'hash_chain',
        config: {
          corruptionType: 'hash_mismatch',
          detectionRequired: true,
          autoRecovery: true
        }
      }
    });
  }

  /**
   * Add a new chaos test
   */
  addTest(test: ChaosTest): void {
    this.tests.set(test.id, test);
    this.results.set(test.id, []);
  }

  /**
   * Run a chaos test
   */
  async runTest(testId: string): Promise<ChaosTestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Chaos test not found: ${testId}`);
    }

    if (!test.enabled) {
      throw new Error(`Chaos test is disabled: ${testId}`);
    }

    // Check cooldown
    if (test.lastRun && Date.now() - test.lastRun < test.cooldown) {
      throw new Error(`Chaos test is in cooldown period: ${testId}`);
    }

    // Check if test is already running
    if (this.activeTests.get(testId)) {
      throw new Error(`Chaos test is already running: ${testId}`);
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result: ChaosTestResult = {
      testId,
      runId,
      timestamp: Date.now(),
      scenario: test.scenario,
      status: 'running',
      metrics: {
        recoveryTime: 0,
        errorRate: 0,
        availability: 1,
        latency: 0,
        dataLoss: false
      },
      observations: [],
      recommendations: []
    };

    // Mark test as active
    this.activeTests.set(testId, true);

    try {
      // Run the chaos scenario
      switch (test.scenario.type) {
        case 'network_failure':
          await this.runNetworkFailure(test.scenario, result);
          break;
        case 'database_failure':
          await this.runDatabaseFailure(test.scenario, result);
          break;
        case 'service_failure':
          await this.runServiceFailure(test.scenario, result);
          break;
        case 'resource_exhaustion':
          await this.runResourceExhaustion(test.scenario, result);
          break;
        case 'latency_spike':
          await this.runLatencySpike(test.scenario, result);
          break;
        case 'data_corruption':
          await this.runDataCorruption(test.scenario, result);
          break;
      }

      // Update test
      test.lastRun = Date.now();
      test.results = test.results || [];
      test.results.push(result);

    } catch (error) {
      result.status = 'error';
      result.observations.push(`Test error: ${error.message}`);
      result.recommendations.push('Review test configuration and error logs');
    } finally {
      // Mark test as inactive
      this.activeTests.set(testId, false);

      // Store result
      const results = this.results.get(testId) || [];
      results.push(result);
      
      // Maintain size limit
      if (results.length > this.MAX_RESULTS) {
        results.shift();
      }
      
      this.results.set(testId, results);
    }

    return result;
  }

  /**
   * Run network failure scenario
   */
  private async runNetworkFailure(
    scenario: ChaosScenario,
    result: ChaosTestResult
  ): Promise<void> {
    const { failureMode, latency, packetLoss } = scenario.config;
    
    result.observations.push(`Simulating network failure: ${failureMode}`);
    result.observations.push(`Target: ${scenario.target}`);
    
    const startTime = Date.now();
    const initialMetrics = await this.collectMetrics();

    try {
      // Simulate network failure
      await this.simulateNetworkFailure(scenario.target, {
        failureMode,
        latency,
        packetLoss,
        duration: 10000
      });

      // Wait for recovery
      await this.sleep(5000);

      // Collect recovery metrics
      const recoveryMetrics = await this.collectMetrics();
      
      result.metrics.recoveryTime = Date.now() - startTime;
      result.metrics.errorRate = this.calculateErrorRate(initialMetrics, recoveryMetrics);
      result.metrics.availability = this.calculateAvailability(initialMetrics, recoveryMetrics);
      result.metrics.latency = recoveryMetrics.avgLatency;

      // Analyze results
      if (result.metrics.recoveryTime < 30000) {
        result.status = 'passed';
        result.observations.push('System recovered within acceptable time');
      } else {
        result.status = 'failed';
        result.observations.push('System recovery time exceeded threshold');
        result.recommendations.push('Improve recovery mechanisms for network failures');
      }

      if (result.metrics.errorRate > 0.1) {
        result.recommendations.push('Implement better error handling for network failures');
      }

    } catch (error) {
      result.status = 'error';
      result.observations.push(`Network failure simulation error: ${error.message}`);
    }
  }

  /**
   * Run database failure scenario
   */
  private async runDatabaseFailure(
    scenario: ChaosScenario,
    result: ChaosTestResult
  ): Promise<void> {
    const { failureMode, duration } = scenario.config;
    
    result.observations.push(`Simulating database failure: ${failureMode}`);
    result.observations.push(`Target: ${scenario.target}`);
    
    const startTime = Date.now();
    const initialMetrics = await this.collectMetrics();

    try {
      // Simulate database failure
      await this.simulateDatabaseFailure(scenario.target, {
        failureMode,
        duration
      });

      // Wait for recovery
      await this.sleep(10000);

      // Collect recovery metrics
      const recoveryMetrics = await this.collectMetrics();
      
      result.metrics.recoveryTime = Date.now() - startTime;
      result.metrics.errorRate = this.calculateErrorRate(initialMetrics, recoveryMetrics);
      result.metrics.availability = this.calculateAvailability(initialMetrics, recoveryMetrics);

      // Analyze results
      if (result.metrics.recoveryTime < 60000) {
        result.status = 'passed';
        result.observations.push('Database recovered within acceptable time');
      } else {
        result.status = 'failed';
        result.observations.push('Database recovery time exceeded threshold');
        result.recommendations.push('Implement database failover and faster recovery');
      }

      if (result.metrics.availability < 0.9) {
        result.recommendations.push('Improve database high availability setup');
      }

    } catch (error) {
      result.status = 'error';
      result.observations.push(`Database failure simulation error: ${error.message}`);
    }
  }

  /**
   * Run service failure scenario
   */
  private async runServiceFailure(
    scenario: ChaosScenario,
    result: ChaosTestResult
  ): Promise<void> {
    const { failureMode, restartDelay } = scenario.config;
    
    result.observations.push(`Simulating service failure: ${failureMode}`);
    result.observations.push(`Target: ${scenario.target}`);
    
    const startTime = Date.now();
    const initialMetrics = await this.collectMetrics();

    try {
      // Simulate service failure
      await this.simulateServiceFailure(scenario.target, {
        failureMode,
        restartDelay
      });

      // Wait for recovery
      await this.sleep(10000);

      // Collect recovery metrics
      const recoveryMetrics = await this.collectMetrics();
      
      result.metrics.recoveryTime = Date.now() - startTime;
      result.metrics.errorRate = this.calculateErrorRate(initialMetrics, recoveryMetrics);
      result.metrics.availability = this.calculateAvailability(initialMetrics, recoveryMetrics);

      // Analyze results
      if (result.metrics.recoveryTime < 45000) {
        result.status = 'passed';
        result.observations.push('Service restarted within acceptable time');
      } else {
        result.status = 'failed';
        result.observations.push('Service recovery time exceeded threshold');
        result.recommendations.push('Optimize service restart and recovery procedures');
      }

    } catch (error) {
      result.status = 'error';
      result.observations.push(`Service failure simulation error: ${error.message}`);
    }
  }

  /**
   * Run resource exhaustion scenario
   */
  private async runResourceExhaustion(
    scenario: ChaosScenario,
    result: ChaosTestResult
  ): Promise<void> {
    const { resource, targetUsage, duration } = scenario.config;
    
    result.observations.push(`Simulating ${resource} exhaustion: ${targetUsage * 100}%`);
    result.observations.push(`Target: ${scenario.target}`);
    
    const startTime = Date.now();
    const initialMetrics = await this.collectMetrics();

    try {
      // Simulate resource exhaustion
      await this.simulateResourceExhaustion(scenario.target, {
        resource,
        targetUsage,
        duration
      });

      // Wait for recovery
      await this.sleep(15000);

      // Collect recovery metrics
      const recoveryMetrics = await this.collectMetrics();
      
      result.metrics.recoveryTime = Date.now() - startTime;
      result.metrics.errorRate = this.calculateErrorRate(initialMetrics, recoveryMetrics);
      result.metrics.availability = this.calculateAvailability(initialMetrics, recoveryMetrics);

      // Analyze results
      if (result.metrics.availability > 0.7) {
        result.status = 'passed';
        result.observations.push('System maintained acceptable availability under resource pressure');
      } else {
        result.status = 'failed';
        result.observations.push('System availability degraded significantly');
        result.recommendations.push('Implement better resource management and autoscaling');
      }

    } catch (error) {
      result.status = 'error';
      result.observations.push(`Resource exhaustion simulation error: ${error.message}`);
    }
  }

  /**
   * Run latency spike scenario
   */
  private async runLatencySpike(
    scenario: ChaosScenario,
    result: ChaosTestResult
  ): Promise<void> {
    const { spikeDuration, spikeMultiplier, affectedEndpoints } = scenario.config;
    
    result.observations.push(`Simulating latency spike: ${spikeMultiplier}x`);
    result.observations.push(`Target: ${scenario.target}`);
    
    const startTime = Date.now();
    const initialMetrics = await this.collectMetrics();

    try {
      // Simulate latency spike
      await this.simulateLatencySpike(scenario.target, {
        spikeDuration,
        spikeMultiplier,
        affectedEndpoints
      });

      // Wait for recovery
      await this.sleep(5000);

      // Collect recovery metrics
      const recoveryMetrics = await this.collectMetrics();
      
      result.metrics.recoveryTime = Date.now() - startTime;
      result.metrics.errorRate = this.calculateErrorRate(initialMetrics, recoveryMetrics);
      result.metrics.latency = recoveryMetrics.avgLatency;

      // Analyze results
      if (result.metrics.latency < 1000) {
        result.status = 'passed';
        result.observations.push('Latency returned to acceptable levels after spike');
      } else {
        result.status = 'failed';
        result.observations.push('Latency remained elevated after spike');
        result.recommendations.push('Implement better latency management and caching');
      }

    } catch (error) {
      result.status = 'error';
      result.observations.push(`Latency spike simulation error: ${error.message}`);
    }
  }

  /**
   * Run data corruption scenario
   */
  private async runDataCorruption(
    scenario: ChaosScenario,
    result: ChaosTestResult
  ): Promise<void> {
    const { corruptionType, detectionRequired, autoRecovery } = scenario.config;
    
    result.observations.push(`Simulating data corruption: ${corruptionType}`);
    result.observations.push(`Target: ${scenario.target}`);
    
    const startTime = Date.now();

    try {
      // Simulate data corruption
      const corruptionResult = await this.simulateDataCorruption(scenario.target, {
        corruptionType,
        detectionRequired,
        autoRecovery
      });

      result.metrics.dataLoss = corruptionResult.dataLoss;
      result.metrics.recoveryTime = Date.now() - startTime;

      // Analyze results
      if (corruptionResult.detected) {
        result.observations.push('Data corruption was detected');
        
        if (autoRecovery && corruptionResult.recovered) {
          result.status = 'passed';
          result.observations.push('Data corruption was automatically recovered');
        } else if (!corruptionResult.dataLoss) {
          result.status = 'passed';
          result.observations.push('No data loss occurred');
        } else {
          result.status = 'failed';
          result.observations.push('Data loss occurred despite detection');
          result.recommendations.push('Implement automatic data recovery mechanisms');
        }
      } else {
        result.status = 'failed';
        result.observations.push('Data corruption was not detected');
        result.recommendations.push('Improve data corruption detection');
      }

    } catch (error) {
      result.status = 'error';
      result.observations.push(`Data corruption simulation error: ${error.message}`);
    }
  }

  /**
   * Simulate network failure
   */
  private async simulateNetworkFailure(
    target: string,
    config: Record<string, any>
  ): Promise<void> {
    // In production, this would use network simulation tools
    // For now, we'll simulate by logging
    console.log(`[CHAOS] Simulating network failure for ${target}:`, config);
    await this.sleep(config.duration || 10000);
  }

  /**
   * Simulate database failure
   */
  private async simulateDatabaseFailure(
    target: string,
    config: Record<string, any>
  ): Promise<void> {
    console.log(`[CHAOS] Simulating database failure for ${target}:`, config);
    await this.sleep(config.duration || 15000);
  }

  /**
   * Simulate service failure
   */
  private async simulateServiceFailure(
    target: string,
    config: Record<string, any>
  ): Promise<void> {
    console.log(`[CHAOS] Simulating service failure for ${target}:`, config);
    await this.sleep(config.restartDelay || 5000);
  }

  /**
   * Simulate resource exhaustion
   */
  private async simulateResourceExhaustion(
    target: string,
    config: Record<string, any>
  ): Promise<void> {
    console.log(`[CHAOS] Simulating resource exhaustion for ${target}:`, config);
    await this.sleep(config.duration || 30000);
  }

  /**
   * Simulate latency spike
   */
  private async simulateLatencySpike(
    target: string,
    config: Record<string, any>
  ): Promise<void> {
    console.log(`[CHAOS] Simulating latency spike for ${target}:`, config);
    await this.sleep(config.spikeDuration || 15000);
  }

  /**
   * Simulate data corruption
   */
  private async simulateDataCorruption(
    target: string,
    config: Record<string, any>
  ): Promise<{ detected: boolean; recovered: boolean; dataLoss: boolean }> {
    console.log(`[CHAOS] Simulating data corruption for ${target}:`, config);
    
    // Simulate detection
    const detected = config.detectionRequired;
    
    // Simulate recovery
    const recovered = config.autoRecovery && detected;
    
    // Simulate data loss
    const dataLoss = detected && !recovered;
    
    return { detected, recovered, dataLoss };
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<{
    totalRequests: number;
    errorCount: number;
    avgLatency: number;
    availability: number;
  }> {
    // In production, this would query monitoring systems
    // For now, return simulated metrics
    return {
      totalRequests: 1000,
      errorCount: 10,
      avgLatency: 100,
      availability: 0.99
    };
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(
    initial: any,
    recovery: any
  ): number {
    if (recovery.totalRequests === 0) return 0;
    return recovery.errorCount / recovery.totalRequests;
  }

  /**
   * Calculate availability
   */
  private calculateAvailability(
    initial: any,
    recovery: any
  ): number {
    return recovery.availability;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate test report
   */
  generateReport(testId: string): ChaosTestReport {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Chaos test not found: ${testId}`);
    }

    const results = this.results.get(testId) || [];
    
    if (results.length === 0) {
      return {
        testId,
        testName: test.name,
        timestamp: Date.now(),
        period: { start: 0, end: 0 },
        totalRuns: 0,
        successRate: 0,
        avgRecoveryTime: 0,
        avgErrorRate: 0,
        overallHealth: 'HEALTHY',
        recommendations: ['Run chaos tests to assess system resilience']
      };
    }

    const passed = results.filter(r => r.status === 'passed').length;
    const successRate = passed / results.length;
    const avgRecoveryTime = results.reduce((sum, r) => sum + r.metrics.recoveryTime, 0) / results.length;
    const avgErrorRate = results.reduce((sum, r) => sum + r.metrics.errorRate, 0) / results.length;

    let overallHealth: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    if (successRate > 0.8 && avgErrorRate < 0.1) {
      overallHealth = 'HEALTHY';
    } else if (successRate > 0.5) {
      overallHealth = 'DEGRADED';
    } else {
      overallHealth = 'UNHEALTHY';
    }

    const recommendations = results.flatMap(r => r.recommendations);
    const uniqueRecommendations = [...new Set(recommendations)];

    return {
      testId,
      testName: test.name,
      timestamp: Date.now(),
      period: {
        start: results[0].timestamp,
        end: results[results.length - 1].timestamp
      },
      totalRuns: results.length,
      successRate,
      avgRecoveryTime,
      avgErrorRate,
      overallHealth,
      recommendations: uniqueRecommendations
    };
  }

  /**
   * Get all tests
   */
  getAllTests(): ChaosTest[] {
    return Array.from(this.tests.values());
  }

  /**
   * Enable/disable a test
   */
  setTestEnabled(testId: string, enabled: boolean): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Chaos test not found: ${testId}`);
    }
    test.enabled = enabled;
  }

  /**
   * Clear test results
   */
  clearResults(testId: string): void {
    this.results.set(testId, []);
  }

  /**
   * Clear all results
   */
  clearAllResults(): void {
    for (const testId of this.tests.keys()) {
      this.results.set(testId, []);
    }
  }
}

/**
 * Create chaos testing framework instance
 */
export function createChaosTestingFramework(): ChaosTestingFramework {
  return new ChaosTestingFramework();
}

/**
 * Global instance
 */
export const chaosTestingFramework = createChaosTestingFramework();