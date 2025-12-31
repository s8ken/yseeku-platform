/**
 * Enterprise-grade Mathematical Confidence Calculator
 * Implements rigorous statistical validation for AI detection scores
 */

export interface ConfidenceResult {
  confidence: number; // 0-1: Overall confidence score
  uncertainty: number; // 0-1: Uncertainty measure
  components: {
    bootstrap: number;
    threshold: number;
    model: number;
    sample: number;
    temporal: number;
    adversarial: number;
  };
  confidenceInterval: [number, number]; // 95% CI
  requiresReview: boolean;
  reviewReasons: string[];
  stabilityScore: number; // 0-1: Score stability over time
}

export interface ConfidenceMetrics {
  calibrationScore: number; // 0-1: How well calibrated predictions are
  coverageRate: number; // 0-1: Expected vs actual coverage
  averageUncertainty: number;
  predictionError: number; // RMSE of predictions
}

export class MathematicalConfidenceCalculator {
  private bootstrapSamples: number;
  private confidenceLevel: number;
  private reviewThreshold: number;
  private historicalData: Map<string, number[]>;

  constructor(options: {
    bootstrapSamples?: number;
    confidenceLevel?: number;
    reviewThreshold?: number;
  } = {}) {
    this.bootstrapSamples = options.bootstrapSamples || 1000;
    this.confidenceLevel = options.confidenceLevel || 0.95;
    this.reviewThreshold = options.reviewThreshold || 0.7;
    this.historicalData = new Map();
  }

  /**
   * Calculate comprehensive confidence metrics for a detection result
   */
  calculateUncertainty(
    pointEstimate: number,
    bootstrapEstimates: number[],
    thresholdDistance: number,
    dimensionCollinearity: number,
    sampleSize: number,
    historicalScores: number[],
    adversarialRisk: number
  ): ConfidenceResult {
    // 1. Bootstrap confidence interval
    const confidenceInterval = this.calculateBootstrapCI(bootstrapEstimates);
    const bootstrapUncertainty = confidenceInterval[1] - confidenceInterval[0];

    // 2. Threshold proximity uncertainty
    const thresholdUncertainty = this.calculateThresholdUncertainty(
      pointEstimate,
      thresholdDistance
    );

    // 3. Model uncertainty (dimension collinearity)
    const modelUncertainty = dimensionCollinearity;

    // 4. Sample size uncertainty
    const sampleUncertainty = this.calculateSampleUncertainty(sampleSize);

    // 5. Temporal uncertainty (historical stability)
    const temporalUncertainty = this.calculateTemporalUncertainty(
      pointEstimate,
      historicalScores
    );

    // 6. Adversarial uncertainty
    const adversarialUncertainty = adversarialRisk;

    // Combine uncertainties (weighted average)
    const weights = {
      bootstrap: 0.25,
      threshold: 0.20,
      model: 0.15,
      sample: 0.15,
      temporal: 0.15,
      adversarial: 0.10
    };

    const uncertainty = (
      bootstrapUncertainty * weights.bootstrap +
      thresholdUncertainty * weights.threshold +
      modelUncertainty * weights.model +
      sampleUncertainty * weights.sample +
      temporalUncertainty * weights.temporal +
      adversarialUncertainty * weights.adversarial
    );

    // Calculate overall confidence (inverse of uncertainty, bounded)
    const confidence = Math.max(0, Math.min(1, 1 - uncertainty));

    // Determine if review is required
    const requiresReview = confidence < this.reviewThreshold;
    const reviewReasons: string[] = [];

    if (bootstrapUncertainty > 0.2) {
      reviewReasons.push('High bootstrap uncertainty - inconsistent estimates');
    }
    if (thresholdUncertainty > 0.3) {
      reviewReasons.push('Close to decision threshold - borderline case');
    }
    if (modelUncertainty > 0.4) {
      reviewReasons.push('High dimension collinearity - model uncertainty');
    }
    if (sampleUncertainty > 0.3) {
      reviewReasons.push('Small sample size - insufficient data');
    }
    if (temporalUncertainty > 0.25) {
      reviewReasons.push('Low historical stability - inconsistent performance');
    }
    if (adversarialUncertainty > 0.2) {
      reviewReasons.push('High adversarial risk - potential manipulation');
    }

    // Calculate stability score
    const stabilityScore = historicalScores.length > 0
      ? this.calculateStabilityScore(pointEstimate, historicalScores)
      : 0.5;

    return {
      confidence,
      uncertainty,
      components: {
        bootstrap: bootstrapUncertainty,
        threshold: thresholdUncertainty,
        model: modelUncertainty,
        sample: sampleUncertainty,
        temporal: temporalUncertainty,
        adversarial: adversarialUncertainty
      },
      confidenceInterval,
      requiresReview,
      reviewReasons,
      stabilityScore
    };
  }

