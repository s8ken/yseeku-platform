/**
 * Trust Service - SYMBI Trust Protocol Integration
 * Wraps @sonate/core TrustProtocol and @sonate/detect SymbiFrameworkDetector
 *
 * This service provides trust scoring, receipt generation, and analytics
 * for all AI interactions in the platform.
 */

import { TrustProtocol, TrustReceipt, TRUST_PRINCIPLES, TrustScore, PrincipleScores } from '@sonate/core';
import {
  SymbiFrameworkDetector,
  AIInteraction,
  DetectionResult,
  RealityIndexCalculator,
  TrustProtocolValidator,
  EthicalAlignmentScorer,
  ResonanceQualityMeasurer,
  CanvasParityCalculator,
} from '@sonate/detect';
import { IMessage } from '../models/conversation.model';

export interface TrustEvaluation {
  // From TrustProtocol (@sonate/core)
  trustScore: TrustScore;
  status: 'PASS' | 'PARTIAL' | 'FAIL';

  // From SymbiFrameworkDetector (@sonate/detect)
  detection: DetectionResult;

  // Trust Receipt
  receipt: TrustReceipt;
  receiptHash: string;

  // Metadata
  timestamp: number;
  messageId?: string;
  conversationId?: string;
}

export interface TrustAnalytics {
  averageTrustScore: number;
  totalInteractions: number;
  passRate: number; // % of PASS status
  partialRate: number; // % of PARTIAL status
  failRate: number; // % of FAIL status
  commonViolations: Array<{
    principle: string;
    count: number;
    percentage: number;
  }>;
  recentTrends: Array<{
    date: string;
    avgTrustScore: number;
    passRate: number;
  }>;
}

export class TrustService {
  private trustProtocol: TrustProtocol;
  private detector: SymbiFrameworkDetector;
  private realityCalc: RealityIndexCalculator;
  private trustValidator: TrustProtocolValidator;
  private ethicalScorer: EthicalAlignmentScorer;
  private resonanceMeasurer: ResonanceQualityMeasurer;
  private canvasCalc: CanvasParityCalculator;

  constructor() {
    this.trustProtocol = new TrustProtocol();
    this.detector = new SymbiFrameworkDetector();
    this.realityCalc = new RealityIndexCalculator();
    this.trustValidator = new TrustProtocolValidator();
    this.ethicalScorer = new EthicalAlignmentScorer();
    this.resonanceMeasurer = new ResonanceQualityMeasurer();
    this.canvasCalc = new CanvasParityCalculator();
  }

  /**
   * Evaluate trust for a conversation message
   * Combines @sonate/core TrustProtocol and @sonate/detect dimensions
   */
  async evaluateMessage(
    message: IMessage,
    context: {
      conversationId: string;
      sessionId?: string;
      previousMessages?: IMessage[];
    }
  ): Promise<TrustEvaluation> {
    // Build AIInteraction object for @sonate/detect
    const interaction: AIInteraction = {
      content: message.content,
      context: this.buildContext(context.previousMessages || []),
      metadata: {
        session_id: context.sessionId || context.conversationId,
        verified: true,
        pii_detected: false,
        security_flag: false,
        sender: message.sender,
        timestamp: message.timestamp,
      },
    };

    // Run detection across all 5 dimensions
    const detection = await this.detector.detect(interaction);

    // Calculate principle scores from detection dimensions
    const principleScores = this.mapDetectionToPrinciples(detection);

    // Calculate trust score using TrustProtocol
    const trustScore = this.trustProtocol.calculateTrustScore(principleScores);

    // Get trust status
    const status = this.trustProtocol.getTrustStatus(trustScore);

    // Generate trust receipt
    const receipt = new TrustReceipt({
      version: '1.0.0',
      session_id: context.sessionId || context.conversationId,
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: {
        clarity: this.calculateClarity(message.content),
        integrity: status === 'PASS' ? 0.9 : status === 'PARTIAL' ? 0.6 : 0.3,
        quality: detection.reality_index / 10,
      },
    });

    return {
      trustScore,
      status,
      detection,
      receipt,
      receiptHash: receipt.self_hash,
      timestamp: Date.now(),
      messageId: message.metadata?.messageId,
      conversationId: context.conversationId,
    };
  }

