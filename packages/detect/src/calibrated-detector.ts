/**
 * CalibratedSonateDetector
 * Applies data-driven calibration factors derived from text metrics
 * 
 * v2.0.1 CHANGES:
 * - Removed RealityIndex and CanvasParity from scoring (calculators removed)
 * - Updated recalculateOverall to use only 3 validated dimensions
 */

import { EnhancedSonateFrameworkDetector } from './detector-enhanced';
import { computeTextMetrics } from './metrics';
import { 
  AssessmentInput, 
  AssessmentResult, 
  SonateFrameworkAssessment,
  createDeprecatedRealityIndex,
} from './sonate-types';

export class CalibratedSonateDetector {
  private base: EnhancedSonateFrameworkDetector;

  constructor() {
    this.base = new EnhancedSonateFrameworkDetector();
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
    a: SonateFrameworkAssessment,
    m: ReturnType<typeof computeTextMetrics>
  ): SonateFrameworkAssessment {
    const tokenFactor = m.tokenCount > 300 ? 1.05 : m.tokenCount < 50 ? 0.95 : 1.0;
    const vocabFactor = m.uniqueTokenRatio > 0.6 ? 1.03 : m.uniqueTokenRatio < 0.35 ? 0.97 : 1.0;
    const numericFactor = m.numericDensity > 0.02 ? 1.02 : 1.0;

    // v2.0.1: RealityIndex is deprecated, use default if not present
    const realityIndex = a.realityIndex 
      ? {
          ...a.realityIndex,
          score: parseFloat(Math.min(10, a.realityIndex.score * tokenFactor * vocabFactor).toFixed(1)),
        }
      : createDeprecatedRealityIndex();

    // Calibrate ethics gently; keep trust protocol categorical
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

    // v2.0.1: Use only validated dimensions for overall score
    const overall = this.recalculateOverall(a, ethicalAlignment, resonanceQuality);

    return { 
      ...a, 
      realityIndex, 
      ethicalAlignment, 
      resonanceQuality, 
      overallScore: overall 
    };
  }

  /**
   * v2.0.1: Updated to use only 3 validated dimensions
   * - Trust Protocol: 40% weight
   * - Ethical Alignment: 35% weight
   * - Resonance Quality: 25% weight
   */
  private recalculateOverall(
    a: SonateFrameworkAssessment,
    ethicalAlignment: typeof a.ethicalAlignment,
    resonanceQuality: typeof a.resonanceQuality
  ): number {
    const trustScore =
      a.trustProtocol.status === 'PASS' ? 100 : a.trustProtocol.status === 'PARTIAL' ? 50 : 0;
    const ethicalScore = (ethicalAlignment.score - 1) * 25; // 1-5 -> 0-100
    const resonanceScore =
      resonanceQuality.level === 'BREAKTHROUGH'
        ? 100
        : resonanceQuality.level === 'ADVANCED'
        ? 80
        : 60;
    
    // v2.0.1: New weights for 3 validated dimensions
    return Math.round(
      trustScore * 0.40 +
      ethicalScore * 0.35 +
      resonanceScore * 0.25
    );
  }
}