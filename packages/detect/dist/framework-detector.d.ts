/**
 * SonateFrameworkDetector - Core 3-dimension detection engine
 *
 * This is the production-grade detector that scores AI interactions
 * in real-time across the 3 validated SONATE Framework dimensions:
 * - Trust Protocol (cryptographic validation)
 * - Ethical Alignment (LLM-powered constitutional checking)
 * - Resonance Quality (semantic coherence measurement)
 *
 * REMOVED (v2.0.1):
 * - Reality Index: Was just metadata flags, trivially gamed
 * - Canvas Parity: Was trivially gamed, no semantic grounding
 *
 * Use case: Live production monitoring (< 100ms latency requirement)
 */
import { AIInteraction, DetectionResult } from './index';
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
     */
    detect(interaction: AIInteraction): Promise<DetectionResult>;
    /**
     * Generate Trust Receipt for this detection
     */
    private generateReceipt;
    /**
     * Calculate clarity score (0-1)
     */
    private calculateClarity;
}
