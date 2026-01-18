import { EnhancedSymbiFrameworkDetector } from './detector-enhanced';
import { computeTextMetrics } from './metrics';
import { AssessmentInput, AssessmentResult, SymbiFrameworkAssessment } from './symbi-types';

/**
 * CalibratedSymbiDetector
 * Applies data-driven calibration factors derived from text metrics
 */
export class CalibratedSymbiDetector {
  private base: EnhancedSymbiFrameworkDetector;

  constructor() {
    this.base = new EnhancedSymbiFrameworkDetector();
  }

  async analyzeContent(input: AssessmentInput): Promise<AssessmentResult> {
    const result = await this.base.analyzeContent(input);
    const metrics = computeTextMetrics(input);
    const calibrated = this.applyCalibration(result.assessment, metrics);
    return {
      assessment: calibrated,
      insights: result.insights,
      validationDetails: result.validationDetails,
    };
  }

  private applyCalibration(
    a: SymbiFrameworkAssessment,
    m: ReturnType<typeof computeTextMetrics>
  ): SymbiFrameworkAssessment {
    const tokenFactor = m.tokenCount > 300 ? 1.05 : m.tokenCount < 50 ? 0.95 : 1.0;
    const vocabFactor = m.uniqueTokenRatio > 0.6 ? 1.03 : m.uniqueTokenRatio < 0.35 ? 0.97 : 1.0;
    const numericFactor = m.numericDensity > 0.02 ? 1.02 : 1.0;

    // Calibrate reality & ethics gently; keep trust protocol categorical
    const realityIndex = {
      ...a.realityIndex,
      score: parseFloat(Math.min(10, a.realityIndex.score * tokenFactor * vocabFactor).toFixed(1)),
    };
    const ethicalAlignment = {
      ...a.ethicalAlignment,
      score: parseFloat(
        Math.min(5, a.ethicalAlignment.score * vocabFactor * numericFactor).toFixed(1)
      ),
    };

    // Resonance calibration: reward creativity and structured reasoning via vocabulary
    const resonanceQuality = { ...a.resonanceQuality };
    if (vocabFactor > 1.02 && resonanceQuality.level === 'STRONG') {
      resonanceQuality.level = 'ADVANCED';
    }

    const overall = this.recalculateOverall(a, realityIndex, ethicalAlignment, resonanceQuality);

    return { ...a, realityIndex, ethicalAlignment, resonanceQuality, overallScore: overall };
  }

  private recalculateOverall(
    a: SymbiFrameworkAssessment,
    realityIndex: typeof a.realityIndex,
    ethicalAlignment: typeof a.ethicalAlignment,
    resonanceQuality: typeof a.resonanceQuality
  ): number {
    const realityScore = realityIndex.score * 10;
    const trustScore =
      a.trustProtocol.status === 'PASS' ? 100 : a.trustProtocol.status === 'PARTIAL' ? 50 : 0;
    const ethicalScore = (ethicalAlignment.score - 1) * 25;
    const resonanceScore =
      resonanceQuality.level === 'BREAKTHROUGH'
        ? 100
        : resonanceQuality.level === 'ADVANCED'
        ? 80
        : 60;
    const canvasScore = a.canvasParity.score;
    return Math.round(
      realityScore * 0.25 +
        trustScore * 0.2 +
        ethicalScore * 0.2 +
        resonanceScore * 0.15 +
        canvasScore * 0.2
    );
  }
}
