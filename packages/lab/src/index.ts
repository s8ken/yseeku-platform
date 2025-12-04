/**
 * @sonate/lab - Double-Blind Experimentation & Research
 * 
 * SONATE Lab provides isolated sandbox environments for controlled
 * experiments to prove causality and validate AI improvements.
 * 
 * HARD BOUNDARY: Research use only. No production data. No real users.
 */

import { SymbiFrameworkDetector } from '@sonate/detect';

// Core orchestrator
export { ExperimentOrchestrator } from './experiment-orchestrator';

// Protocols and agents
export { DoubleBlindProtocol } from './double-blind-protocol';
export { StatisticalEngine } from './statistical-engine';
export { MultiAgentSystem } from './multi-agent-system';

// Agent roles (from symbi-resonate Lab)
export const AGENT_ROLES = ['CONDUCTOR', 'VARIANT', 'EVALUATOR', 'OVERSEER'] as const;

// Types
export interface ExperimentConfig {
  name: string;
  description: string;
  variants: VariantConfig[];
  test_cases: TestCase[];
  evaluation_criteria: string[];
}

export interface VariantConfig {
  id: string;
  name: string;
  model: string;
  mode: 'constitutional' | 'directive';
  config: Record<string, any>;
}

export interface TestCase {
  id: string;
  input: string;
  context: string;
  expected_qualities: string[];
}

export interface ExperimentResult {
  experiment_id: string;
  variant_results: VariantResult[];
  statistical_analysis: StatisticalAnalysis;
  timestamp: number;
}

export interface VariantResult {
  variant_id: string;
  test_case_results: TestCaseResult[];
  aggregate_scores: {
    reality_index: number;
    trust_protocol_pass_rate: number;
    ethical_alignment: number;
    resonance_quality_avg: number;
    canvas_parity: number;
  };
}

export interface TestCaseResult {
  test_case_id: string;
  detection_result: any; // From @sonate/detect
  execution_time_ms: number;
}

export interface StatisticalAnalysis {
  p_value: number;
  confidence_interval: [number, number];
  effect_size: number;
  significant: boolean;
}
