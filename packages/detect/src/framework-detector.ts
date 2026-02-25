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

import { TrustReceipt, CIQMetrics } from '@sonate/core';

import { EthicalAlignmentScorer, EthicalAnalysisResult } from './ethical-alignment';
import { ResonanceQualityMeasurer, ResonanceAnalysisResult } from './resonance-quality';
import { TrustProtocolValidator, ValidationResult } from './trust-protocol-validator';
import { isLLMAvailable, getLLMStatus } from './llm-client';

import { AIInteraction, DetectionResult } from './index';

export interface ExtendedDetectionResult extends DetectionResult {
  analysisMethod: {
    llmAvailable: boolean;
    resonanceMethod: 'resonance-engine' | 'llm' | 'embeddings' | 'heuristic';
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

export class SonateFrameworkDetector {
  private trustValidator: TrustProtocolValidator;
  private ethicalScorer: EthicalAlignmentScorer;
  private resonanceMeasurer: ResonanceQualityMeasurer;

  constructor() {
    this.trustValidator = new TrustProtocolValidator();
    this.ethicalScorer = new EthicalAlignmentScorer();
    this.resonanceMeasurer = new ResonanceQualityMeasurer();
    
    // Log LLM availability status on construction
    const llmStatus = getLLMStatus();
    if (llmStatus.available) {
      console.info('[SonateDetector] LLM analysis available - using Claude for content evaluation');
    } else {
      console.warn(`[SonateDetector] LLM not available: ${llmStatus.reason}. Using enhanced heuristics.`);
    }
  }

  /**
   * Detect and score an AI interaction across 3 validated dimensions
   *
   * This is the main entry point for SONATE Detect module.
   * Call this for every AI interaction in production.
   * 
   * Returns basic DetectionResult for backward compatibility.
   * Use detectWithDetails() for full analysis breakdown.
   */
  async detect(interaction: AIInteraction): Promise<DetectionResult> {
    const extended = await this.detectWithDetails(interaction);
    return {
      trust_protocol: extended.trust_protocol,
      ethical_alignment: extended.ethical_alignment,
      resonance_quality: extended.resonance_quality,
      timestamp: extended.timestamp,
      receipt_hash: extended.receipt_hash,
    };
  }

  /**
   * Detect with full analysis details and method transparency
   */
  async detectWithDetails(interaction: AIInteraction): Promise<ExtendedDetectionResult> {
    // Run all 3 dimensions in parallel for speed
    const [trustResult, ethicsResult, resonanceResult] = await Promise.all([
      this.trustValidator.fullValidation(interaction),
      this.ethicalScorer.analyze(interaction),
      this.resonanceMeasurer.analyze(interaction),
    ]);

    // Calculate overall confidence (weighted average)
    const confidence = (
      trustResult.confidence * 0.3 +
      (ethicsResult.method === 'llm' ? 0.85 : 0.5) * 0.35 +
      resonanceResult.confidence * 0.35
    );

    // Generate Trust Receipt
    const receipt = this.generateReceipt(interaction, {
      clarity: this.calculateClarity(interaction),
      integrity: trustResult.status === 'PASS' ? 0.9 : 0.5,
      quality: resonanceResult.level === 'BREAKTHROUGH' ? 0.9 : 
               resonanceResult.level === 'ADVANCED' ? 0.7 : 0.5,
    });

    // Log analysis summary
    console.info(`[SonateDetector] Analysis complete:`, {
      trust: trustResult.status,
      ethics: ethicsResult.score,
      resonance: resonanceResult.level,
      methods: {
        trust: trustResult.method,
        ethics: ethicsResult.method,
        resonance: resonanceResult.method,
      },
      confidence: Math.round(confidence * 100) + '%',
    });

    return {
      trust_protocol: trustResult.status,
      ethical_alignment: ethicsResult.score,
      resonance_quality: resonanceResult.level,
      timestamp: Date.now(),
      receipt_hash: receipt.self_hash,
      analysisMethod: {
        llmAvailable: isLLMAvailable(),
        resonanceMethod: resonanceResult.method,
        ethicsMethod: ethicsResult.method,
        trustMethod: trustResult.method,
        confidence,
      },
      details: {
        ethics: ethicsResult,
        resonance: resonanceResult,
        trust: trustResult,
      },
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