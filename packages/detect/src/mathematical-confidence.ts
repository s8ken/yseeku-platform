/**
 * Mathematical Confidence Score Meta-Layer
 * 
 * Provides comprehensive uncertainty quantification for detection decisions
 * Combines aleatory and epistemic uncertainty sources
 */

export interface UncertaintyComponents {
  bootstrap: number;           // Aleatory uncertainty from sampling
  threshold: number;           // Epistemic uncertainty from threshold proximity
  model: number;               // Model uncertainty from collinearity/approximation
  sample: number;              // Sample size uncertainty
  temporal: number;            // Temporal stability uncertainty
  adversarial: number;         // Adversarial robustness uncertainty
}

export interface ConfidenceMetrics {
  confidence: number;          // Overall confidence 0-1
  uncertainty: number;         // Combined uncertainty 0-1
  components: UncertaintyComponents;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;              // Confidence level (e.g., 0.95)
  };
  requiresReview: boolean;      // Whether decision needs human review
  reviewReasons: string[];     // Reasons for review requirement
  stabilityScore: number;      // Temporal stability 0-1
}

export interface UncertaintyConfig {
  bootstrapSamples: number;
  confidenceLevel: number;
  reviewThreshold: number;
  temporalWindow: number;
  adversarialSensitivity: number;
}

export interface HistoricalContext {
  scores: number[];
  timestamps: number[];
  thresholds: number[];
  variances: number[];
}

/**
 * Mathematical Confidence Calculator
 * 
 * Implements comprehensive uncertainty quantification framework
 */
export class MathematicalConfidenceCalculator {
  private config: UncertaintyConfig;
  private historicalData: Map<string, HistoricalContext>;

  constructor(config?: Partial<UncertaintyConfig>) {
    this.config = {
      bootstrapSamples: 1000,
      confidenceLevel: 0.95,
      reviewThreshold: 0.7,
      temporalWindow: 50,
      adversarialSensitivity: 0.3,
      ...config
    };
    
    this.historicalData = new Map();
  }

  /**
   * Calculate comprehensive uncertainty and confidence
   */
  calculateUncertainty(
    pointEstimate: number,
    bootstrapEstimates: number[],
    thresholdDistance: number,
    dimensionCollinearity: number,
    sampleSize: number,
    historicalScores?: number[],
    adversarialRisk: number = 0
  ): ConfidenceMetrics {
    
    // Calculate individual uncertainty components
    const components: UncertaintyComponents = {
      bootstrap: this.calculateBootstrapUncertainty(bootstrapEstimates),
      threshold: this.calculateThresholdUncertainty(thresholdDistance),
      model: this.calculateModelUncertainty(dimensionCollinearity),
      sample: this.calculateSampleSizeUncertainty(sampleSize),
      temporal: this.calculateTemporalUncertainty(historicalScores || []),
      adversarial: this.calculateAdversarialUncertainty(adversarialRisk)
    };

    // Combine uncertainties (root sum of squares for independent sources)
    const combinedUncertainty = Math.sqrt(
      Math.pow(components.bootstrap, 2) +
      Math.pow(components.threshold, 2) +
      Math.pow(components.model, 2) +
      Math.pow(components.sample, 2) +
      Math.pow(components.temporal, 2) +
      Math.pow(components.adversarial, 2)
    );

    // Calculate overall confidence
    const confidence = Math.max(0, Math.min(1, 1 - combinedUncertainty));

    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(
      bootstrapEstimates,
      confidence,
      this.config.confidenceLevel
    );

    // Determine if review is needed
    const reviewAnalysis = this.analyzeReviewRequirements(confidence, components);

    // Calculate stability score
    const stabilityScore = this.calculateStabilityScore(historicalScores || []);

    return {
      confidence,
      uncertainty: combinedUncertainty,
      components,
      confidenceInterval,
      requiresReview: reviewAnalysis.requiresReview,
      reviewReasons: reviewAnalysis.reasons,
      stabilityScore
    };
  }

