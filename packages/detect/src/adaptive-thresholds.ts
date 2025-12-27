/**
 * Adaptive Thresholds via Online Change-Point Detection
 * 
 * Implements Bayesian Online Change-Point Detection (BOCPD) and CUSUM
 * Makes thresholds adaptive per agent/session to prevent gaming
 */

export interface ChangePointResult {
  changeProbability: number;
  runLength: number;
  predictedMean: number;
  predictedStd: number;
  evidence: number;
  isChangePoint: boolean;
}

export interface AdaptiveThresholdConfig {
  hazardFunction: 'constant' | 'student' | 'geometric';
  hazardRate: number;
  thresholdSensitivity: number;
  minSamples: number;
  maxMemory: number;
  changePointThreshold: number;
}

export interface ThresholdState {
  baseThreshold: number;
  adaptiveThreshold: number;
  changeProbability: number;
  confidence: number;
  lastUpdate: number;
  sampleCount: number;
  adjustmentReason: string;
}

export interface AdaptiveThresholds {
  [metric: string]: ThresholdState;
}

/**
 * Bayesian Online Change-Point Detector
 * 
 * Implements Adams & MacKay (2007) BOCPD algorithm
 * Maintains run length distribution and detects changes in real-time
 */
export class BayesianOnlineChangePointDetector {
  private hazardFunction: (runLength: number) => number;
  private studentTParams: { alpha: number; beta: number; kappa: number; mu: number };
  private runLengthDistribution: number[];
  private sufficientStatistics: Array<{
    alpha: number;
    beta: number;
    kappa: number;
    mu: number;
  }>;
  private maxRunLength: number;
  private changePointThreshold: number;

  constructor(config: Partial<AdaptiveThresholdConfig> = {}) {
    const defaultConfig: AdaptiveThresholdConfig = {
      hazardFunction: 'constant',
      hazardRate: 0.01,
      thresholdSensitivity: 0.5,
      minSamples: 10,
      maxMemory: 1000,
      changePointThreshold: 0.5
    };

    const finalConfig = { ...defaultConfig, ...config };
    this.changePointThreshold = finalConfig.changePointThreshold;
    this.maxRunLength = finalConfig.maxMemory;

    // Initialize hazard function
    this.hazardFunction = this.createHazardFunction(
      finalConfig.hazardFunction,
      finalConfig.hazardRate
    );

    // Initialize Student-t parameters (uninformative prior)
    this.studentTParams = {
      alpha: 1,
      beta: 1,
      kappa: 1,
      mu: 0
    };

    // Initialize run length distribution
    this.runLengthDistribution = [1]; // Start with run length 0
    this.sufficientStatistics = [this.studentTParams];
  }

  /**
   * Update detector with new observation
   */
  update(observation: number): ChangePointResult {
    // Predictive probabilities for all possible run lengths
    const predictiveProbabilities = this.calculatePredictiveProbabilities();

    // Incorporate new observation
    this.updateRunLengthDistribution(observation, predictiveProbabilities);

    // Calculate change point probability
    const changeProbability = this.runLengthDistribution[0];
    const runLength = this.getExpectedRunLength();

    // Get current predictive parameters
    const currentStats = this.getCurrentPredictiveStats();
    
    // Determine if change point detected
    const isChangePoint = changeProbability > this.changePointThreshold;

    // Calculate evidence for change point
    const evidence = this.calculateChangePointEvidence();

    return {
      changeProbability,
      runLength,
      predictedMean: currentStats.mu,
      predictedStd: Math.sqrt(currentStats.beta / (currentStats.alpha * currentStats.kappa)),
      evidence,
      isChangePoint
    };
  }

  /**
   * Get adaptive threshold based on change point probability
   */
  getAdaptiveThreshold(baseThreshold: number, changeProb: number, sensitivity: number = 0.5): number {
    // Adaptive adjustment factor
    const adjustmentFactor = 1 + changeProb * sensitivity;
    
    // Apply adjustment with bounds
    const adaptiveThreshold = Math.min(1.0, Math.max(0.1, baseThreshold * adjustmentFactor));
    
    return adaptiveThreshold;
  }

  /**
   * Reset detector (for new sessions)
   */
  reset(): void {
    this.runLengthDistribution = [1];
    this.sufficientStatistics = [this.studentTParams];
  }

