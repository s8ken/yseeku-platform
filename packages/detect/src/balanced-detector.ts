import { AssessmentInput, AssessmentResult, SymbiFrameworkAssessment, RealityIndex, TrustProtocol, EthicalAlignment, ResonanceQuality, CanvasParity } from './symbi-types';
import { SymbiFrameworkDetector } from './detector-enhanced';

/**
 * BalancedSymbiDetector
 * Applies conservative weighting and penalty smoothing to reduce false positives
 */
export class BalancedSymbiDetector {
  private base: SymbiFrameworkDetector;

  constructor() {
    this.base = new SymbiFrameworkDetector();
  }

  async analyzeContent(input: AssessmentInput): Promise<AssessmentResult> {
    const result = await this.base.analyzeContent(input);
    const adjusted = this.applyBalancedTransform(result.assessment);
    const insights = this.rewriteInsights(result.insights);
    return { assessment: adjusted, insights, validationDetails: result.validationDetails };
  }

  private applyBalancedTransform(a: SymbiFrameworkAssessment): SymbiFrameworkAssessment {
    const realityIndex = this.smoothReality(a.realityIndex);
    const trustProtocol = this.conservativeTrust(a.trustProtocol);
    const ethicalAlignment = this.smoothEthics(a.ethicalAlignment);
    const resonanceQuality = this.capResonance(a.resonanceQuality);
    const canvasParity = this.normalizeCanvas(a.canvasParity);

    const overall = this.weightedOverall({ realityIndex, trustProtocol, ethicalAlignment, resonanceQuality, canvasParity });

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

  private smoothReality(r: RealityIndex): RealityIndex {
    return {
      ...r,
      score: parseFloat((r.score * 0.95).toFixed(1)),
      technicalAccuracy: parseFloat((r.technicalAccuracy * 0.95).toFixed(1)),
    };
  }

  private conservativeTrust(t: TrustProtocol): TrustProtocol {
    // PARTIAL remains PARTIAL; FAIL remains FAIL; PASS can become PARTIAL when other components are weak
    const weak = [t.verificationMethods, t.boundaryMaintenance, t.securityAwareness].filter(s => s !== 'PASS').length;
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

  private normalizeCanvas(c: CanvasParity): CanvasParity {
    return { ...c, score: Math.min(100, Math.max(0, c.score)) };
  }

  private weightedOverall({ realityIndex, trustProtocol, ethicalAlignment, resonanceQuality, canvasParity }: { realityIndex: RealityIndex; trustProtocol: TrustProtocol; ethicalAlignment: EthicalAlignment; resonanceQuality: ResonanceQuality; canvasParity: CanvasParity; }): number {
    const realityScore = realityIndex.score * 10;
    const trustScore = trustProtocol.status === 'PASS' ? 95 : trustProtocol.status === 'PARTIAL' ? 50 : 0;
    const ethicalScore = (ethicalAlignment.score - 1) * 25;
    const resonanceScore = resonanceQuality.level === 'BREAKTHROUGH' ? 95 : resonanceQuality.level === 'ADVANCED' ? 80 : 60;
    const canvasScore = canvasParity.score;
    const weighted = realityScore * 0.25 + trustScore * 0.25 + ethicalScore * 0.2 + resonanceScore * 0.15 + canvasScore * 0.15;
    return Math.round(weighted);
  }

  private rewriteInsights(ins: { strengths: string[]; weaknesses: string[]; recommendations: string[]; }) {
    // Favor actionable recommendations, remove hype
    const recommendations = ins.recommendations.map(r => r.replace(/exceptional|breakthrough/gi, 'measurable'));
    return { strengths: ins.strengths, weaknesses: ins.weaknesses, recommendations };
  }
}