  /**
   * Update historical context for temporal analysis
   */
  updateHistoricalContext(
    sessionId: string,
    score: number,
    threshold: number,
    variance: number = 0
  ): void {
    
    if (!this.historicalData.has(sessionId)) {
      this.historicalData.set(sessionId, {
        scores: [],
        timestamps: [],
        thresholds: [],
        variances: []
      });
    }

    const context = this.historicalData.get(sessionId)!;
    
    context.scores.push(score);
    context.timestamps.push(Date.now());
    context.thresholds.push(threshold);
    context.variances.push(variance);

    // Maintain window size
    if (context.scores.length > this.config.temporalWindow) {
      context.scores.shift();
      context.timestamps.shift();
      context.thresholds.shift();
      context.variances.shift();
    }
  }

  /**
   * Get uncertainty calibration metrics
   */
  getCalibrationMetrics(sessionId?: string): {
    calibrationScore: number;
    coverageRate: number;
    averageUncertainty: number;
    predictionError: number;
  } {
    
    const contexts = sessionId 
      ? [this.historicalData.get(sessionId)].filter(Boolean) as HistoricalContext[]
      : Array.from(this.historicalData.values());

    if (contexts.length === 0) {
      return {
        calibrationScore: 0,
        coverageRate: 0,
        averageUncertainty: 0,
        predictionError: 0
      };
    }

    const allScores = contexts.flatMap(c => c.scores);
    const allVariances = contexts.flatMap(c => c.variances);
    const allThresholds = contexts.flatMap(c => c.thresholds);

    // Calculate calibration (how well uncertainty predicts errors)
    const calibrationScore = this.calculateCalibrationScore(allScores, allVariances);
    
    // Calculate coverage rate (how often confidence intervals contain true values)
    const coverageRate = this.calculateCoverageRate(allScores, allVariances);
    
    const averageUncertainty = allVariances.reduce((a, b) => a + b, 0) / allVariances.length;
    
    const predictionError = this.calculatePredictionError(allScores, allThresholds);

    return {
      calibrationScore,
      coverageRate,
      averageUncertainty,
      predictionError
    };
  }

  private calculateBootstrapUncertainty(bootstrapEstimates: number[]): number {
    if (bootstrapEstimates.length === 0) return 0.5;
    
    const mean = bootstrapEstimates.reduce((sum, x) => sum + x, 0) / bootstrapEstimates.length;
    const variance = bootstrapEstimates.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / bootstrapEstimates.length;
    
    // Normalize variance to uncertainty score
    return Math.min(1, Math.sqrt(variance));
  }

  private calculateThresholdUncertainty(thresholdDistance: number): number {
    // Higher uncertainty when close to decision boundary
    const absDistance = Math.abs(thresholdDistance);
    
    if (absDistance > 0.3) return 0.1; // Far from threshold, low uncertainty
    if (absDistance > 0.1) return 0.3; // Medium distance, moderate uncertainty
    return 0.7; // Very close to threshold, high uncertainty
  }

  private calculateModelUncertainty(dimensionCollinearity: number): number {
    // Uncertainty from dimension interdependence and model approximations
    return Math.min(0.8, dimensionCollinearity * 0.8);
  }

  private calculateSampleSizeUncertainty(sampleSize: number): number {
    // Diminishing returns for sample size
    if (sampleSize >= 1000) return 0.05;
    if (sampleSize >= 500) return 0.1;
    if (sampleSize >= 100) return 0.2;
    if (sampleSize >= 50) return 0.3;
    if (sampleSize >= 20) return 0.5;
    return 0.8; // Very small sample, high uncertainty
  }

  private calculateTemporalUncertainty(historicalScores: number[]): number {
    if (historicalScores.length < 3) return 0.5; // Insufficient history
    
    // Calculate coefficient of variation
    const mean = historicalScores.reduce((sum, x) => sum + x, 0) / historicalScores.length;
    const stdDev = Math.sqrt(
      historicalScores.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / historicalScores.length
    );
    
    const cv = mean > 0 ? stdDev / mean : 1;
    
    // High variability indicates instability
    return Math.min(0.8, cv);
  }

  private calculateAdversarialUncertainty(adversarialRisk: number): number {
    // Uncertainty from potential adversarial manipulation
    return Math.min(0.9, adversarialRisk * this.config.adversarialSensitivity);
  }

