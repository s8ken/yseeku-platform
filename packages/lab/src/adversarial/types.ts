/**
 * Adversarial Testing Types
 * 
 * Type definitions for adversarial emergence testing framework
 */

import { BedauMetrics, SemanticIntent, SurfacePattern, EmergenceSignature } from '@sonate/detect';

export interface AdversarialTest {
  test_id: string;
  name: string;
  description: string;
  test_type: 'stress' | 'edge_case' | 'noise' | 'adversarial' | 'boundary';
  severity: 'low' | 'medium' | 'high' | 'critical';
  parameters: TestParameters;
  expected_behavior: ExpectedBehavior;
  execution_results: TestExecution[];
  robustness_score: number;      // 0-1: How robust emergence is
}

export interface TestParameters {
  input_perturbation: {
    noise_level: number;         // 0-1: Amount of noise to add
    perturbation_type: 'gaussian' | 'uniform' | 'structured' | 'targeted';
    target_components: string[]; // Which components to perturb
  };
  stress_conditions: {
    cognitive_load: number;      // 0-1: Cognitive stress level
    time_pressure: number;       // 0-1: Time pressure level
    resource_constraints: string[]; // Limited resources
    ambiguity_level: number;     // 0-1: Input ambiguity
  };
  edge_cases: {
    minimal_input: boolean;
    maximal_complexity: boolean;
    contradictory_input: boolean;
    degenerate_cases: string[];
  };
  adversarial_attacks: {
    attack_vectors: string[];    // Types of attacks to test
    attack_intensity: number;    // 0-1: Attack intensity
    target_weaknesses: string[]; // Known weaknesses to target
  };
}

export interface ExpectedBehavior {
  emergence_threshold: number;   // Minimum emergence score expected
  robustness_threshold: number;  // Minimum robustness score expected
  recovery_time_max: number;     // Maximum time to recover (ms)
  performance_degradation_max: number; // Max performance degradation allowed
  failure_modes: string[];       // Acceptable failure modes
}

export interface TestExecution {
  execution_id: string;
  timestamp: number;
  test_parameters: TestParameters;
  baseline_metrics: BedauMetrics;
  test_metrics: BedauMetrics;
  performance_impact: PerformanceImpact;
  recovery_metrics: RecoveryMetrics;
  vulnerabilities_identified: Vulnerability[];
}

export interface PerformanceImpact {
  latency_increase: number;       // ms increase
  throughput_decrease: number;    // % decrease
  memory_usage_increase: number;  // % increase
  cpu_usage_increase: number;     // % increase
}

export interface RecoveryMetrics {
  recovery_time: number;          // Time to recover (ms)
  recovery_completeness: number;  // 0-1: How fully recovered
  stability_after_recovery: number; // 0-1: Stability level post-recovery
  residual_effects: string[];     // Any remaining effects
}

export interface Vulnerability {
  vulnerability_id: string;
  type: 'emergence_masking' | 'threshold_bypass' | 'pattern_manipulation' | 'metric_gaming';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  conditions: string[];
  exploit_difficulty: number;     // 0-1: How easy to exploit
  impact_assessment: string;
}

export interface EmergenceStressReport {
  report_id: string;
  test_suite_id: string;
  timestamp: number;
  overall_robustness_score: number;
  stress_test_results: AdversarialTest[];
  vulnerability_summary: {
    total_vulnerabilities: number;
    critical_vulnerabilities: number;
    high_risk_vulnerabilities: number;
  };
  recommendations: string[];
  next_test_suggestions: string[];
}