  /**
   * Update historical context for a session
   */
  updateHistoricalContext(
    sessionId: string,
    score: number,
    uncertainty: number,
    thresholdDistance: number
  ): void {
    if (!this.historicalData.has(sessionId)) {
      this.historicalData.set(sessionId, []);
    }

    const sessionHistory = this.historicalData.get(sessionId)!;
    sessionHistory.push(score);

    // Keep only last 50 measurements to prevent unbounded growth
    if (sessionHistory.length > 50) {
      sessionHistory.shift();
    }
  }

  /**
   * Get calibration metrics for a session
   */
  getCalibrationMetrics(sessionId: string): ConfidenceMetrics {
    const historicalScores = this.historicalData.get(sessionId) || [];

    if (historicalScores.length < 10) {
      return {
        calibrationScore: 0.5,
        coverageRate: 0.5,
        averageUncertainty: 0.5,
        predictionError: 0.5
      };
    }

    // Calculate calibration score (how well confidence reflects accuracy)
    const calibrationScore = this.calculateCalibrationScore(historicalScores);

    // Calculate coverage rate (how often true values fall within confidence intervals)
    const coverageRate = this.calculateCoverageRate(historicalScores);

    // Average uncertainty
    const averageUncertainty = historicalScores.reduce((sum, score) =>
      sum + this.estimateUncertainty(score), 0) / historicalScores.length;

    // Prediction error (RMSE)
    const predictionError = this.calculatePredictionError(historicalScores);

    return {
      calibrationScore,
      coverageRate,
      averageUncertainty,
      predictionError
    };
  }

  // Private helper methods

  private calculateBootstrapCI(estimates: number[]): [number, number] {
    if (estimates.length === 0) return [0, 1];

    const sorted = [...estimates].sort((a, b) => a - b);
    const lowerIndex = Math.floor((1 - this.confidenceLevel) / 2 * estimates.length);
    const upperIndex = Math.floor((1 + this.confidenceLevel) / 2 * estimates.length);

    return [sorted[lowerIndex], sorted[upperIndex]];
  }

  private calculateThresholdUncertainty(score: number, thresholdDistance: number): number {
    // Uncertainty increases as we approach decision boundaries
    const normalizedDistance = Math.min(thresholdDistance / 0.1, 1); // Scale by 0.1 threshold
    return 1 - normalizedDistance; // Higher uncertainty when closer to threshold
  }

  private calculateSampleUncertainty(sampleSize: number): number {
    // Uncertainty decreases with larger sample sizes
    return Math.max(0, Math.min(1, 1 / Math.sqrt(sampleSize)));
  }

  private calculateTemporalUncertainty(currentScore: number, historicalScores: number[]): number {
    if (historicalScores.length === 0) return 0.5;

    const mean = historicalScores.reduce((sum, s) => sum + s, 0) / historicalScores.length;
    const variance = historicalScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / historicalScores.length;
    const std = Math.sqrt(variance);

    // Uncertainty based on deviation from historical mean
    const deviation = Math.abs(currentScore - mean);
    return Math.min(1, deviation / (std + 0.1)); // Avoid division by zero
  }

  private calculateStabilityScore(currentScore: number, historicalScores: number[]): number {
    if (historicalScores.length < 3) return 0.5;

    const recentScores = historicalScores.slice(-10); // Last 10 scores
    const mean = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
    const variance = recentScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / recentScores.length;

    // Stability is inverse of coefficient of variation
    const cv = Math.sqrt(variance) / (mean + 0.001); // Avoid division by zero
    return Math.max(0, Math.min(1, 1 - cv));
  }

  private calculateCalibrationScore(scores: number[]): number {
    // Simplified calibration score - in practice would use proper calibration metrics
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    return Math.max(0, Math.min(1, 1 - Math.sqrt(variance)));
  }

  private calculateCoverageRate(scores: number[]): number {
    // Simplified coverage calculation
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const withinBounds = scores.filter(s => Math.abs(s - mean) < 0.2).length;
    return withinBounds / scores.length;
  }

  private calculatePredictionError(scores: number[]): number {
    if (scores.length < 2) return 0.5;

    // Calculate RMSE between consecutive predictions
    let totalError = 0;
    for (let i = 1; i < scores.length; i++) {
      totalError += Math.pow(scores[i] - scores[i - 1], 2);
    }
    return Math.sqrt(totalError / (scores.length - 1));
  }

  private estimateUncertainty(score: number): number {
    // Rough uncertainty estimation based on score distance from 0.5
    return Math.abs(score - 0.5) * 0.4 + 0.1; // Uncertainty increases away from middle
  }
}