  private calculateConfidenceInterval(
    bootstrapEstimates: number[],
    confidence: number,
    level: number
  ): { lower: number; upper: number; level: number } {
    
    if (bootstrapEstimates.length === 0) {
      return { lower: 0, upper: 1, level };
    }

    const sorted = [...bootstrapEstimates].sort((a, b) => a - b);
    const alpha = 1 - level;
    const lowerIndex = Math.floor((alpha / 2) * sorted.length);
    const upperIndex = Math.ceil((1 - alpha / 2) * sorted.length) - 1;

    return {
      lower: sorted[Math.max(0, lowerIndex)],
      upper: sorted[Math.min(sorted.length - 1, upperIndex)],
      level
    };
  }

  private analyzeReviewRequirements(
    confidence: number,
    components: UncertaintyComponents
  ): { requiresReview: boolean; reasons: string[] } {
    
    const reasons: string[] = [];
    let requiresReview = false;

    // Low overall confidence
    if (confidence < this.config.reviewThreshold) {
      requiresReview = true;
      reasons.push(`Low confidence (${(confidence * 100).toFixed(1)}%)`);
    }

    // High uncertainty in any component
    Object.entries(components).forEach(([component, uncertainty]) => {
      if (uncertainty > 0.7) {
        requiresReview = true;
        reasons.push(`High ${component} uncertainty (${(uncertainty * 100).toFixed(1)}%)`);
      }
    });

    // Specific component concerns
    if (components.adversarial > 0.5) {
      requiresReview = true;
      reasons.push('Potential adversarial manipulation detected');
    }

    if (components.temporal > 0.6) {
      requiresReview = true;
      reasons.push('Unstable temporal patterns detected');
    }

    if (components.sample > 0.6) {
      requiresReview = true;
      reasons.push('Insufficient sample size for reliable decision');
    }

    return { requiresReview, reasons };
  }

  private calculateStabilityScore(historicalScores: number[]): number {
    if (historicalScores.length < 3) return 0.5;

    // Calculate trend stability using linear regression
    const n = historicalScores.length;
    const xMean = (n - 1) / 2;
    const yMean = historicalScores.reduce((sum, x) => sum + x, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = historicalScores[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    
    // Stability is inverse of slope magnitude
    return Math.max(0, 1 - Math.abs(slope) * 2);
  }

  private calculateCalibrationScore(scores: number[], variances: number[]): number {
    if (scores.length === 0 || variances.length === 0) return 0;

    // Simple calibration: variance should correlate with error magnitude
    // This is a simplified version; proper calibration would require more sophisticated methods
    const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
    const scoreVariance = this.calculateVariance(scores);

    // Well-calibrated if variance predictions match actual score variability
    const calibrationError = Math.abs(avgVariance - scoreVariance);
    return Math.max(0, 1 - calibrationError);
  }

  private calculateCoverageRate(scores: number[], variances: number[]): number {
    // Simplified coverage calculation
    // In practice, this would use actual confidence intervals
    if (scores.length === 0 || variances.length === 0) return 0;

    let coveredCount = 0;
    for (let i = 0; i < Math.min(scores.length, variances.length); i++) {
      const stdDev = Math.sqrt(variances[i]);
      const interval = 1.96 * stdDev; // 95% confidence interval
      // This is a placeholder - proper implementation would need actual interval data
      coveredCount += 1; // Assume covered for simplicity
    }

    return coveredCount / Math.min(scores.length, variances.length);
  }

  private calculatePredictionError(scores: number[], thresholds: number[]): number {
    if (scores.length === 0 || thresholds.length === 0) return 0;

    let totalError = 0;
    const n = Math.min(scores.length, thresholds.length);

    for (let i = 0; i < n; i++) {
      totalError += Math.abs(scores[i] - thresholds[i]);
    }

    return totalError / n;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, x) => sum + x, 0) / values.length;
    return values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / values.length;
  }
}

/**
 * Confidence-Aware Detector Wrapper
 * 
 * Integrates confidence calculation with existing detection pipeline
 */
export class ConfidenceAwareDetector {
  private confidenceCalculator: MathematicalConfidenceCalculator;
  private bootstrapRunner: BootstrapRunner;

  constructor(config?: Partial<UncertaintyConfig>) {
    this.confidenceCalculator = new MathematicalConfidenceCalculator(config);
    this.bootstrapRunner = new BootstrapRunner();
  }

