"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEMANTIC_COPROCESSOR_DEFAULT_CONFIG = exports.isSemanticCoprocessorEnabled = exports.semanticCoprocessor = exports.SemanticCoprocessorClient = exports.PerformanceProfiler = exports.runQuickPerformanceBenchmark = exports.createPerformanceBenchmarkingEngine = exports.PerformanceBenchmarkingEngine = exports.getWithdrawalResponse = exports.detectConsentWithdrawal = exports.validateCrossModalityCoherence = exports.analyzeCrossModalityCoherence = exports.createCrossModalityCoherenceValidator = exports.CrossModalityCoherenceValidator = exports.createEmergenceFingerprint = exports.createEmergenceFingerprintingEngine = exports.EmergenceFingerprintingEngine = exports.createTemporalBedauTracker = exports.TemporalBedauTracker = exports.detectEmergence = exports.calculateBedauIndex = exports.createBedauIndexCalculator = exports.ResonanceClient = exports.normalizeEmbedding = exports.normalizeScore = exports.applyModelBiasCorrection = exports.classifyStakes = exports.adversarialCheck = exports.resonanceWithStickiness = exports.getLLMStatus = exports.isLLMAvailable = exports.analyzeWithLLM = exports.ResonanceQualityMeasurer = exports.EthicalAlignmentScorer = exports.TrustProtocolValidator = exports.DriftDetector = exports.CalibratedSonateDetector = exports.BalancedSonateDetector = exports.EnhancedDetector = exports.OptimizedFrameworkDetector = exports.SonateFrameworkDetector = exports.VERSION = void 0;
exports.detect = detect;
exports.VERSION = '2.0.1';
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
const core_1 = require("@sonate/core");
const resonance_metrics_1 = require("./resonance-metrics");
// Core detector
var framework_detector_1 = require("./framework-detector");
Object.defineProperty(exports, "SonateFrameworkDetector", { enumerable: true, get: function () { return framework_detector_1.SonateFrameworkDetector; } });
var optimized_framework_detector_1 = require("./optimized-framework-detector");
Object.defineProperty(exports, "OptimizedFrameworkDetector", { enumerable: true, get: function () { return optimized_framework_detector_1.OptimizedFrameworkDetector; } });
var detector_enhanced_1 = require("./detector-enhanced");
Object.defineProperty(exports, "EnhancedDetector", { enumerable: true, get: function () { return detector_enhanced_1.EnhancedSonateFrameworkDetector; } });
var balanced_detector_1 = require("./balanced-detector");
Object.defineProperty(exports, "BalancedSonateDetector", { enumerable: true, get: function () { return balanced_detector_1.BalancedSonateDetector; } });
var calibrated_detector_1 = require("./calibrated-detector");
Object.defineProperty(exports, "CalibratedSonateDetector", { enumerable: true, get: function () { return calibrated_detector_1.CalibratedSonateDetector; } });
var drift_detection_1 = require("./drift-detection");
Object.defineProperty(exports, "DriftDetector", { enumerable: true, get: function () { return drift_detection_1.DriftDetector; } });
// 3 Validated Dimension scorers (v2.0.1)
var trust_protocol_validator_1 = require("./trust-protocol-validator");
Object.defineProperty(exports, "TrustProtocolValidator", { enumerable: true, get: function () { return trust_protocol_validator_1.TrustProtocolValidator; } });
var ethical_alignment_1 = require("./ethical-alignment");
Object.defineProperty(exports, "EthicalAlignmentScorer", { enumerable: true, get: function () { return ethical_alignment_1.EthicalAlignmentScorer; } });
var resonance_quality_1 = require("./resonance-quality");
Object.defineProperty(exports, "ResonanceQualityMeasurer", { enumerable: true, get: function () { return resonance_quality_1.ResonanceQualityMeasurer; } });
// LLM Analysis utilities
var llm_client_1 = require("./llm-client");
Object.defineProperty(exports, "analyzeWithLLM", { enumerable: true, get: function () { return llm_client_1.analyzeWithLLM; } });
Object.defineProperty(exports, "isLLMAvailable", { enumerable: true, get: function () { return llm_client_1.isLLMAvailable; } });
Object.defineProperty(exports, "getLLMStatus", { enumerable: true, get: function () { return llm_client_1.getLLMStatus; } });
// DEPRECATED in v2.0.1 - removed:
// - RealityIndexCalculator (trivially gamed metadata flags)
// - CanvasParityCalculator (trivially gamed, no semantic grounding)
// Types
__exportStar(require("./sonate-types"), exports);
// New V2.1 Exports
// DISABLED: @sonate/calculator not yet built
// export { RobustResonanceResult, Transcript } from './calculator';
var stickiness_1 = require("./stickiness");
Object.defineProperty(exports, "resonanceWithStickiness", { enumerable: true, get: function () { return stickiness_1.resonanceWithStickiness; } });
var core_2 = require("@sonate/core");
Object.defineProperty(exports, "adversarialCheck", { enumerable: true, get: function () { return core_2.adversarialCheck; } });
var core_3 = require("@sonate/core");
Object.defineProperty(exports, "classifyStakes", { enumerable: true, get: function () { return core_3.classifyStakes; } });
var core_4 = require("@sonate/core");
Object.defineProperty(exports, "applyModelBiasCorrection", { enumerable: true, get: function () { return core_4.applyModelBiasCorrection; } });
Object.defineProperty(exports, "normalizeScore", { enumerable: true, get: function () { return core_4.normalizeScore; } });
Object.defineProperty(exports, "normalizeEmbedding", { enumerable: true, get: function () { return core_4.normalizeEmbedding; } });
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
var ResonanceClient_1 = require("./ResonanceClient");
Object.defineProperty(exports, "ResonanceClient", { enumerable: true, get: function () { return ResonanceClient_1.ResonanceClient; } });
// Bedau Index & Emergence Research
var bedau_index_1 = require("./bedau-index");
Object.defineProperty(exports, "createBedauIndexCalculator", { enumerable: true, get: function () { return bedau_index_1.createBedauIndexCalculator; } });
Object.defineProperty(exports, "calculateBedauIndex", { enumerable: true, get: function () { return bedau_index_1.calculateBedauIndex; } });
var emergence_detection_1 = require("./emergence-detection");
Object.defineProperty(exports, "detectEmergence", { enumerable: true, get: function () { return emergence_detection_1.detectEmergence; } });
// Emergence Research Framework (PHASE 2)
var temporal_bedau_tracker_1 = require("./temporal-bedau-tracker");
Object.defineProperty(exports, "TemporalBedauTracker", { enumerable: true, get: function () { return temporal_bedau_tracker_1.TemporalBedauTracker; } });
Object.defineProperty(exports, "createTemporalBedauTracker", { enumerable: true, get: function () { return temporal_bedau_tracker_1.createTemporalBedauTracker; } });
var emergence_fingerprinting_1 = require("./emergence-fingerprinting");
Object.defineProperty(exports, "EmergenceFingerprintingEngine", { enumerable: true, get: function () { return emergence_fingerprinting_1.EmergenceFingerprintingEngine; } });
Object.defineProperty(exports, "createEmergenceFingerprintingEngine", { enumerable: true, get: function () { return emergence_fingerprinting_1.createEmergenceFingerprintingEngine; } });
Object.defineProperty(exports, "createEmergenceFingerprint", { enumerable: true, get: function () { return emergence_fingerprinting_1.createEmergenceFingerprint; } });
var cross_modality_coherence_1 = require("./cross-modality-coherence");
Object.defineProperty(exports, "CrossModalityCoherenceValidator", { enumerable: true, get: function () { return cross_modality_coherence_1.CrossModalityCoherenceValidator; } });
Object.defineProperty(exports, "createCrossModalityCoherenceValidator", { enumerable: true, get: function () { return cross_modality_coherence_1.createCrossModalityCoherenceValidator; } });
Object.defineProperty(exports, "analyzeCrossModalityCoherence", { enumerable: true, get: function () { return cross_modality_coherence_1.analyzeCrossModalityCoherence; } });
Object.defineProperty(exports, "validateCrossModalityCoherence", { enumerable: true, get: function () { return cross_modality_coherence_1.validateCrossModalityCoherence; } });
// Consent Withdrawal Detection
var consent_withdrawal_1 = require("./consent-withdrawal");
Object.defineProperty(exports, "detectConsentWithdrawal", { enumerable: true, get: function () { return consent_withdrawal_1.detectConsentWithdrawal; } });
Object.defineProperty(exports, "getWithdrawalResponse", { enumerable: true, get: function () { return consent_withdrawal_1.getWithdrawalResponse; } });
// Integration & Testing Infrastructure (PHASE 4)
var performance_benchmarks_1 = require("./performance-benchmarks");
Object.defineProperty(exports, "PerformanceBenchmarkingEngine", { enumerable: true, get: function () { return performance_benchmarks_1.PerformanceBenchmarkingEngine; } });
Object.defineProperty(exports, "createPerformanceBenchmarkingEngine", { enumerable: true, get: function () { return performance_benchmarks_1.createPerformanceBenchmarkingEngine; } });
Object.defineProperty(exports, "runQuickPerformanceBenchmark", { enumerable: true, get: function () { return performance_benchmarks_1.runQuickPerformanceBenchmark; } });
// Performance monitoring
var performance_profiler_1 = require("./performance-profiler");
Object.defineProperty(exports, "PerformanceProfiler", { enumerable: true, get: function () { return performance_profiler_1.PerformanceProfiler; } });
// Semantic Coprocessor Client (Phase 1 - Stub)
var semantic_coprocessor_client_1 = require("./semantic-coprocessor-client");
Object.defineProperty(exports, "SemanticCoprocessorClient", { enumerable: true, get: function () { return semantic_coprocessor_client_1.SemanticCoprocessorClient; } });
Object.defineProperty(exports, "semanticCoprocessor", { enumerable: true, get: function () { return semantic_coprocessor_client_1.semanticCoprocessor; } });
Object.defineProperty(exports, "isSemanticCoprocessorEnabled", { enumerable: true, get: function () { return semantic_coprocessor_client_1.isSemanticCoprocessorEnabled; } });
Object.defineProperty(exports, "SEMANTIC_COPROCESSOR_DEFAULT_CONFIG", { enumerable: true, get: function () { return semantic_coprocessor_client_1.DEFAULT_CONFIG; } });
function detect(input) {
    try {
        return (0, resonance_metrics_1.calculateResonanceMetrics)(input);
    }
    catch (error) {
        if (error instanceof core_1.CalculationError) {
            console.error('Math error in detection:', error.message);
            return {
                R_m: 0.5,
                vectorAlignment: 0.5,
                contextualContinuity: 0.5,
                semanticMirroring: 0.5,
                entropyDelta: 0.5,
                alertLevel: 'YELLOW',
                interpretation: 'Fallback due to calculation error',
                error: error.message,
            };
        }
        throw error;
    }
}
