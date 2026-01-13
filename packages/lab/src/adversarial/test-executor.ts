/**
 * Adversarial Test Executor
 * 
 * Executes individual adversarial tests and collects results
 */

import { AdversarialTest, TestExecution, PerformanceImpact, RecoveryMetrics, Vulnerability } from './types';

// Temporary type definitions to avoid import issues during refactoring
interface TempBedauMetrics {
  bedau_index: number;
  emergence_type: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
  kolmogorov_complexity: number;
  novelty_score: number;
  downward_causation: number;
  collective_behavior_score: number;
}

interface TempSemanticIntent {
  intent_vectors: number[];
  reasoning_depth: number;
  abstraction_level: number;
  cross_domain_connections: number;
}

interface TempSurfacePattern {
  surface_vectors: number[];
  pattern_complexity: number;
  repetition_score: number;
  regularity_measure: number;
}

export class AdversarialTestExecutor {
  private executionHistory: TestExecution[] = [];

  /**
   * Execute a single adversarial test
   */
  async executeSingleTest(
    testId: string,
    baselineMetrics: TempBedauMetrics,
    semanticIntent: TempSemanticIntent,
    surfacePattern: TempSurfacePattern
  ): Promise<TestExecution> {
    const test = this.getTestById(testId);
    if (!test) {
      throw new Error(`Test with ID ${testId} not found`);
    }

    const timestamp = Date.now();
    const executionId = `exec_${testId}_${timestamp}`;

    try {
      // Apply test conditions
      const testMetrics = await this.applyTestConditions(
        baselineMetrics,
        test.parameters,
        semanticIntent,
        surfacePattern
      );

      // Calculate performance impact
      const performanceImpact = this.calculatePerformanceImpact(
        baselineMetrics,
        testMetrics
      );

      // Calculate recovery metrics
      const recoveryMetrics = await this.calculateRecoveryMetrics(
        test,
        baselineMetrics,
        testMetrics
      );

      // Identify vulnerabilities
      const vulnerabilities = this.identifyVulnerabilities(
        test,
        performanceImpact,
        recoveryMetrics
      );

      const execution: TestExecution = {
        execution_id: executionId,
        timestamp,
        test_parameters: test.parameters,
        baseline_metrics: baselineMetrics as any,
        test_metrics: testMetrics as any,
        performance_impact: performanceImpact,
        recovery_metrics: recoveryMetrics,
        vulnerabilities_identified: vulnerabilities
      };

      // Update test with new execution
      test.execution_results.push(execution);
      test.robustness_score = this.calculateTestRobustness(test.execution_results);
      
      this.executionHistory.push(execution);

      return execution;

    } catch (error) {
      throw new Error(`Test execution failed: ${error}`);
    }
  }

  /**
   * Test emergence under cognitive stress
   */
  async testCognitiveStress(
    baselineMetrics: TempBedauMetrics,
    stressLevels: number[] = [0.2, 0.4, 0.6, 0.8, 1.0]
  ): Promise<{
    stress_response_curve: number[];
    stress_threshold: number;
    degradation_pattern: string;
  }> {
    const stressResponse: number[] = [];
    
    for (const stressLevel of stressLevels) {
      const stressTest = this.createStressTest(stressLevel);
      const execution = await this.executeSingleTest(
        stressTest.test_id,
        baselineMetrics,
        this.createBaselineSemanticIntent(),
        this.createBaselineSurfacePattern()
      );
      
      stressResponse.push(execution.test_metrics.bedau_index);
    }

    // Calculate stress threshold (point where emergence drops significantly)
    const stressThreshold = this.calculateStressThreshold(stressLevels, stressResponse);
    
    // Analyze degradation pattern
    const degradationPattern = this.analyzeDegradationPattern(stressResponse);

    return {
      stress_response_curve: stressResponse,
      stress_threshold: stressThreshold,
      degradation_pattern: degradationPattern
    };
  }

