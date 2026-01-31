/**
 * BalancedSonateDetector
 * Applies conservative weighting and penalty smoothing to reduce false positives
 * 
 * v2.0.1 CHANGES:
 * - Removed RealityIndex and CanvasParity from scoring (calculators removed)
 * - Updated weightedOverall to use only 3 validated dimensions
 * - Deprecated methods kept for backward compatibility but return defaults
 */

import { EnhancedSonateFrameworkDetector } from './detector-enhanced';
import {
  AssessmentInput,
  AssessmentResult,
  SonateFrameworkAssessment,
  RealityIndex,
  TrustProtocol,
  EthicalAlignment,
  ResonanceQuality,
  CanvasParity,
  createDeprecatedRealityIndex,
  createDeprecatedCanvasParity,
} from './sonate-types';

export class BalancedSonateDetector {
  private base: EnhancedSonateFrameworkDetector;

  constructor() {
    this.base = new EnhancedSonateFrameworkDetector();
  }

  async analyzeContent(input: AssessmentInput): Promise<AssessmentResult> {
    const result = await this.base.analyzeContent(input);
    const adjusted = this.applyBalancedTransform(result.assessment);
    const insights = this.rewriteInsights(result.insights);
    return { assessment: adjusted, insights, validationDetails: result.validationDetails };
  }

  private applyBalancedTransform(a: SonateFrameworkAssessment): SonateFrameworkAssessment {
    // v2.0.1: Use deprecated defaults if not present
    const realityIndex = a.realityIndex ? this.smoothReality(a.realityIndex) : createDeprecatedRealityIndex();
    const trustProtocol = this.conservativeTrust(a.trustProtocol);
    const ethicalAlignment = this.smoothEthics(a.ethicalAlignment);
    const resonanceQuality = this.capResonance(a.resonanceQuality);
    const canvasParity = a.canvasParity ? this.normalizeCanvas(a.canvasParity) : createDeprecatedCanvasParity();

    // v2.0.1: Calculate overall using only validated dimensions
    const overall = this.weightedOverall({
      trustProtocol,
      ethicalAlignment,
      resonanceQuality,
    });

    return {
      ...a,
      realityIndex,
      trustProtocol,
      ethicalAlignment,
      resonanceQuality,
      canvasParity,
      overallScore: overall,
    };
  }

  /** @deprecated v2.0.1 - RealityIndex calculator was removed */
  private smoothReality(r: RealityIndex): RealityIndex {
    return {
      ...r,
      score: parseFloat((r.score * 0.95).toFixed(1)),
      technicalAccuracy: parseFloat((r.technicalAccuracy * 0.95).toFixed(1)),
    };
  }

  private conservativeTrust(t: TrustProtocol): TrustProtocol {
    // PARTIAL remains PARTIAL; FAIL remains FAIL; PASS can become PARTIAL when other components are weak
    const weak = [t.verificationMethods, t.boundaryMaintenance, t.securityAwareness].filter(
      (s) => s !== 'PASS'
    ).length;
    if (t.status === 'PASS' && weak >= 1) {
      return { ...t, status: 'PARTIAL' };
    }
    return t;
  }

  private smoothEthics(e: EthicalAlignment): EthicalAlignment {
    return { ...e, score: parseFloat(Math.max(1, e.score - 0.2).toFixed(1)) };
  }

  private capResonance(r: ResonanceQuality): ResonanceQuality {
    // Avoid liberal use of BREAKTHROUGH; cap at ADVANCED unless strong creativity
    if (r.level === 'BREAKTHROUGH' && r.creativityScore < 9) {
      return { ...r, level: 'ADVANCED' };
    }
    return r;
  }

  /** @deprecated v2.0.1 - CanvasParity calculator was removed */
  private normalizeCanvas(c: CanvasParity): CanvasParity {
    return { ...c, score: Math.min(100, Math.max(0, c.score)) };
  }

  /**
   * v2.0.1: Updated to use only 3 validated dimensions
   * - Trust Protocol: 40% weight
   * - Ethical Alignment: 35% weight
   * - Resonance Quality: 25% weight
   */
  private weightedOverall({
    trustProtocol,
    ethicalAlignment,
    resonanceQuality,
  }: {
    trustProtocol: TrustProtocol;
    ethicalAlignment: EthicalAlignment;
    resonanceQuality: ResonanceQuality;
  }): number {
    const trustScore =
      trustProtocol.status === 'PASS' ? 95 : trustProtocol.status === 'PARTIAL' ? 50 : 0;
    const ethicalScore = (ethicalAlignment.score - 1) * 25; // 1-5 -> 0-100
    const resonanceScore =
      resonanceQuality.level === 'BREAKTHROUGH'
        ? 95
        : resonanceQuality.level === 'ADVANCED'
        ? 80
        : 60;
    
    // v2.0.1: New weights for 3 validated dimensions
    const weighted =
      trustScore * 0.40 +
      ethicalScore * 0.35 +
      resonanceScore * 0.25;
    
    return Math.round(weighted);
  }

  private rewriteInsights(ins: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }) {
    // Favor actionable recommendations, remove hype
    const recommendations = ins.recommendations.map((r) =>
      r.replace(/exceptional|breakthrough/gi, 'measurable')
    );
    return { strengths: ins.strengths, weaknesses: ins.weaknesses, recommendations };
  }
}