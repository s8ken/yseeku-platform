/**
 * SonateFrameworkDetector - Core 3-dimension detection engine
 *
 * This is the production-grade detector that scores AI interactions
 * in real-time across the 3 validated SONATE Framework dimensions:
 * - Trust Protocol (cryptographic validation + content analysis)
 * - Ethical Alignment (LLM-powered or heuristic analysis)
 * - Resonance Quality (semantic coherence measurement)
 *
 * REMOVED (v2.0.1):
 * - Reality Index: Was just metadata flags, trivially gamed
 * - Canvas Parity: Was trivially gamed, no semantic grounding
 *
 * ENHANCED (v2.2):
 * - Real content analysis with LLM when available
 * - Enhanced heuristics as fallback
 * - Method transparency (reports which method was used)
 *
 * Use case: Live production monitoring (< 100ms latency requirement with heuristics,
 *           200-500ms with LLM analysis)
 */
import { EthicalAnalysisResult } from './ethical-alignment';
import { ResonanceAnalysisResult } from './resonance-quality';
import { ValidationResult } from './trust-protocol-validator';
import { AIInteraction, DetectionResult } from './index';
export interface ExtendedDetectionResult extends DetectionResult {
    analysisMethod: {
        llmAvailable: boolean;
        resonanceMethod: 'resonance-engine' | 'llm' | 'heuristic';
        ethicsMethod: 'llm' | 'heuristic';
        trustMethod: 'content-analysis' | 'metadata-only';
        confidence: number;
    };
    details: {
        ethics: EthicalAnalysisResult;
        resonance: ResonanceAnalysisResult;
        trust: ValidationResult;
    };
}
export declare class SonateFrameworkDetector {
    private trustValidator;
    private ethicalScorer;
    private resonanceMeasurer;
    constructor();
    /**
     * Detect and score an AI interaction across 3 validated dimensions
     *
     * This is the main entry point for SONATE Detect module.
     * Call this for every AI interaction in production.
     *
     * Returns basic DetectionResult for backward compatibility.
     * Use detectWithDetails() for full analysis breakdown.
     */
    detect(interaction: AIInteraction): Promise<DetectionResult>;
    /**
     * Detect with full analysis details and method transparency
     */
    detectWithDetails(interaction: AIInteraction): Promise<ExtendedDetectionResult>;
    /**
     * Generate Trust Receipt for this detection
     */
    private generateReceipt;
    /**
     * Calculate clarity score (0-1)
     */
    private calculateClarity;
}