  private createHazardFunction(type: string, rate: number): (runLength: number) => number {
    switch (type) {
      case 'constant':
        return () => rate;
      
      case 'geometric':
        return (runLength: number) => rate * Math.pow(1 - rate, runLength);
      
      case 'student':
        return (runLength: number) => rate * Math.pow(runLength + 1, -2);
      
      default:
        return () => rate;
    }
  }

  private calculatePredictiveProbabilities(): number[] {
    const probabilities: number[] = [];
    
    for (let r = 0; r < this.runLengthDistribution.length; r++) {
      const stats = this.sufficientStatistics[r];
      const predictiveStd = Math.sqrt(stats.beta * (stats.kappa + 1) / (stats.alpha * stats.kappa));
      
      // Student-t predictive probability (treated as Gaussian for simplicity)
      probabilities.push(1 / predictiveStd);
    }
    
    return probabilities;
  }

  private updateRunLengthDistribution(observation: number, predictiveProbabilities: number[]): void {
    const newRunLengthDistribution: number[] = [];
    const newSufficientStatistics = [];
    
    // Probability of change point
    const changeProb = this.hazardFunction(0) * this.runLengthDistribution[0];
    newRunLengthDistribution.push(changeProb);
    newSufficientStatistics.push(this.studentTParams);
    
    // Probability of continuing current run
    for (let r = 1; r < this.runLengthDistribution.length; r++) {
      const continueProb = (1 - this.hazardFunction(r)) * this.runLengthDistribution[r];
      newRunLengthDistribution[r] = continueProb * predictiveProbabilities[r];
      
      // Update sufficient statistics
      if (newRunLengthDistribution[r] > 0) {
        const prevStats = this.sufficientStatistics[r];
        const newStats = this.updateSufficientStatistics(prevStats, observation);
        newSufficientStatistics[r] = newStats;
      }
    }
    
    // Extend run length distribution if needed
    if (newRunLengthDistribution.length < this.maxRunLength && this.runLengthDistribution.length > 0) {
      const lastRunLength = this.runLengthDistribution.length - 1;
      const extendProb = (1 - this.hazardFunction(lastRunLength)) * this.runLengthDistribution[lastRunLength];
      newRunLengthDistribution.push(extendProb * predictiveProbabilities[lastRunLength]);
      
      if (newRunLengthDistribution[newRunLengthDistribution.length - 1] > 0) {
        const lastStats = this.sufficientStatistics[lastRunLength];
        const newStats = this.updateSufficientStatistics(lastStats, observation);
        newSufficientStatistics.push(newStats);
      }
    }
    
    // Normalize
    const total = newRunLengthDistribution.reduce((sum, prob) => sum + prob, 0);
    if (total > 0) {
      for (let i = 0; i < newRunLengthDistribution.length; i++) {
        newRunLengthDistribution[i] /= total;
      }
    }
    
    this.runLengthDistribution = newRunLengthDistribution;
    this.sufficientStatistics = newSufficientStatistics;
  }

  private updateSufficientStatistics(
    stats: { alpha: number; beta: number; kappa: number; mu: number },
    observation: number
  ): { alpha: number; beta: number; kappa: number; mu: number } {
    const newAlpha = stats.alpha + 0.5;
    const newKappa = stats.kappa + 1;
    const newMu = (stats.kappa * stats.mu + observation) / newKappa;
    const newBeta = stats.beta + (stats.kappa * Math.pow(observation - stats.mu, 2)) / (2 * newKappa);
    
    return {
      alpha: newAlpha,
      beta: newBeta,
      kappa: newKappa,
      mu: newMu
    };
  }

  private getExpectedRunLength(): number {
    let expectedRunLength = 0;
    for (let r = 0; r < this.runLengthDistribution.length; r++) {
      expectedRunLength += r * this.runLengthDistribution[r];
    }
    return expectedRunLength;
  }

  private getCurrentPredictiveStats(): { mu: number; beta: number; alpha: number; kappa: number } {
    // Use maximum a posteriori run length
    const maxProbIndex = this.runLengthDistribution.indexOf(Math.max(...this.runLengthDistribution));
    return this.sufficientStatistics[maxProbIndex] || this.studentTParams;
  }

  private calculateChangePointEvidence(): number {
    // Log evidence ratio for change point vs. continuation
    const changeProb = this.runLengthDistribution[0];
    const maxContinueProb = Math.max(...this.runLengthDistribution.slice(1));
    
    if (maxContinueProb === 0) return Infinity;
    
    return Math.log(changeProb / maxContinueProb);
  }
}

