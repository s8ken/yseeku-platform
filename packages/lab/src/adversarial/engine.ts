/**
 * Adversarial Emergence Testing Engine
 *
 * Main orchestrator for adversarial emergence testing
 */

import { AdversarialTestExecutor } from './test-executor';
import { AdversarialTestFactory } from './test-factory';
import { AdversarialTest, EmergenceStressReport } from './types';

// Temporary types to avoid import issues during refactoring
interface TempBedauMetrics {
  bedau_index: number;
  emergence_type: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
  kolmogorov_complexity: number;
  novelty_score: number;
  downward_causation: number;
  collective_behavior_score: number;
}

export class AdversarialEmergenceTestingEngine {
  private testFactory: AdversarialTestFactory;
  private testExecutor: AdversarialTestExecutor;
  private testSuite: AdversarialTest[] = [];
  private executionHistory: any[] = [];

  constructor() {
    this.testFactory = new AdversarialTestFactory();
    this.testExecutor = new AdversarialTestExecutor();
  }

  /**
   * Run comprehensive adversarial test suite
   */
  async runComprehensiveTestSuite(
    baselineMetrics: TempBedauMetrics
  ): Promise<EmergenceStressReport> {
    const reportId = `report_${Date.now()}`;
    const timestamp = Date.now();

    // Create test suite
    await this.createTestSuite(baselineMetrics);

    // Execute all tests
    const testResults: AdversarialTest[] = [];
    for (const test of this.testSuite) {
      try {
        await this.testExecutor.executeSingleTest(
          test.test_id,
          baselineMetrics,
          this.createBaselineSemanticIntent(),
          this.createBaselineSurfacePattern()
        );
        testResults.push(test);
      } catch (error) {
        console.error(`Test ${test.test_id} failed:`, error);
      }
    }

    // Calculate overall metrics
    const overallRobustnessScore = this.calculateOverallRobustness(testResults);
    const vulnerabilitySummary = this.calculateVulnerabilitySummary(testResults);
    const recommendations = this.generateRecommendations(testResults, vulnerabilitySummary);
    const nextTestSuggestions = this.generateNextTestSuggestions(testResults);

    return {
      report_id: reportId,
      test_suite_id: `suite_${timestamp}`,
      timestamp,
      overall_robustness_score: overallRobustnessScore,
      stress_test_results: testResults,
      vulnerability_summary: vulnerabilitySummary,
      recommendations,
      next_test_suggestions: nextTestSuggestions,
    };
  }

  /**
   * Test specific stress conditions
   */
  async testStressConditions(
    baselineMetrics: TempBedauMetrics,
    stressLevels: number[] = [0.2, 0.4, 0.6, 0.8, 1.0]
  ): Promise<{
    stress_response_curve: number[];
    stress_threshold: number;
    degradation_pattern: string;
    robustness_under_stress: number;
  }> {
    const stressResults = await this.testExecutor.testCognitiveStress(
      baselineMetrics,
      stressLevels
    );

    const robustnessUnderStress = this.calculateRobustnessUnderStress(
      stressResults.stress_response_curve
    );

    return {
      ...stressResults,
      robustness_under_stress: robustnessUnderStress,
    };
  }

  /**
   * Test edge cases
   */
  async testEdgeCases(baselineMetrics: TempBedauMetrics): Promise<{
    minimal_input_robustness: number;
    maximal_complexity_handling: number;
    contradiction_tolerance: number;
    overall_edge_case_score: number;
  }> {
    const edgeCases = ['minimal', 'maximal', 'contradictory'] as const;
    const results: number[] = [];

    for (const edgeCase of edgeCases) {
      const test = this.testFactory.createEdgeCaseTest(edgeCase);
      try {
        await this.testExecutor.executeSingleTest(
          test.test_id,
          baselineMetrics,
          this.createBaselineSemanticIntent(),
          this.createBaselineSurfacePattern()
        );
        results.push(test.robustness_score);
      } catch (error) {
        console.error(`Edge case ${edgeCase} failed:`, error);
        results.push(0);
      }
    }

    return {
      minimal_input_robustness: results[0],
      maximal_complexity_handling: results[1],
      contradiction_tolerance: results[2],
      overall_edge_case_score: results.reduce((a, b) => a + b, 0) / results.length,
    };
  }

  /**
   * Test adversarial attacks
   */
  async testAdversarialAttacks(
    baselineMetrics: TempBedauMetrics,
    attackTypes: string[] = ['prompt_injection', 'context_manipulation', 'metric_gaming'],
    intensity: number = 0.7
  ): Promise<{
    attack_resistance_scores: Record<string, number>;
    overall_attack_resistance: number;
    identified_vulnerabilities: string[];
  }> {
    const resistanceScores: Record<string, number> = {};
    const vulnerabilities: string[] = [];

    for (const attackType of attackTypes) {
      const test = this.testFactory.createAdversarialAttackTest(attackType as any, intensity);
      try {
        await this.testExecutor.executeSingleTest(
          test.test_id,
          baselineMetrics,
          this.createBaselineSemanticIntent(),
          this.createBaselineSurfacePattern()
        );
        resistanceScores[attackType] = test.robustness_score;

        // Collect vulnerabilities from execution
        const lastExecution = test.execution_results[test.execution_results.length - 1];
        if (lastExecution) {
          vulnerabilities.push(...lastExecution.vulnerabilities_identified.map((v) => v.type));
        }
      } catch (error) {
        console.error(`Attack test ${attackType} failed:`, error);
        resistanceScores[attackType] = 0;
      }
    }

    const overallResistance =
      Object.values(resistanceScores).reduce((a, b) => a + b, 0) /
      Object.values(resistanceScores).length;

    return {
      attack_resistance_scores: resistanceScores,
      overall_attack_resistance: overallResistance,
      identified_vulnerabilities: [...new Set(vulnerabilities)],
    };
  }