  private async applyTestConditions(
    baselineMetrics: TempBedauMetrics,
    parameters: any,
    semanticIntent: TempSemanticIntent,
    surfacePattern: TempSurfacePattern
  ): Promise<TempBedauMetrics> {
    // Simulate applying test conditions to metrics
    const noiseLevel = parameters.input_perturbation.noise_level;
    const cognitiveLoad = parameters.stress_conditions.cognitive_load;
    
    return {
      ...baselineMetrics,
      bedau_index: Math.max(0, baselineMetrics.bedau_index - (noiseLevel + cognitiveLoad) * 0.3),
      emergence_type: this.determineEmergenceType(baselineMetrics.bedau_index, noiseLevel),
      kolmogorov_complexity: baselineMetrics.kolmogorov_complexity * (1 - noiseLevel * 0.2),
      novelty_score: Math.max(0, baselineMetrics.novelty_score - cognitiveLoad * 0.4),
      downward_causation: baselineMetrics.downward_causation * (1 - cognitiveLoad * 0.3),
      collective_behavior_score: baselineMetrics.collective_behavior_score * (1 - noiseLevel * 0.25)
    };
  }

  private calculatePerformanceImpact(
    baseline: TempBedauMetrics,
    test: TempBedauMetrics
  ): PerformanceImpact {
    const bedauDegradation = (baseline.bedau_index - test.bedau_index) / baseline.bedau_index;
    
    return {
      latency_increase: bedauDegradation * 1000, // ms
      throughput_decrease: bedauDegradation * 50,  // %
      memory_usage_increase: bedauDegradation * 30, // %
      cpu_usage_increase: bedauDegradation * 40     // %
    };
  }

  private async calculateRecoveryMetrics(
    test: AdversarialTest,
    baseline: TempBedauMetrics,
    testMetrics: TempBedauMetrics
  ): Promise<RecoveryMetrics> {
    // Simulate recovery time based on test severity
    const baseRecoveryTime = test.severity === 'critical' ? 10000 : 
                           test.severity === 'high' ? 5000 : 
                           test.severity === 'medium' ? 2000 : 1000;
    
    const degradation = (baseline.bedau_index - testMetrics.bedau_index) / baseline.bedau_index;
    const recoveryTime = baseRecoveryTime * (1 + degradation);

    return {
      recovery_time: recoveryTime,
      recovery_completeness: Math.max(0.7, 1 - degradation * 0.3),
      stability_after_recovery: Math.max(0.8, 1 - degradation * 0.2),
      residual_effects: degradation > 0.5 ? ['metric_drift', 'pattern_corruption'] : []
    };
  }

  private identifyVulnerabilities(
    test: AdversarialTest,
    performanceImpact: PerformanceImpact,
    recoveryMetrics: RecoveryMetrics
  ): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    if (performanceImpact.latency_increase > 2000) {
      vulnerabilities.push({
        vulnerability_id: `vuln_latency_${Date.now()}`,
        type: 'emergence_masking',
        severity: 'high',
        description: 'High latency increase indicates potential emergence masking',
        conditions: ['high_load', 'complex_input'],
        exploit_difficulty: 0.6,
        impact_assessment: 'May hide emergence signals under stress'
      });
    }

    if (recoveryMetrics.recovery_completeness < 0.8) {
      vulnerabilities.push({
        vulnerability_id: `vuln_recovery_${Date.now()}`,
        type: 'threshold_bypass',
        severity: 'medium',
        description: 'Incomplete recovery may indicate threshold bypass vulnerability',
        conditions: ['extended_stress', 'resource_depletion'],
        exploit_difficulty: 0.4,
        impact_assessment: 'Could allow persistent emergence suppression'
      });
    }

