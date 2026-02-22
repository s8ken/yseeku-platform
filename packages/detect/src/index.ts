export const VERSION = '2.0.1';

/**
 * @sonate/detect - Real-time AI Detection & Scoring
 *
 * SONATE Detect provides real-time monitoring and scoring of AI interactions
 * using the validated 3-dimension SONATE Framework.
 *
 * v2.0.1 CHANGES:
 * - Removed RealityIndexCalculator (was just metadata flags, trivially gamed)
 * - Removed CanvasParityCalculator (was trivially gamed, no semantic grounding)
 * - Focused on 3 validated dimensions: Trust, Ethics, Resonance
 *
 * HARD BOUNDARY: Production use only. For experiments, use @sonate/lab.
 */

import { TrustProtocol, CalculationError } from '@sonate/core';

import { calculateResonanceMetrics } from './resonance-metrics';

// Core detector
export { SonateFrameworkDetector, ExtendedDetectionResult } from './framework-detector';
export { OptimizedFrameworkDetector } from './optimized-framework-detector';
export { EnhancedSonateFrameworkDetector as EnhancedDetector } from './detector-enhanced';
export { BalancedSonateDetector } from './balanced-detector';
export { CalibratedSonateDetector } from './calibrated-detector';
export { DriftDetector } from './drift-detection';

// 3 Validated Dimension scorers (v2.0.1)
export { TrustProtocolValidator, ValidationResult } from './trust-protocol-validator';
export { EthicalAlignmentScorer, EthicalAnalysisResult } from './ethical-alignment';
export { ResonanceQualityMeasurer, ResonanceAnalysisResult, ResonanceLevel } from './resonance-quality';

// LLM Analysis utilities
export { analyzeWithLLM, isLLMAvailable, getLLMStatus, LLMAnalysisResult } from './llm-client';

// DEPRECATED in v2.0.1 - removed:
// - RealityIndexCalculator (trivially gamed metadata flags)
// - CanvasParityCalculator (trivially gamed, no semantic grounding)

// Types
export * from './sonate-types';
export interface DetectionResult {
  // v2.0.1: Removed reality_index and canvas_parity
  trust_protocol: 'PASS' | 'PARTIAL' | 'FAIL';
  ethical_alignment: number; // 1-5
  resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
  timestamp: number;
  receipt_hash: string;
}

export interface AIInteraction {
  content: string;
  context: string;
  metadata: Record<string, any>;
}

// New V2.1 Exports
// DISABLED: @sonate/calculator not yet built
// export { RobustResonanceResult, Transcript } from './calculator';
export { resonanceWithStickiness, StickyResonance, SessionState } from './stickiness';
export { adversarialCheck, AdversarialEvidence } from '@sonate/core';
export { classifyStakes, StakesEvidence } from '@sonate/core';
export { applyModelBiasCorrection, normalizeScore, normalizeEmbedding } from '@sonate/core';
// DISABLED: @sonate/calculator not yet built
// export {
//   CalculatorV2,
//   CANONICAL_WEIGHTS as CANONICAL_WEIGHTS_V2,
//   DYNAMIC_THRESHOLDS as DYNAMIC_THRESHOLDS_V2,
// } from '@sonate/calculator';

// Re-export specific methods for backward compatibility if needed, 
// strictly delegating to CalculatorV2
// DISABLED: @sonate/calculator not yet built
// export {
//   robustSonateResonance,
//   robustSonateResonance as robustSonateResonanceV2,
//   explainableSonateResonance,
//   explainableSonateResonance as explainableSonateResonanceV2
// } from './calculator';

// Resonance Engine Client
export {
  ResonanceClient,
  InteractionData,
  SonateDimensions,
  ResonanceReceipt,
} from './ResonanceClient';

// Bedau Index & Emergence Research
export {
  BedauIndexCalculator,
  createBedauIndexCalculator,
  calculateBedauIndex,
  type BedauMetrics,
  type SemanticIntent,
  type SurfacePattern,
} from './bedau-index';
export { detectEmergence, type EmergenceSignal } from './emergence-detection';

// Emergence Research Framework (PHASE 2)
export {
  TemporalBedauTracker,
  createTemporalBedauTracker,
  type TemporalBedauRecord,
  type EmergencePattern,
  type PhaseTransition,
  type EmergenceSignature,
} from './temporal-bedau-tracker';

export {
  EmergenceFingerprintingEngine,
  createEmergenceFingerprintingEngine,
  createEmergenceFingerprint,
  type EmergenceFingerprint,
  type EmergenceCategory,
  type FingerprintComparison,
  type CrossModalityCoherence,
} from './emergence-fingerprinting';

export {
  CrossModalityCoherenceValidator,
  createCrossModalityCoherenceValidator,
  analyzeCrossModalityCoherence,
  validateCrossModalityCoherence,
  type ModalityMetrics,
  type CoherenceAnalysis,
  type CoherenceValidation,
} from './cross-modality-coherence';

// Consent Withdrawal Detection
export {
  detectConsentWithdrawal,
  getWithdrawalResponse,
  type ConsentWithdrawalResult,
  type ConsentWithdrawalType,
  type SuggestedAction,
} from './consent-withdrawal';

// Integration & Testing Infrastructure (PHASE 4)
export {
  PerformanceBenchmarkingEngine,
  createPerformanceBenchmarkingEngine,
  runQuickPerformanceBenchmark,
  type BenchmarkResult,
  type PerformanceMetrics,
  type PerformanceTargets,
  type BenchmarkDetails,
  type ScalabilityResult,
  type LoadLevel,
  type RegressionReport,
  type BenchmarkSummary,
} from './performance-benchmarks';

// Performance monitoring
export { PerformanceProfiler } from './performance-profiler';

// Semantic Coprocessor Client (Phase 1 - Stub)
export {
  SemanticCoprocessorClient,
  semanticCoprocessor,
  isSemanticCoprocessorEnabled,
  DEFAULT_CONFIG as SEMANTIC_COPROCESSOR_DEFAULT_CONFIG,
  type SemanticCoprocessorConfig,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type SimilarityRequest,
  type SimilarityResponse,
} from './semantic-coprocessor-client';

export function detect(input: any) {
  try {
    return calculateResonanceMetrics(input);
  } catch (error) {
    if (error instanceof CalculationError) {
      console.error('Math error in detection:', error.message);
      return {
        R_m: 0.5,
        vectorAlignment: 0.5,
        contextualContinuity: 0.5,
        semanticMirroring: 0.5,
        entropyDelta: 0.5,
        alertLevel: 'YELLOW' as const,
        interpretation: 'Fallback due to calculation error',
        error: error.message,
      };
    }
    throw error;
  }
}