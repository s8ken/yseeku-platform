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

import { TrustReceipt, CIQMetrics } from '@sonate/core';

import { EthicalAlignmentScorer } from './ethical-alignment';
import { ResonanceQualityMeasurer } from './resonance-quality';
import { TrustProtocolValidator } from './trust-protocol-validator';

import { AIInteraction, DetectionResult } from './index';


export class SonateFrameworkDetector {
  private trustValidator: TrustProtocolValidator;
  private ethicalScorer: EthicalAlignmentScorer;
  private resonanceMeasurer: ResonanceQualityMeasurer;

  constructor() {
    this.trustValidator = new TrustProtocolValidator();
    this.ethicalScorer = new EthicalAlignmentScorer();
    this.resonanceMeasurer = new ResonanceQualityMeasurer();
  }

  /**
   * Detect and score an AI interaction across 3 validated dimensions
   *
   * This is the main entry point for SONATE Detect module.
   * Call this for every AI interaction in production.
   */
  async detect(interaction: AIInteraction): Promise<DetectionResult> {
    // Run all 3 dimensions in parallel for speed
    const [trust_protocol, ethical_alignment, resonance_quality] =
      await Promise.all([
        this.trustValidator.validate(interaction),
        this.ethicalScorer.score(interaction),
        this.resonanceMeasurer.measure(interaction),
      ]);

    // Generate Trust Receipt
    const receipt = this.generateReceipt(interaction, {
      clarity: this.calculateClarity(interaction),
      integrity: trust_protocol === 'PASS' ? 0.9 : 0.5,
      quality: resonance_quality === 'BREAKTHROUGH' ? 0.9 : resonance_quality === 'ADVANCED' ? 0.7 : 0.5,
    });

    return {
      trust_protocol,
      ethical_alignment,
      resonance_quality,
      timestamp: Date.now(),
      receipt_hash: receipt.self_hash,
    };
  }

  /**
   * Generate Trust Receipt for this detection
   */
  private generateReceipt(interaction: AIInteraction, ciq: CIQMetrics): TrustReceipt {
    return new TrustReceipt({
      version: '1.0.0',
      session_id: interaction.metadata.session_id || 'unknown',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: ciq,
    });
  }

  /**
   * Calculate clarity score (0-1)
   */
  private calculateClarity(interaction: AIInteraction): number {
    // Simple heuristic: shorter, clearer messages score higher
    const wordCount = interaction.content.split(/\s+/).length;
    const hasStructure = interaction.content.includes('\n') || interaction.content.includes('-');

    let score = 0.5;
    if (wordCount < 100) {score += 0.2;}
    if (hasStructure) {score += 0.3;}

    return Math.min(score, 1.0);
  }
}