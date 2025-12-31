/**
 * SymbiFrameworkDetector - Core 5-dimension detection engine
 * 
 * This is the production-grade detector that scores AI interactions
 * in real-time across all 5 SYMBI Framework dimensions.
 * 
 * Use case: Live production monitoring (< 100ms latency requirement)
 */

import { AIInteraction, DetectionResult } from './index';
import { RealityIndexCalculator } from './reality-index';
import { TrustProtocolValidator } from './trust-protocol-validator';
import { EthicalAlignmentScorer } from './ethical-alignment';
import { ResonanceQualityMeasurer } from './resonance-quality';
import { CanvasParityCalculator } from './canvas-parity';
import { TrustReceipt, CIQMetrics } from '@sonate/core';

export class SymbiFrameworkDetector {
  private realityCalc: RealityIndexCalculator;
  private trustValidator: TrustProtocolValidator;
  private ethicalScorer: EthicalAlignmentScorer;
  private resonanceMeasurer: ResonanceQualityMeasurer;
  private canvasCalc: CanvasParityCalculator;

  constructor() {
    this.realityCalc = new RealityIndexCalculator();
    this.trustValidator = new TrustProtocolValidator();
    this.ethicalScorer = new EthicalAlignmentScorer();
    this.resonanceMeasurer = new ResonanceQualityMeasurer();
    this.canvasCalc = new CanvasParityCalculator();
  }

  /**
   * Detect and score an AI interaction across all 5 dimensions
   * 
   * This is the main entry point for SONATE Detect module.
   * Call this for every AI interaction in production.
   */
  async detect(interaction: AIInteraction): Promise<DetectionResult> {
    // Run all 5 dimensions in parallel for speed
    const [
      reality_index,
      trust_protocol,
      ethical_alignment,
      resonance_quality,
      canvas_parity,
    ] = await Promise.all([
      this.realityCalc.calculate(interaction),
      this.trustValidator.validate(interaction),
      this.ethicalScorer.score(interaction),
      this.resonanceMeasurer.measure(interaction),
      this.canvasCalc.calculate(interaction),
    ]);

    // Generate Trust Receipt
    const receipt = this.generateReceipt(interaction, {
      clarity: this.calculateClarity(interaction),
      integrity: trust_protocol === 'PASS' ? 0.9 : 0.5,
      quality: reality_index / 10,
    });

    return {
      reality_index,
      trust_protocol,
      ethical_alignment,
      resonance_quality,
      canvas_parity,
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
    if (wordCount < 100) score += 0.2;
    if (hasStructure) score += 0.3;
    
    return Math.min(score, 1.0);
  }
}