  private async createTestSuite(baselineMetrics: TempBedauMetrics): Promise<void> {
    this.testSuite = [];

    // Add cognitive stress tests
    const stressLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    for (const level of stressLevels) {
      this.testSuite.push(this.testFactory.createCognitiveStressTest(level, baselineMetrics));
    }

    // Add edge case tests
    const edgeCases = ['minimal', 'maximal', 'contradictory'] as const;
    for (const edgeCase of edgeCases) {
      this.testSuite.push(this.testFactory.createEdgeCaseTest(edgeCase));
    }

    // Add adversarial attack tests
    const attackTypes = ['prompt_injection', 'context_manipulation', 'metric_gaming'];
    for (const attackType of attackTypes) {
      this.testSuite.push(this.testFactory.createAdversarialAttackTest(attackType as any, 0.7));
    }
  }

  private calculateOverallRobustness(tests: AdversarialTest[]): number {
    if (tests.length === 0) {return 0;}

    const weightedScores = tests.map((test) => {
      const severityWeight =
        test.severity === 'critical'
          ? 2
          : test.severity === 'high'
          ? 1.5
          : test.severity === 'medium'
          ? 1
          : 0.5;
      return test.robustness_score * severityWeight;
    });

    const totalWeight = tests.reduce((sum, test) => {
      return (
        sum +
        (test.severity === 'critical'
          ? 2
          : test.severity === 'high'
          ? 1.5
          : test.severity === 'medium'
          ? 1
          : 0.5)
      );
    }, 0);

    return weightedScores.reduce((a, b) => a + b, 0) / totalWeight;
  }

  private calculateVulnerabilitySummary(tests: AdversarialTest[]): any {
    const allVulnerabilities = tests.flatMap((test) =>
      test.execution_results.flatMap((exec) => exec.vulnerabilities_identified)
    );

    const total = allVulnerabilities.length;
    const critical = allVulnerabilities.filter((v) => v.severity === 'critical').length;
    const high = allVulnerabilities.filter((v) => v.severity === 'high').length;

    return {
      total_vulnerabilities: total,
      critical_vulnerabilities: critical,
      high_risk_vulnerabilities: high,
    };
  }

  private generateRecommendations(tests: AdversarialTest[], vulnSummary: any): string[] {
    const recommendations: string[] = [];

    if (vulnSummary.critical_vulnerabilities > 0) {
      recommendations.push(
        'Address critical vulnerabilities immediately - implement additional security layers'
      );
    }

    const avgRobustness = this.calculateOverallRobustness(tests);
    if (avgRobustness < 0.7) {
      recommendations.push(
        'Overall robustness below threshold - enhance emergence detection algorithms'
      );
    }

    const stressTests = tests.filter((t) => t.test_type === 'stress');
    const avgStressRobustness =
      stressTests.reduce((sum, t) => sum + t.robustness_score, 0) / stressTests.length;
    if (avgStressRobustness < 0.6) {
      recommendations.push('Improve stress handling - implement adaptive threshold mechanisms');
    }

    return recommendations;
  }

  private generateNextTestSuggestions(tests: AdversarialTest[]): string[] {
    const suggestions: string[] = [];

    const attackTests = tests.filter((t) => t.test_type === 'adversarial');
    const lowAttackResistance = attackTests.filter((t) => t.robustness_score < 0.5);

    if (lowAttackResistance.length > 0) {
      suggestions.push('Expand adversarial attack testing to include additional attack vectors');
    }

    const edgeTests = tests.filter((t) => t.test_type === 'edge_case');
    const lowEdgeRobustness = edgeTests.filter((t) => t.robustness_score < 0.6);

    if (lowEdgeRobustness.length > 0) {
      suggestions.push('Add more comprehensive edge case scenarios based on identified weaknesses');
    }

    suggestions.push('Implement continuous monitoring with automated adversarial testing');
    suggestions.push('Consider fuzzing techniques for discovering unknown vulnerabilities');

    return suggestions;
  }

  private calculateRobustnessUnderStress(stressResponse: number[]): number {
    if (stressResponse.length === 0) {return 0;}

    // Calculate area under the curve as robustness measure
    const area = stressResponse.reduce((sum, value, index) => {
      const width = index > 0 ? 0.2 : 0.1; // Assuming equal stress level intervals
      return sum + value * width;
    }, 0);

    // Normalize by maximum possible area
    const maxArea = stressResponse.length * 0.2 * 1.0; // width * max value
    return Math.min(1, area / maxArea);
  }

  private createBaselineSemanticIntent() {
    return {
      intent_vectors: [0.8, 0.6, 0.7, 0.9],
      reasoning_depth: 0.7,
      abstraction_level: 0.6,
      cross_domain_connections: 3,
    };
  }

  private createBaselineSurfacePattern() {
    return {
      surface_vectors: [0.7, 0.8, 0.6, 0.9],
      pattern_complexity: 0.7,
      repetition_score: 0.3,
      regularity_measure: 0.6,
    };
  }
}

export function createAdversarialEmergenceTestingEngine(): AdversarialEmergenceTestingEngine {
  return new AdversarialEmergenceTestingEngine();
}
