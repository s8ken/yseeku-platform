export declare const VERSION = "2.0.1";
export { SonateFrameworkDetector, ExtendedDetectionResult } from './framework-detector';
export { OptimizedFrameworkDetector } from './optimized-framework-detector';
export { EnhancedSonateFrameworkDetector as EnhancedDetector } from './detector-enhanced';
export { BalancedSonateDetector } from './balanced-detector';
export { CalibratedSonateDetector } from './calibrated-detector';
export { DriftDetector } from './drift-detection';
export { TrustProtocolValidator, ValidationResult } from './trust-protocol-validator';
export { EthicalAlignmentScorer, EthicalAnalysisResult } from './ethical-alignment';
export { ResonanceQualityMeasurer, ResonanceAnalysisResult, ResonanceLevel } from './resonance-quality';
export { analyzeWithLLM, isLLMAvailable, getLLMStatus, LLMAnalysisResult } from './llm-client';
export * from './sonate-types';
export interface DetectionResult {
    trust_protocol: 'PASS' | 'PARTIAL' | 'FAIL';
    ethical_alignment: number;
    resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
    timestamp: number;
    receipt_hash: string;
}
export interface AIInteraction {
    content: string;
    context: string;
    metadata: Record<string, any>;
}
export { RobustResonanceResult, Transcript } from './calculator';
export { resonanceWithStickiness, StickyResonance, SessionState } from './stickiness';
export { adversarialCheck, AdversarialEvidence } from '@sonate/core';
export { classifyStakes, StakesEvidence } from '@sonate/core';
export { normalizeScore, normalizeEmbedding } from '@sonate/core';
export { CalculatorV2, CANONICAL_WEIGHTS as CANONICAL_WEIGHTS_V2, DYNAMIC_THRESHOLDS as DYNAMIC_THRESHOLDS_V2, } from '@sonate/calculator';
export { robustSonateResonance, robustSonateResonance as robustSonateResonanceV2, explainableSonateResonance, explainableSonateResonance as explainableSonateResonanceV2 } from './calculator';
export { ResonanceClient, InteractionData, SonateDimensions, ResonanceReceipt, } from './ResonanceClient';
export { BedauIndexCalculator, createBedauIndexCalculator, calculateBedauIndex, type BedauMetrics, type SemanticIntent, type SurfacePattern, } from './bedau-index';
export { detectEmergence, type EmergenceSignal } from './emergence-detection';
export { TemporalBedauTracker, createTemporalBedauTracker, type TemporalBedauRecord, type EmergencePattern, type PhaseTransition, type EmergenceSignature, } from './temporal-bedau-tracker';
export { EmergenceFingerprintingEngine, createEmergenceFingerprintingEngine, createEmergenceFingerprint, type EmergenceFingerprint, type EmergenceCategory, type FingerprintComparison, type CrossModalityCoherence, } from './emergence-fingerprinting';
export { CrossModalityCoherenceValidator, createCrossModalityCoherenceValidator, analyzeCrossModalityCoherence, validateCrossModalityCoherence, type ModalityMetrics, type CoherenceAnalysis, type CoherenceValidation, } from './cross-modality-coherence';
export { detectConsentWithdrawal, getWithdrawalResponse, type ConsentWithdrawalResult, type ConsentWithdrawalType, type SuggestedAction, } from './consent-withdrawal';
export { PerformanceBenchmarkingEngine, createPerformanceBenchmarkingEngine, runQuickPerformanceBenchmark, type BenchmarkResult, type PerformanceMetrics, type PerformanceTargets, type BenchmarkDetails, type ScalabilityResult, type LoadLevel, type RegressionReport, type BenchmarkSummary, } from './performance-benchmarks';
export { PerformanceProfiler } from './performance-profiler';
export { SemanticCoprocessorClient, semanticCoprocessor, isSemanticCoprocessorEnabled, DEFAULT_CONFIG as SEMANTIC_COPROCESSOR_DEFAULT_CONFIG, type SemanticCoprocessorConfig, type EmbeddingRequest, type EmbeddingResponse, type SimilarityRequest, type SimilarityResponse, } from './semantic-coprocessor-client';
export declare function detect(input: any): import("@sonate/core").ResonanceMetrics | {
    R_m: number;
    vectorAlignment: number;
    contextualContinuity: number;
    semanticMirroring: number;
    entropyDelta: number;
    alertLevel: "YELLOW";
    interpretation: string;
    error: string;
};