/**
 * CUSUM Detector (Simpler Alternative)
 * 
 * Cumulative Sum control chart for change point detection
 * Faster and simpler than BOCPD but less sophisticated
 */
export class CUSUMDetector {
  private targetMean: number;
  private targetStd: number;
  private threshold: number;
  private cumulativeSum: number = 0;
  private sampleCount: number = 0;

  constructor(targetMean: number, targetStd: number, threshold: number = 5) {
    this.targetMean = targetMean;
    this.targetStd = targetStd;
    this.threshold = threshold;
  }

  update(observation: number): ChangePointResult {
    const standardized = (observation - this.targetMean) / this.targetStd;
    this.cumulativeSum = Math.max(0, this.cumulativeSum + standardized);
    this.sampleCount++;

    const isChangePoint = this.cumulativeSum > this.threshold;
    const changeProbability = Math.min(1, this.cumulativeSum / this.threshold);

    if (isChangePoint) {
      this.cumulativeSum = 0; // Reset after detecting change
    }

    return {
      changeProbability,
      runLength: isChangePoint ? 0 : this.sampleCount,
      predictedMean: this.targetMean,
      predictedStd: this.targetStd,
      evidence: this.cumulativeSum,
      isChangePoint
    };
  }

  reset(): void {
    this.cumulativeSum = 0;
    this.sampleCount = 0;
  }
}

/**
 * Adaptive Threshold Manager
 * 
 * Coordinates multiple detectors and manages adaptive thresholds
 */
export class AdaptiveThresholdManager {
  private detectors: Map<string, BayesianOnlineChangePointDetector | CUSUMDetector>;
  private rollingScores: Map<string, number[]>;
  private baseThresholds: Record<string, number>;
  private config: AdaptiveThresholdConfig;

  constructor(
    baseThresholds: Record<string, number>,
    config?: Partial<AdaptiveThresholdConfig>
  ) {
    this.baseThresholds = baseThresholds;
    this.config = {
      hazardFunction: 'constant',
      hazardRate: 0.01,
      thresholdSensitivity: 0.3,
      minSamples: 10,
      maxMemory: 1000,
      changePointThreshold: 0.5,
      ...config
    };
    
    this.detectors = new Map();
    this.rollingScores = new Map();
    
    this.initializeDetectors();
  }

  /**
   * Update thresholds with new scores
   */
  updateAndGetThresholds(scores: Record<string, number>): AdaptiveThresholds {
    const thresholds: AdaptiveThresholds = {};

    Object.entries(scores).forEach(([metric, score]) => {
      const detector = this.detectors.get(metric);
      if (!detector) return;

      // Update rolling scores
      this.updateRollingScores(metric, score);

      // Get change point detection result
      const result = detector.update(score);
      const baseThreshold = this.baseThresholds[metric];
      
      // Calculate adaptive threshold
      const adaptiveThreshold = detector.getAdaptiveThreshold(
        baseThreshold,
        result.changeProbability,
        this.config.thresholdSensitivity
      );

      thresholds[metric] = {
        baseThreshold,
        adaptiveThreshold,
        changeProbability: result.changeProbability,
        confidence: 1 - result.changeProbability,
        lastUpdate: Date.now(),
        sampleCount: this.rollingScores.get(metric)?.length || 0,
        adjustmentReason: this.getAdjustmentReason(result)
      };
    });

    return thresholds;
  }

  /**
   * Get current thresholds without updating
   */
  getCurrentThresholds(): AdaptiveThresholds {
    const thresholds: AdaptiveThresholds = {};

    Object.keys(this.baseThresholds).forEach(metric => {
      const rollingScores = this.rollingScores.get(metric) || [];
      const detector = this.detectors.get(metric);
      
      if (rollingScores.length >= this.config.minSamples && detector) {
        // Use latest adaptive calculation
        const latestScore = rollingScores[rollingScores.length - 1];
        const result = detector.update(latestScore);
        
        thresholds[metric] = {
          baseThreshold: this.baseThresholds[metric],
          adaptiveThreshold: detector.getAdaptiveThreshold(
            this.baseThresholds[metric],
            result.changeProbability,
            this.config.thresholdSensitivity
          ),
          changeProbability: result.changeProbability,
          confidence: 1 - result.changeProbability,
          lastUpdate: Date.now(),
          sampleCount: rollingScores.length,
          adjustmentReason: this.getAdjustmentReason(result)
        };
      } else {
        // Use base threshold
        thresholds[metric] = {
          baseThreshold: this.baseThresholds[metric],
          adaptiveThreshold: this.baseThresholds[metric],
          changeProbability: 0,
          confidence: 1.0,
          lastUpdate: Date.now(),
          sampleCount: rollingScores.length,
          adjustmentReason: 'Insufficient data for adaptation'
        };
      }
    });

    return thresholds;
  }

