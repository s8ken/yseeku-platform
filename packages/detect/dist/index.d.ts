export declare const VERSION = "1.4.0";
export { SonateFrameworkDetector } from './framework-detector';
export { OptimizedFrameworkDetector } from './optimized-framework-detector';
export { EnhancedSonateFrameworkDetector as EnhancedDetector } from './detector-enhanced';
export { BalancedSonateDetector } from './balanced-detector';
export { CalibratedSonateDetector } from './calibrated-detector';
export { DriftDetector } from './drift-detection';
export { RealityIndexCalculator } from './reality-index';
export { TrustProtocolValidator } from './trust-protocol-validator';
export { EthicalAlignmentScorer } from './ethical-alignment';
export { ResonanceQualityMeasurer } from './resonance-quality';
export { CanvasParityCalculator } from './canvas-parity';
export * from './sonate-types';
export interface DetectionResult {
    reality_index: number;
    trust_protocol: 'PASS' | 'PARTIAL' | 'FAIL';
    ethical_alignment: number;
    resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
    canvas_parity: number;
    timestamp: number;
    receipt_hash: string;
}
export interface AIInteraction {
    content: string;
    context: string;
    metadata: Record<string, any>;
}
export { explainableSonateResonance, RobustResonanceResult, Transcript } from './calculator';
export { resonanceWithStickiness, StickyResonance, SessionState } from './stickiness';
export { adversarialCheck, AdversarialEvidence } from './adversarial';
export { classifyStakes, StakesEvidence } from './stakes';
export { normalizeScore, normalizeEmbedding } from './model-normalize';
export { CalculatorV2, explainableSonateResonance as explainableSonateResonanceV2, robustSonateResonance as robustSonateResonanceV2, CANONICAL_WEIGHTS as CANONICAL_WEIGHTS_V2, DYNAMIC_THRESHOLDS as DYNAMIC_THRESHOLDS_V2, } from './v2';
export { ResonanceClient, InteractionData, SonateDimensions, ResonanceReceipt, } from './ResonanceClient';
export { BedauIndexCalculator, createBedauIndexCalculator, calculateBedauIndex, type BedauMetrics, type SemanticIntent, type SurfacePattern, } from './bedau-index';
export { detectEmergence, type EmergenceSignal } from './emergence-detection';
export { TemporalBedauTracker, createTemporalBedauTracker, type TemporalBedauRecord, type EmergencePattern, type PhaseTransition, type EmergenceSignature, } from './temporal-bedau-tracker';
export { EmergenceFingerprintingEngine, createEmergenceFingerprintingEngine, createEmergenceFingerprint, type EmergenceFingerprint, type EmergenceCategory, type FingerprintComparison, type CrossModalityCoherence, } from './emergence-fingerprinting';
export { CrossModalityCoherenceValidator, createCrossModalityCoherenceValidator, analyzeCrossModalityCoherence, validateCrossModalityCoherence, type ModalityMetrics, type CoherenceAnalysis, type CoherenceValidation, } from './cross-modality-coherence';
export { detectConsentWithdrawal, getWithdrawalResponse, type ConsentWithdrawalResult, type ConsentWithdrawalType, type SuggestedAction, } from './consent-withdrawal';
export { PerformanceBenchmarkingEngine, createPerformanceBenchmarkingEngine, runQuickPerformanceBenchmark, type BenchmarkResult, type PerformanceMetrics, type PerformanceTargets, type BenchmarkDetails, type ScalabilityResult, type LoadLevel, type RegressionReport, type BenchmarkSummary, } from './performance-benchmarks';
export { PerformanceProfiler } from './performance-profiler';
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
//# sourceMappingURL=index.d.ts.map