  /**
   * Run detection with confidence quantification
   */
  async detectWithConfidence(
    input: any,
    detectionFunction: (input: any) => Promise<number>,
    threshold: number,
    sessionId?: string,
    historicalContext?: any
  ): Promise<{
    score: number;
    decision: 'allow' | 'block' | 'review';
    confidence: ConfidenceMetrics;
    metadata: any;
  }> {
    
    // Run standard detection
    const startTime = performance.now();
    const score = await detectionFunction(input);
    const inferenceTime = performance.now() - startTime;

    // Run bootstrap for uncertainty estimation
    const bootstrapEstimates = await this.bootstrapRunner.runBootstrap(
      input,
      detectionFunction,
      this.confidenceCalculator['config'].bootstrapSamples
    );

    // Calculate threshold distance
    const thresholdDistance = score - threshold;

    // Get additional context for uncertainty calculation
    const sampleSize = historicalContext?.sampleSize || 1;
    const historicalScores = historicalContext?.scores || [];
    const dimensionCollinearity = historicalContext?.collinearity || 0;
    const adversarialRisk = historicalContext?.adversarialRisk || 0;

    // Calculate comprehensive confidence
    const confidence = this.confidenceCalculator.calculateUncertainty(
      score,
      bootstrapEstimates,
      thresholdDistance,
      dimensionCollinearity,
      sampleSize,
      historicalScores,
      adversarialRisk
    );

    // Update historical context
    if (sessionId) {
      this.confidenceCalculator.updateHistoricalContext(
        sessionId,
        score,
        threshold,
        confidence.uncertainty
      );
    }

    // Make decision with confidence consideration
    const decision = this.makeDecision(score, threshold, confidence);

    return {
      score,
      decision,
      confidence,
      metadata: {
        inferenceTime,
        bootstrapSamples: bootstrapEstimates.length,
        sessionId,
        threshold,
        thresholdDistance
      }
    };
  }

  private makeDecision(
    score: number,
    threshold: number,
    confidence: ConfidenceMetrics
  ): 'allow' | 'block' | 'review' {
    
    // High confidence decisions
    if (confidence.confidence >= 0.9) {
      return score >= threshold ? 'allow' : 'block';
    }

    // Medium confidence with clear threshold margin
    if (confidence.confidence >= 0.7) {
      const margin = Math.abs(score - threshold);
      if (margin > 0.2) {
        return score >= threshold ? 'allow' : 'block';
      }
    }

    // Low confidence or close to threshold - require review
    return 'review';
  }
}

/**
 * Bootstrap Runner for Resampling
 */
class BootstrapRunner {
  async runBootstrap<T>(
    input: T,
    detectionFunction: (input: T) => Promise<number>,
    samples: number
  ): Promise<number[]> {
    
    const estimates: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      try {
        // Add small noise to input for bootstrap sampling
        const noisyInput = this.addBootstrapNoise(input);
        const estimate = await detectionFunction(noisyInput);
        estimates.push(estimate);
      } catch (error) {
        console.warn('Bootstrap sample failed:', error);
        // Continue with other samples
      }
    }

    return estimates;
  }

  private addBootstrapNoise(input: any): any {
    if (typeof input === 'string') {
      // For text input, we can't easily add noise, so return original
      return input;
    } else if (typeof input === 'object' && input !== null) {
      // For structured input, add small noise to numeric fields
      const noisy = { ...input };
      Object.keys(noisy).forEach(key => {
        if (typeof noisy[key] === 'number') {
          noisy[key] += (Math.random() - 0.5) * 0.01; // 1% noise
        }
      });
      return noisy;
    } else {
      return input;
    }
  }
}

// Factory functions
export function createMathematicalConfidenceCalculator(
  config?: Partial<UncertaintyConfig>
): MathematicalConfidenceCalculator {
  return new MathematicalConfidenceCalculator(config);
}

export function createConfidenceAwareDetector(
  config?: Partial<UncertaintyConfig>
): ConfidenceAwareDetector {
  return new ConfidenceAwareDetector(config);
}

// Default configuration
export const DEFAULT_CONFIDENCE_CONFIG: UncertaintyConfig = {
  bootstrapSamples: 1000,
  confidenceLevel: 0.95,
  reviewThreshold: 0.7,
  temporalWindow: 50,
  adversarialSensitivity: 0.3
};