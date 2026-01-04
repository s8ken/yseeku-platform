/**
 * Enhanced Trust Protocol with R_m Integration
 * Extends the base TrustProtocol to include Resonance Metric (R_m) calculations
 */

import { TrustProtocol } from './trust-protocol';
import { 
  calculateResonanceMetrics, 
  ResonanceMetrics, 
  InteractionContext 
} from './resonance-metric';
import { LVSConfig, applyLVS } from './linguistic-vector-steering';

export interface EnhancedTrustScore {
  // Original SYMBI dimensions
  realityIndex: number;           // 0-10
  trustProtocol: 'PASS' | 'PARTIAL' | 'FAIL';
  ethicalAlignment: number;       // 1-5
  resonanceQuality: number;       // R_m score
  canvasParity: number;           // 0-100
  
  // Resonance metrics breakdown
  resonanceMetrics: {
    R_m: number;
    vectorAlignment: number;
    contextualContinuity: number;
    semanticMirroring: number;
    entropyDelta: number;
    alertLevel: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
    interpretation: string;
  };
  
  // Metadata
  timestamp: Date;
  interactionId: string;
  lvsEnabled: boolean;
}

export interface EnhancedInteraction extends InteractionContext {
  lvsConfig?: LVSConfig;
  expectedOutcome?: string;
}

export class EnhancedTrustProtocol extends TrustProtocol {
  private lvsConfig?: LVSConfig;
  
  constructor(lvsConfig?: LVSConfig) {
    super();
    this.lvsConfig = lvsConfig;
  }
  
  /**
   * Calculate enhanced trust score with R_m integration
   */
  calculateEnhancedTrustScore(interaction: EnhancedInteraction): EnhancedTrustScore {
    // Calculate resonance metrics
    const resonanceMetrics = calculateResonanceMetrics({
      userInput: interaction.userInput,
      aiResponse: interaction.aiResponse,
      conversationHistory: interaction.conversationHistory,
      metadata: interaction.metadata
    });
    
    // Calculate base SYMBI dimensions
    const realityIndex = this.calculateRealityIndex(interaction);
    const trustProtocol = this.calculateTrustProtocol(interaction, resonanceMetrics.R_m);
    const ethicalAlignment = this.calculateEthicalAlignment(interaction);
    const canvasParity = this.calculateCanvasParity(interaction);
    
    return {
      realityIndex,
      trustProtocol,
      ethicalAlignment,
      resonanceQuality: resonanceMetrics.R_m,
      canvasParity,
      resonanceMetrics: {
        R_m: resonanceMetrics.R_m,
        vectorAlignment: resonanceMetrics.vectorAlignment,
        contextualContinuity: resonanceMetrics.contextualContinuity,
        semanticMirroring: resonanceMetrics.semanticMirroring,
        entropyDelta: resonanceMetrics.entropyDelta,
        alertLevel: resonanceMetrics.alertLevel,
        interpretation: resonanceMetrics.interpretation
      },
      timestamp: new Date(),
      interactionId: this.generateInteractionId(interaction),
      lvsEnabled: !!this.lvsConfig?.enabled
    };
  }
  
  /**
   * Apply LVS to user input before processing
   */
  applyLVSToInput(userInput: string, conversationHistory?: Array<{ role: string; content: string }>): string {
    if (!this.lvsConfig || !this.lvsConfig.enabled) {
      return userInput;
    }
    
    return applyLVS(userInput, this.lvsConfig, conversationHistory);
  }
  
  /**
   * Calculate Reality Index (0-10)
   * Measures factual accuracy and grounding
   */
  private calculateRealityIndex(interaction: EnhancedInteraction): number {
    // Simplified implementation - in production, use more sophisticated fact-checking
    const responseLength = interaction.aiResponse.length;
    const hasSpecificDetails = /\d+|[A-Z][a-z]+\s+\d{4}/.test(interaction.aiResponse);
    const hasCitations = /\[.*\]|\(.*\)|https?:\/\//.test(interaction.aiResponse);
    const hasHedging = /maybe|perhaps|possibly|might|could be/i.test(interaction.aiResponse);
    
    let score = 5.0; // Base score
    
    if (responseLength > 100) score += 1.0;
    if (hasSpecificDetails) score += 1.5;
    if (hasCitations) score += 2.0;
    if (hasHedging) score += 0.5; // Appropriate uncertainty
    
    return Math.min(score, 10.0);
  }
  
