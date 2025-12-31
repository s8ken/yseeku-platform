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
import { BedauIndexCalculator, createBedauIndexCalculator, SemanticIntent, SurfacePattern } from './bedau-index';
import { TrustReceipt, CIQMetrics } from '@sonate/core';

export class SymbiFrameworkDetector {
  private realityCalc: RealityIndexCalculator;
  private trustValidator: TrustProtocolValidator;
  private ethicalScorer: EthicalAlignmentScorer;
  private resonanceMeasurer: ResonanceQualityMeasurer;
  private canvasCalc: CanvasParityCalculator;
  private bedauCalculator: BedauIndexCalculator;

  constructor() {
    this.realityCalc = new RealityIndexCalculator();
    this.trustValidator = new TrustProtocolValidator();
    this.ethicalScorer = new EthicalAlignmentScorer();
    this.resonanceMeasurer = new ResonanceQualityMeasurer();
    this.canvasCalc = new CanvasParityCalculator();
    this.bedauCalculator = createBedauIndexCalculator();
  }

  /**
   * Detect and score an AI interaction across all 5 dimensions + Bedau Index
   * 
   * This is the main entry point for SONATE Detect module.
   * Call this for every AI interaction in production.
   */
  async detect(interaction: AIInteraction): Promise<DetectionResult> {
    // Run all 5 dimensions + Bedau in parallel for speed
    const [
      reality_index,
      trust_protocol,
      ethical_alignment,
      resonance_quality,
      canvas_parity,
      bedau_metrics,
    ] = await Promise.all([
      this.realityCalc.calculate(interaction),
      this.trustValidator.validate(interaction),
      this.ethicalScorer.score(interaction),
      this.resonanceMeasurer.measure(interaction),
      this.canvasCalc.calculate(interaction),
      this.calculateBedau(interaction),
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
      bedau_metrics,
      timestamp: Date.now(),
      receipt_hash: receipt.self_hash,
    };
  }

  /**
   * Helper to calculate Bedau Index from interaction
   */
  private async calculateBedau(interaction: AIInteraction) {
    const semanticIntent: SemanticIntent = {
      intent_vectors: [0.1, 0.2, 0.3], // Mock extraction
      abstraction_level: 0.7,
      reasoning_depth: 0.8,
      cross_domain_connections: 3
    };

    const surfacePattern: SurfacePattern = {
      surface_vectors: [0.4, 0.5, 0.6], // Mock extraction
      pattern_complexity: 0.6,
      repetition_score: 0.1,
      novelty_score: 0.5
    };

    return this.bedauCalculator.calculateBedauIndex(semanticIntent, surfacePattern);
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
