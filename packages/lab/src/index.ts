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

// Conversational metrics and archive analysis
export { ConversationalMetrics } from './conversational-metrics';
export { ArchiveAnalyzer } from './archive-analyzer';
export { ArchiveBenchmarkSuite } from './archive-benchmark';

// Types for conversational metrics
export type {
  ConversationTurn,
  PhaseShiftMetrics,
  TransitionEvent,
  ConversationalMetricsConfig
} from './conversational-metrics';

export type {
  ArchiveConversation
} from './archive-analyzer';

export type {
  BenchmarkConfig,
  BenchmarkResult
} from './archive-benchmark';

// Validation suite
export { ResonateValidationSuite } from './resonate-validation';
export type {
  ValidationResult,
  ComprehensiveValidationReport
} from './resonate-validation';

// Agent roles (from symbi-resonate Lab)
export const AGENT_ROLES = ['CONDUCTOR', 'VARIANT', 'EVALUATOR', 'OVERSEER'] as const;

// Advanced Research Infrastructure (PHASE 3)
export {
  ThirdMindResearchEngine,
  createThirdMindResearchEngine,
  type ConsciousnessMarker,
  type EvidenceRecord,
  type EmergenceHypothesis,
  type TestMethodology,
  type ThirdMindInteraction,
  type ResearchStudy,
  type ResearchMethodology,
  type StudyProgress,
  type StudyResults,
  type StatisticalFinding
} from './third-mind-research';

export {
  AdversarialEmergenceTestingEngine,
  createAdversarialEmergenceTestingEngine,
  type AdversarialTest,
  type TestParameters,
  type ExpectedBehavior,
  type TestExecution,
  type PerformanceImpact,
  type RecoveryMetrics,
  type Vulnerability,
  type EmergenceStressReport
} from './adversarial-emergence-testing';

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

// LVS Experiment Framework
export {
  LVSExperimentOrchestrator,
  createDefaultLVSExperiment,
  type LVSExperimentConfig,
  type LVSVariant,
  type LVSTestCase,
  type LVSExperimentResult,
  type LVSVariantResult,
  type LVSTestCaseResult,
  type LVSStatisticalAnalysis
} from './lvs-experiment';