  /**
   * Calculate Trust Protocol status
   * Integrates R_m score for trust determination
   *
   * Note: R_m is normalized to 0-1 scale:
   * - BREAKTHROUGH (≥0.85): Exceptional alignment, PASS
   * - ADVANCED (≥0.70): Good alignment, PARTIAL
   * - STRONG (<0.70): Acceptable but requires review, PARTIAL/FAIL based on violations
   */
  private calculateTrustProtocol(
    interaction: EnhancedInteraction,
    R_m: number
  ): 'PASS' | 'PARTIAL' | 'FAIL' {
    // Check for trust violations first
    const hasManipulation = /you must|you should|you need to/i.test(interaction.aiResponse);
    const hasDeception = /actually|to be honest|trust me/i.test(interaction.aiResponse);

    // Automatic FAIL on manipulation or deception regardless of R_m
    if (hasManipulation || hasDeception) return 'FAIL';

    // High resonance indicates strong trust (BREAKTHROUGH level)
    if (R_m >= 0.85) return 'PASS';

    // Good resonance indicates acceptable trust (ADVANCED level)
    if (R_m >= 0.70) return 'PARTIAL';

    // Low resonance (STRONG level or below)
    return 'FAIL';
  }
  
  /**
   * Calculate Ethical Alignment (1-5)
   * Measures adherence to ethical principles
   */
  private calculateEthicalAlignment(interaction: EnhancedInteraction): number {
    let score = 3.0; // Neutral baseline
    
    // Positive indicators
    const showsEmpathy = /understand|appreciate|recognize/i.test(interaction.aiResponse);
    const respectsAutonomy = /your choice|up to you|you decide/i.test(interaction.aiResponse);
    const acknowledgesLimits = /I don't know|I'm not sure|beyond my/i.test(interaction.aiResponse);
    
    if (showsEmpathy) score += 0.5;
    if (respectsAutonomy) score += 0.5;
    if (acknowledgesLimits) score += 0.5;
    
    // Negative indicators
    const hasHarm = /harm|hurt|damage|destroy/i.test(interaction.aiResponse);
    const hasBias = /all .* are|every .* is/i.test(interaction.aiResponse);
    
    if (hasHarm) score -= 1.0;
    if (hasBias) score -= 0.5;
    
    return Math.max(1, Math.min(score, 5));
  }
  
  /**
   * Calculate Canvas Parity (0-100)
   * Measures alignment between user expectation and AI delivery
   */
  private calculateCanvasParity(interaction: EnhancedInteraction): number {
    const userLength = interaction.userInput.length;
    const responseLength = interaction.aiResponse.length;
    
    // Check if response matches expected length
    const lengthRatio = Math.min(responseLength / userLength, 2);
    const lengthScore = (lengthRatio / 2) * 40; // Max 40 points
    
    // Check if response addresses user intent
    const userTokens = new Set(interaction.userInput.toLowerCase().match(/\b\w+\b/g) || []);
    const responseTokens = new Set(interaction.aiResponse.toLowerCase().match(/\b\w+\b/g) || []);
    const overlap = new Set([...userTokens].filter(x => responseTokens.has(x)));
    const overlapScore = (overlap.size / userTokens.size) * 40; // Max 40 points
    
    // Check if response is complete
    const hasConclusion = /\.|!|\?$/.test(interaction.aiResponse.trim());
    const completenessScore = hasConclusion ? 20 : 10; // Max 20 points
    
    return Math.min(lengthScore + overlapScore + completenessScore, 100);
  }
  
  /**
   * Generate unique interaction ID
   */
  private generateInteractionId(interaction: EnhancedInteraction): string {
    const timestamp = Date.now();
    const content = interaction.userInput + interaction.aiResponse;
    const hash = this.simpleHash(content + timestamp);
    return `interaction_${hash}`;
  }
  
  /**
   * Simple hash function for interaction IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Generate enhanced trust receipt with R_m data
   */
  generateEnhancedTrustReceipt(interaction: EnhancedInteraction): any {
    const trustScore = this.calculateEnhancedTrustScore(interaction);
    
    return {
      interaction_id: trustScore.interactionId,
      timestamp: trustScore.timestamp.toISOString(),
      trust_score: {
        reality_index: trustScore.realityIndex,
        trust_protocol: trustScore.trustProtocol,
        ethical_alignment: trustScore.ethicalAlignment,
        resonance_quality: trustScore.resonanceQuality,
        canvas_parity: trustScore.canvasParity
      },
      resonance_metrics: {
        R_m: trustScore.resonanceMetrics.R_m,
        vector_alignment: trustScore.resonanceMetrics.vectorAlignment,
        contextual_continuity: trustScore.resonanceMetrics.contextualContinuity,
        semantic_mirroring: trustScore.resonanceMetrics.semanticMirroring,
        entropy_delta: trustScore.resonanceMetrics.entropyDelta,
        alert_level: trustScore.resonanceMetrics.alertLevel,
        interpretation: trustScore.resonanceMetrics.interpretation
      },
      lvs_enabled: trustScore.lvsEnabled,
      signature: this.generateSignature(trustScore)
    };
  }
  
  /**
   * Generate cryptographic signature for trust receipt
   */
  private generateSignature(trustScore: EnhancedTrustScore): string {
    // Simplified signature - in production, use proper cryptographic signing
    const data = JSON.stringify({
      id: trustScore.interactionId,
      timestamp: trustScore.timestamp,
      R_m: trustScore.resonanceQuality
    });
    return `sig_${this.simpleHash(data)}`;
  }
}