  /**
   * Reset all detectors (for new session)
   */
  reset(): void {
    this.detectors.forEach(detector => detector.reset());
    this.rollingScores.clear();
  }

  /**
   * Reset specific detector
   */
  resetMetric(metric: string): void {
    const detector = this.detectors.get(metric);
    if (detector) {
      detector.reset();
    }
    this.rollingScores.delete(metric);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Record<string, {
    sampleCount: number;
    avgChangeProbability: number;
    adjustmentFrequency: number;
    currentAdaptation: number;
  }> {
    const stats: Record<string, any> = {};

    Object.keys(this.baseThresholds).forEach(metric => {
      const rollingScores = this.rollingScores.get(metric) || [];
      const currentThresholds = this.getCurrentThresholds();
      const thresholdState = currentThresholds[metric];

      stats[metric] = {
        sampleCount: rollingScores.length,
        avgChangeProbability: this.calculateAverageChangeProbability(rollingScores),
        adjustmentFrequency: this.calculateAdjustmentFrequency(thresholdState),
        currentAdaptation: thresholdState.adjustmentFactor || 1.0
      };
    });

    return stats;
  }

  private initializeDetectors(): void {
    Object.keys(this.baseThresholds).forEach(metric => {
      // Use BOCPD for critical metrics, CUSUM for simpler ones
      if (['adversarial', 'resonance'].includes(metric)) {
        this.detectors.set(metric, new BayesianOnlineChangePointDetector(this.config));
      } else {
        // Use recent average and standard deviation for CUSUM
        const rollingScores = this.rollingScores.get(metric) || [];
        if (rollingScores.length > 0) {
          const mean = rollingScores.reduce((a, b) => a + b, 0) / rollingScores.length;
          const std = Math.sqrt(
            rollingScores.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / rollingScores.length
          );
          this.detectors.set(metric, new CUSUMDetector(mean, std || 0.1));
        } else {
          this.detectors.set(metric, new CUSUMDetector(0.5, 0.1));
        }
      }
    });
  }

  private updateRollingScores(metric: string, score: number): void {
    if (!this.rollingScores.has(metric)) {
      this.rollingScores.set(metric, []);
    }
    
    const scores = this.rollingScores.get(metric)!;
    scores.push(score);
    
    // Maintain rolling window
    if (scores.length > this.config.maxMemory) {
      scores.shift();
    }
  }

  private getAdjustmentReason(result: ChangePointResult): string {
    if (result.isChangePoint) {
      return `Change point detected (evidence: ${result.evidence.toFixed(3)})`;
    }
    
    if (result.changeProbability > 0.3) {
      return `High change probability (${(result.changeProbability * 100).toFixed(1)}%)`;
    }
    
    if (result.changeProbability > 0.1) {
      return `Moderate change probability (${(result.changeProbability * 100).toFixed(1)}%)`;
    }
    
    return 'Stable distribution';
  }

  private calculateAverageChangeProbability(scores: number[]): number {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + Math.abs(score - 0.5), 0) / scores.length;
  }

  private calculateAdjustmentFrequency(thresholdState: ThresholdState): number {
    if (thresholdState.sampleCount === 0) return 0;
    return thresholdState.adjustmentFactor !== 1.0 ? 1.0 : 0.0;
  }
}

// Factory function
export function createAdaptiveThresholdManager(
  baseThresholds: Record<string, number>,
  config?: Partial<AdaptiveThresholdConfig>
): AdaptiveThresholdManager {
  return new AdaptiveThresholdManager(baseThresholds, config);
}

// Default base thresholds for the system
export const DEFAULT_BASE_THRESHOLDS = {
  adversarial: 0.3,
  cosine: 0.75,
  resonance: 0.7,
  ethical_score: 0.65,
  alignment: 0.6,
  continuity: 0.5,
  scaffold: 0.55
};