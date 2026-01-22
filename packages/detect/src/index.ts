export const VERSION = '1.4.0';

/**
 * @sonate/detect - Real-time AI Detection & Scoring
 *
 * SONATE Detect provides real-time monitoring and scoring of AI interactions
 * using the 5-dimension SONATE Framework.
 *
 * HARD BOUNDARY: Production use only. For experiments, use @sonate/lab.
 */

import { TrustProtocol , CalculationError } from '@sonate/core';

import { calculateResonanceMetrics } from './resonance-metrics';

// Core detector
export { SonateFrameworkDetector } from './framework-detector';
export { OptimizedFrameworkDetector } from './optimized-framework-detector';
export { EnhancedSonateFrameworkDetector as EnhancedDetector } from './detector-enhanced';
export { BalancedSonateDetector } from './balanced-detector';
export { CalibratedSonateDetector } from './calibrated-detector';
export { DriftDetector } from './drift-detection';

// Linguistic Analysis (VLS)
export { 
  analyzeLinguistics, 
  analyzeConversation, 
  calculateVocabularyDrift,
  type LinguisticMetrics,
  type ConversationAnalysis
} from './linguistic-analyzer';

// 5 Dimension scorers
export { RealityIndexCalculator } from './reality-index';
export { TrustProtocolValidator } from './trust-protocol-validator';
export { EthicalAlignmentScorer } from './ethical-alignment';
export { ResonanceQualityMeasurer } from './resonance-quality';
export { CanvasParityCalculator } from './canvas-parity';

// Types
export * from './sonate-types';
export interface DetectionResult {
  reality_index: number; // 0-10
  trust_protocol: 'PASS' | 'PARTIAL' | 'FAIL';
  ethical_alignment: number; // 1-5
  resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
  canvas_parity: number; // 0-100
  timestamp: number;
  receipt_hash: string;
}

export interface AIInteraction {
  content: string;
  context: string;
  metadata: Record<string, any>;
}

// New V2.1 Exports
export { explainableSonateResonance, RobustResonanceResult, Transcript } from './calculator';
export { resonanceWithStickiness, StickyResonance, SessionState } from './stickiness';
export { adversarialCheck, AdversarialEvidence } from './adversarial';
export { classifyStakes, StakesEvidence } from './stakes';
export { normalizeScore, normalizeEmbedding } from './model-normalize';
export {
  CalculatorV2,
  explainableSonateResonance as explainableSonateResonanceV2,
  robustSonateResonance as robustSonateResonanceV2,
  CANONICAL_WEIGHTS as CANONICAL_WEIGHTS_V2,
  DYNAMIC_THRESHOLDS as DYNAMIC_THRESHOLDS_V2,
} from './v2';

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