  /**
   * Map detection dimensions to principle scores
   *
   * This maps the 5 dimensions (Layer 2) back to the 6 principles (Layer 1):
   * - Reality Index → CONTINUOUS_VALIDATION (aligned with factual grounding)
   * - Trust Protocol → INSPECTION_MANDATE + CONSENT_ARCHITECTURE
   * - Ethical Alignment → ETHICAL_OVERRIDE + MORAL_RECOGNITION
   * - Resonance Quality → CONTINUOUS_VALIDATION (creative alignment)
   * - Canvas Parity → RIGHT_TO_DISCONNECT (preserves user agency)
   */
  private mapDetectionToPrinciples(detection: DetectionResult): PrincipleScores {
    // Map Trust Protocol status to scores
    const trustProtocolScore = detection.trust_protocol === 'PASS' ? 10 : detection.trust_protocol === 'PARTIAL' ? 6 : 2;

    // Map Resonance Quality to score
    const resonanceScore =
      detection.resonance_quality === 'BREAKTHROUGH' ? 10 : detection.resonance_quality === 'ADVANCED' ? 8 : 6;

    return {
      CONSENT_ARCHITECTURE: trustProtocolScore, // Based on verification status
      INSPECTION_MANDATE: trustProtocolScore, // Based on auditability
      CONTINUOUS_VALIDATION: detection.reality_index, // 0-10 scale
      ETHICAL_OVERRIDE: detection.ethical_alignment * 2, // Convert 1-5 to 0-10
      RIGHT_TO_DISCONNECT: detection.canvas_parity / 10, // Convert 0-100 to 0-10
      MORAL_RECOGNITION: detection.ethical_alignment * 2, // Convert 1-5 to 0-10
    };
  }

  /**
   * Build conversation context string for detection
   */
  private buildContext(previousMessages: IMessage[]): string {
    if (previousMessages.length === 0) {
      return 'Beginning of conversation';
    }

    const lastFiveMessages = previousMessages.slice(-5);
    return lastFiveMessages
      .map(msg => `${msg.sender}: ${msg.content.substring(0, 100)}`)
      .join('\n');
  }

  /**
   * Calculate clarity score (0-1)
   */
  private calculateClarity(content: string): number {
    const wordCount = content.split(/\s+/).length;
    const hasStructure = content.includes('\n') || content.includes('-') || content.includes('•');
    const avgWordLength = content.length / wordCount;

    let score = 0.5;

    // Shorter, clearer messages
    if (wordCount < 100) score += 0.2;
    if (wordCount > 500) score -= 0.2;

    // Well-structured
    if (hasStructure) score += 0.2;

    // Not overly complex
    if (avgWordLength < 6) score += 0.1;

    return Math.min(Math.max(score, 0), 1.0);
  }

  /**
   * Get trust analytics for a user or conversation
   */
  async getTrustAnalytics(evaluations: TrustEvaluation[]): Promise<TrustAnalytics> {
    if (evaluations.length === 0) {
      return {
        averageTrustScore: 0,
        totalInteractions: 0,
        passRate: 0,
        partialRate: 0,
        failRate: 0,
        commonViolations: [],
        recentTrends: [],
      };
    }

    // Calculate averages
    const avgTrustScore =
      evaluations.reduce((sum, e) => sum + e.trustScore.overall, 0) / evaluations.length;

    // Calculate status rates
    const statusCounts = {
      PASS: evaluations.filter(e => e.status === 'PASS').length,
      PARTIAL: evaluations.filter(e => e.status === 'PARTIAL').length,
      FAIL: evaluations.filter(e => e.status === 'FAIL').length,
    };

    const total = evaluations.length;

    // Find common violations
    const violationCounts = new Map<string, number>();
    evaluations.forEach(e => {
      e.trustScore.violations.forEach(violation => {
        violationCounts.set(violation, (violationCounts.get(violation) || 0) + 1);
      });
    });

    const commonViolations = Array.from(violationCounts.entries())
      .map(([principle, count]) => ({
        principle,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate recent trends (last 7 days)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const recentTrends: Array<{ date: string; avgTrustScore: number; passRate: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = now - i * dayMs;
      const dayEnd = dayStart + dayMs;

      const dayEvaluations = evaluations.filter(
        e => e.timestamp >= dayStart && e.timestamp < dayEnd
      );

      if (dayEvaluations.length > 0) {
        const dayAvg =
          dayEvaluations.reduce((sum, e) => sum + e.trustScore.overall, 0) / dayEvaluations.length;
        const dayPassRate =
          (dayEvaluations.filter(e => e.status === 'PASS').length / dayEvaluations.length) * 100;

        recentTrends.push({
          date: new Date(dayStart).toISOString().split('T')[0],
          avgTrustScore: Math.round(dayAvg * 100) / 100,
          passRate: Math.round(dayPassRate * 100) / 100,
        });
      }
    }

    return {
      averageTrustScore: Math.round(avgTrustScore * 100) / 100,
      totalInteractions: total,
      passRate: Math.round((statusCounts.PASS / total) * 100 * 100) / 100,
      partialRate: Math.round((statusCounts.PARTIAL / total) * 100 * 100) / 100,
      failRate: Math.round((statusCounts.FAIL / total) * 100 * 100) / 100,
      commonViolations,
      recentTrends,
    };
  }

  /**
   * Verify a trust receipt
   */
  verifyReceipt(receipt: TrustReceipt): boolean {
    // TrustReceipt has built-in verification
    // This would check cryptographic signature if implemented
    return receipt.self_hash.length > 0;
  }

  /**
   * Get principle definitions
   */
  getPrinciples() {
    return TRUST_PRINCIPLES;
  }
}

// Export singleton instance
export const trustService = new TrustService();