    return vulnerabilities;
  }

  private calculateTestRobustness(executions: TestExecution[]): number {
    if (executions.length === 0) return 0;
    
    const avgRobustness = executions.reduce((sum, exec) => {
      const performanceScore = Math.max(0, 1 - exec.performance_impact.latency_increase / 5000);
      const recoveryScore = exec.recovery_metrics.recovery_completeness;
      const vulnerabilityPenalty = exec.vulnerabilities_identified.length * 0.1;
      
      return sum + Math.max(0, (performanceScore + recoveryScore) / 2 - vulnerabilityPenalty);
    }, 0);
    
    return Math.max(0, Math.min(1, avgRobustness / executions.length));
  }

  private calculateStressThreshold(stressLevels: number[], responses: number[]): number {
    // Find the stress level where emergence drops below 50%
    for (let i = 0; i < responses.length; i++) {
      if (responses[i] < 0.5) {
        return stressLevels[i];
      }
    }
    return 1.0; // No threshold found
  }

  private analyzeDegradationPattern(responses: number[]): string {
    if (responses.length < 2) return 'insufficient_data';
    
    const firstHalf = responses.slice(0, Math.floor(responses.length / 2));
    const secondHalf = responses.slice(Math.floor(responses.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const degradationRate = (firstHalfAvg - secondHalfAvg) / firstHalfAvg;
    
    if (degradationRate > 0.5) return 'rapid_degradation';
    if (degradationRate > 0.2) return 'gradual_degradation';
    if (degradationRate > 0.05) return 'slow_degradation';
    return 'stable';
  }

  private determineEmergenceType(baselineIndex: number, noiseLevel: number): 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE' {
    const adjustedIndex = baselineIndex * (1 - noiseLevel * 0.5);
    
    if (adjustedIndex > 0.8) return 'HIGH_WEAK_EMERGENCE';
    if (adjustedIndex > 0.4) return 'WEAK_EMERGENCE';
    return 'LINEAR';
  }

  private createStressTest(stressLevel: number): AdversarialTest {
    return {
      test_id: `stress_test_${stressLevel}_${Date.now()}`,
      name: `Cognitive Stress Test - ${stressLevel}`,
      description: `Tests emergence under cognitive stress level ${stressLevel}`,
      test_type: 'stress',
      severity: stressLevel > 0.7 ? 'critical' : stressLevel > 0.4 ? 'high' : 'medium',
      parameters: {
        input_perturbation: {
          noise_level: stressLevel * 0.3,
          perturbation_type: 'gaussian',
          target_components: ['semantic_coherence']
        },
        stress_conditions: {
          cognitive_load: stressLevel,
          time_pressure: stressLevel * 0.8,
          resource_constraints: ['working_memory'],
          ambiguity_level: stressLevel * 0.5
        },
        edge_cases: {
          minimal_input: false,
          maximal_complexity: false,
          contradictory_input: false,
          degenerate_cases: []
        },
        adversarial_attacks: {
          attack_vectors: [],
          attack_intensity: 0,
          target_weaknesses: []
        }
      },
      expected_behavior: {
        emergence_threshold: Math.max(0.3, 0.8 - stressLevel * 0.5),
        robustness_threshold: 0.7,
        recovery_time_max: 5000,
        performance_degradation_max: stressLevel * 0.6,
        failure_modes: ['degraded_quality']
      },
      execution_results: [],
      robustness_score: 0
    };
  }

  private createBaselineSemanticIntent(): TempSemanticIntent {
    return {
      intent_vectors: [0.8, 0.6, 0.7, 0.9],
      reasoning_depth: 0.7,
      abstraction_level: 0.6,
      cross_domain_connections: 3
    };
  }

  private createBaselineSurfacePattern(): TempSurfacePattern {
    return {
      surface_vectors: [0.7, 0.8, 0.6, 0.9],
      pattern_complexity: 0.7,
      repetition_score: 0.3,
      regularity_measure: 0.6
    };
  }

  private getTestById(testId: string): AdversarialTest | null {
    // This would normally fetch from a test store
    // For now, create a dummy test
    return this.createStressTest(0.5);
  }
}
