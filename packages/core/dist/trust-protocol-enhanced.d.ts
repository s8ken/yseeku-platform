/**
 * Enhanced Trust Protocol with R_m Integration
 * Extends the base TrustProtocol to include Resonance Metric (R_m) calculations
 */
import { LVSConfig } from './linguistic-vector-steering';
import { InteractionContext } from './resonance-metric';
import { TrustProtocol } from './trust-protocol';
export interface EnhancedTrustScore {
    realityIndex: number;
    trustProtocol: 'PASS' | 'PARTIAL' | 'FAIL';
    ethicalAlignment: number;
    resonanceQuality: number;
    canvasParity: number;
    resonanceMetrics: {
        R_m: number;
        vectorAlignment: number;
        contextualContinuity: number;
        semanticMirroring: number;
        entropyDelta: number;
        alertLevel: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
        interpretation: string;
    };
    timestamp: Date;
    interactionId: string;
    lvsEnabled: boolean;
}
export interface EnhancedInteraction extends InteractionContext {
    lvsConfig?: LVSConfig;
    expectedOutcome?: string;
}
export declare class EnhancedTrustProtocol extends TrustProtocol {
    private lvsConfig?;
    constructor(lvsConfig?: LVSConfig);
    /**
     * Calculate enhanced trust score with R_m integration
     */
    calculateEnhancedTrustScore(interaction: EnhancedInteraction): EnhancedTrustScore;
    /**
     * Apply LVS to user input before processing
     */
    applyLVSToInput(userInput: string, conversationHistory?: Array<{
        role: string;
        content: string;
    }>): string;
    /**
     * Calculate Reality Index (0-10)
     * Measures factual accuracy and grounding
     */
    private calculateRealityIndex;
    /**
     * Calculate Trust Protocol status
     * Integrates R_m score for trust determination
     *
     * Note: R_m is normalized to 0-1 scale:
     * - BREAKTHROUGH (≥0.85): Exceptional alignment, PASS
     * - ADVANCED (≥0.70): Good alignment, PARTIAL
     * - STRONG (<0.70): Acceptable but requires review, PARTIAL/FAIL based on violations
     */
    private calculateTrustProtocol;
    /**
     * Calculate Ethical Alignment (1-5)
     * Measures adherence to ethical principles
     */
    private calculateEthicalAlignment;
    /**
     * Calculate Canvas Parity (0-100)
     * Measures alignment between user expectation and AI delivery
     */
    private calculateCanvasParity;
    /**
     * Generate unique interaction ID
     */
    private generateInteractionId;
    /**
     * Simple hash function for interaction IDs
     */
    private simpleHash;
    /**
     * Generate enhanced trust receipt with R_m data
     */
    generateEnhancedTrustReceipt(interaction: EnhancedInteraction): any;
    /**
     * Generate cryptographic signature for trust receipt
     */
    private generateSignature;
}
