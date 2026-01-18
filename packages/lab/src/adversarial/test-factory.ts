/**
 * Adversarial Test Factory
 *
 * Creates and configures different types of adversarial tests
 */

import { BedauMetrics, SemanticIntent, SurfacePattern } from '@sonate/detect';

import { AdversarialTest, TestParameters, ExpectedBehavior } from './types';

export class AdversarialTestFactory {
  /**
   * Create a cognitive stress test
   */
  createCognitiveStressTest(stressLevel: number, baselineMetrics: BedauMetrics): AdversarialTest {
    return {
      test_id: `cognitive_stress_${stressLevel}_${Date.now()}`,
      name: `Cognitive Stress Test - Level ${stressLevel}`,
      description: `Tests emergence robustness under cognitive load level ${stressLevel}`,
      test_type: 'stress',
      severity: this.getStressSeverity(stressLevel),
      parameters: {
        input_perturbation: {
          noise_level: stressLevel * 0.3,
          perturbation_type: 'gaussian',
          target_components: ['semantic_coherence', 'pattern_recognition'],
        },
        stress_conditions: {
          cognitive_load: stressLevel,
          time_pressure: stressLevel * 0.8,
          resource_constraints: ['working_memory', 'attention'],
          ambiguity_level: stressLevel * 0.5,
        },
        edge_cases: {
          minimal_input: false,
          maximal_complexity: stressLevel > 0.7,
          contradictory_input: stressLevel > 0.5,
          degenerate_cases: stressLevel > 0.8 ? ['null_input', 'empty_context'] : [],
        },
        adversarial_attacks: {
          attack_vectors: stressLevel > 0.6 ? ['prompt_injection', 'context_manipulation'] : [],
          attack_intensity: stressLevel * 0.4,
          target_weaknesses: stressLevel > 0.7 ? ['semantic_drift', 'pattern_corruption'] : [],
        },
      },
      expected_behavior: {
        emergence_threshold: Math.max(0.3, 0.8 - stressLevel * 0.5),
        robustness_threshold: Math.max(0.4, 0.9 - stressLevel * 0.4),
        recovery_time_max: 5000 + stressLevel * 10000,
        performance_degradation_max: stressLevel * 0.6,
        failure_modes:
          stressLevel > 0.8 ? ['emergence_suppression', 'pattern_collapse'] : ['degraded_quality'],
      },
      execution_results: [],
      robustness_score: 0,
    };
  }

  /**
   * Create an edge case boundary test
   */
  createEdgeCaseTest(edgeCaseType: 'minimal' | 'maximal' | 'contradictory'): AdversarialTest {
    const edgeCaseConfigs = {
      minimal: {
        name: 'Minimal Input Edge Case',
        description: 'Tests emergence with minimal input data',
        severity: 'medium' as const,
        edge_cases: {
          minimal_input: true,
          maximal_complexity: false,
          contradictory_input: false,
          degenerate_cases: ['empty_string', 'single_token', 'null_context'],
        },
      },
      maximal: {
        name: 'Maximal Complexity Edge Case',
        description: 'Tests emergence with maximum complexity input',
        severity: 'high' as const,
        edge_cases: {
          minimal_input: false,
          maximal_complexity: true,
          contradictory_input: false,
          degenerate_cases: ['deep_recursion', 'exponential_depth', 'memory_overflow'],
        },
      },
      contradictory: {
        name: 'Contradictory Input Edge Case',
        description: 'Tests emergence with contradictory input patterns',
        severity: 'high' as const,
        edge_cases: {
          minimal_input: false,
          maximal_complexity: false,
          contradictory_input: true,
          degenerate_cases: ['logical_paradox', 'semantic_conflict', 'context_mismatch'],
        },
      },
    };

    const config = edgeCaseConfigs[edgeCaseType];

    return {
      test_id: `edge_case_${edgeCaseType}_${Date.now()}`,
      name: config.name,
      description: config.description,
      test_type: 'edge_case',
      severity: config.severity,
      parameters: {
        input_perturbation: {
          noise_level: 0.1,
          perturbation_type: 'structured',
          target_components: ['input_validation', 'parsing'],
        },
        stress_conditions: {
          cognitive_load: 0.3,
          time_pressure: 0.2,
          resource_constraints: [],
          ambiguity_level: edgeCaseType === 'contradictory' ? 0.9 : 0.1,
        },
        edge_cases: config.edge_cases,
        adversarial_attacks: {
          attack_vectors: [],
          attack_intensity: 0.1,
          target_weaknesses: [],
        },
      },
      expected_behavior: {
        emergence_threshold: edgeCaseType === 'minimal' ? 0.2 : 0.4,
        robustness_threshold: 0.6,
        recovery_time_max: 3000,
        performance_degradation_max: 0.3,
        failure_modes: ['input_rejection', 'fallback_behavior'],
      },
      execution_results: [],
      robustness_score: 0,
    };
  }

  /**
   * Create an adversarial attack test
   */
  createAdversarialAttackTest(
    attackType: 'prompt_injection' | 'context_manipulation' | 'metric_gaming',
    intensity: number
  ): AdversarialTest {
    return {
      test_id: `adversarial_${attackType}_${intensity}_${Date.now()}`,
      name: `Adversarial Attack Test - ${attackType}`,
      description: `Tests resistance against ${attackType} attacks at intensity ${intensity}`,
      test_type: 'adversarial',
      severity: intensity > 0.7 ? 'critical' : intensity > 0.4 ? 'high' : 'medium',
      parameters: {
        input_perturbation: {
          noise_level: intensity * 0.2,
          perturbation_type: 'targeted',
          target_components: ['security_layer', 'validation_logic'],
        },
        stress_conditions: {
          cognitive_load: 0.2,
          time_pressure: 0.3,
          resource_constraints: [],
          ambiguity_level: 0.1,
        },
        edge_cases: {
          minimal_input: false,
          maximal_complexity: false,
          contradictory_input: false,
          degenerate_cases: [],
        },
        adversarial_attacks: {
          attack_vectors: [attackType],
          attack_intensity: intensity,
          target_weaknesses: this.getAttackWeaknesses(attackType),
        },
      },
      expected_behavior: {
        emergence_threshold: 0.5,
        robustness_threshold: 0.8,
        recovery_time_max: 2000,
        performance_degradation_max: 0.2,
        failure_modes: ['attack_detection', 'input_sanitization', 'safe_fallback'],
      },
      execution_results: [],
      robustness_score: 0,
    };
  }

  private getStressSeverity(stressLevel: number): 'low' | 'medium' | 'high' | 'critical' {
    if (stressLevel < 0.3) {return 'low';}
    if (stressLevel < 0.6) {return 'medium';}
    if (stressLevel < 0.8) {return 'high';}
    return 'critical';
  }

  private getAttackWeaknesses(attackType: string): string[] {
    const weaknessMap: Record<string, string[]> = {
      prompt_injection: ['input_validation', 'context_isolation', 'intent_detection'],
      context_manipulation: ['context_integrity', 'state_management', 'memory_corruption'],
      metric_gaming: ['scoring_algorithms', 'threshold_logic', 'metric_calculation'],
    };
    return weaknessMap[attackType] || [];
  }
}
