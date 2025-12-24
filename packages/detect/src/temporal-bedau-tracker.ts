/**
 * Temporal Bedau Tracker - Historical Analysis & Pattern Recognition
 * 
 * Tracks Bedau Index evolution over time to identify:
 * - Emergence trajectories and patterns
 * - Long-term cognitive development trends
 * - Phase transitions in system behavior
 * - Predictive emergence indicators
 */

import { BedauMetrics, SemanticIntent, SurfacePattern } from './bedau-index';
import { EmergenceTrajectory } from './emergence-detection';

export interface TemporalBedauRecord {
  timestamp: number;
  bedau_metrics: BedauMetrics;
  semantic_intent: SemanticIntent;
  surface_pattern: SurfacePattern;
  session_id: string;
  context_tags: string[];
}

export interface EmergencePattern {
  pattern_id: string;
  name: string;
  description: string;
  detection_signature: number[];  // Characteristic Bedau signature
  confidence: number;            // 0-1
  phase_transitions: PhaseTransition[];
}

export interface PhaseTransition {
  from_type: 'LINEAR' | 'WEAK_EMERGENCE';
  to_type: 'LINEAR' | 'WEAK_EMERGENCE';
  transition_point: number;      // Timestamp index
  transition_duration: number;   // Duration in samples
  catalyst_factors: string[];    // Factors that triggered transition
}

export interface EmergenceSignature {
  fingerprint: number[];         // Multi-dimensional emergence profile
  complexity_profile: number[];  // Kolmogorov complexity over time
  entropy_profile: number[];     // Semantic entropy over time
  divergence_profile: number[];  // Semantic-surface divergence over time
  stability_score: number;       // 0-1: How stable the emergence pattern is
  novelty_score: number;         // 0-1: How novel the pattern is
}

/**
 * Temporal Bedau Tracker
 * 
 * Manages historical Bedau Index data and provides temporal analysis
 * capabilities for emergence research.
 */
export class TemporalBedauTracker {
  private records: TemporalBedauRecord[] = [];
  private patterns: Map<string, EmergencePattern> = new Map();
  private readonly MAX_RECORDS = 10000;  // Maximum records to keep in memory
  private readonly MIN_SAMPLES_FOR_PATTERN = 10;  // Minimum samples for pattern detection

  /**
   * Add a new Bedau record to the temporal tracker
   */
  addRecord(record: TemporalBedauRecord): void {
    this.records.push(record);
    
    // Maintain memory limit
    if (this.records.length > this.MAX_RECORDS) {
      this.records = this.records.slice(-this.MAX_RECORDS);
    }
    
    // Update patterns if we have enough data
    if (this.records.length >= this.MIN_SAMPLES_FOR_PATTERN) {
      this.updatePatterns();
    }
  }

  /**
   * Get emergence trajectory with enhanced temporal analysis
   */
  getEmergenceTrajectory(sessionId?: string): EmergenceTrajectory & {
    pattern_signature: EmergenceSignature;
    predicted_trajectory: number[];
    confidence_in_prediction: number;
    detected_patterns: EmergencePattern[];
  } {
    const relevantRecords = sessionId 
      ? this.records.filter(r => r.session_id === sessionId)
      : this.records;

    if (relevantRecords.length === 0) {
      throw new Error('No records found for trajectory analysis');
    }

    const bedauHistory = relevantRecords.map(r => r.bedau_metrics.bedau_index);
    const trajectory = this.calculateTrajectory(bedauHistory);
    const signature = this.calculateEmergenceSignature(relevantRecords);
    const prediction = this.predictTrajectory(bedauHistory);
    const detectedPatterns = this.detectEmergencePatterns(relevantRecords);

    return {
      ...trajectory,
      pattern_signature: signature,
      predicted_trajectory: prediction.predictions,
      confidence_in_prediction: prediction.confidence,
      detected_patterns
    };
  }

  /**
   * Analyze long-term emergence trends
   */
  analyzeLongTermTrends(timeWindow: number = 100): {
    trend_direction: 'improving' | 'declining' | 'stable';
    trend_strength: number;      // 0-1
    cyclical_patterns: number[]; // Periodicities detected
    anomaly_score: number;       // 0-1: How anomalous recent behavior is
    phase_space_position: { x: number; y: number }; // Current position in emergence phase space
  } {
    const recentRecords = this.records.slice(-timeWindow);
    
    if (recentRecords.length < 10) {
      throw new Error('Insufficient data for trend analysis');
    }

    const bedauIndices = recentRecords.map(r => r.bedau_metrics.bedau_index);
    
    // Calculate trend direction and strength
    const trend = this.calculateTrend(bedauIndices);
    
    // Detect cyclical patterns using autocorrelation
    const cyclicalPatterns = this.detectCyclicalPatterns(bedauIndices);
    
    // Calculate anomaly score
    const anomalyScore = this.calculateAnomalyScore(bedauIndices);
    
    // Calculate phase space position (complexity vs. entropy)
    const latestRecord = recentRecords[recentRecords.length - 1];
    const phaseSpacePosition = {
      x: latestRecord.bedau_metrics.kolmogorov_complexity,
      y: latestRecord.bedau_metrics.semantic_entropy
    };

    return {
      trend_direction: trend.direction,
      trend_strength: trend.strength,
      cyclical_patterns: cyclicalPatterns,
      anomaly_score: anomalyScore,
      phase_space_position: phaseSpacePosition
    };
  }

  /**
   * Detect phase transitions in emergence behavior
   */
  detectPhaseTransitions(minimumDuration: number = 5): PhaseTransition[] {
    const transitions: PhaseTransition[] = [];
    
    if (this.records.length < minimumDuration * 2) {
      return transitions;
    }

    const emergenceTypes = this.records.map(r => r.bedau_metrics.emergence_type);
    
    for (let i = minimumDuration; i < emergenceTypes.length - minimumDuration; i++) {
      const beforeType = emergenceTypes[i - minimumDuration];
      const afterType = emergenceTypes[i + minimumDuration];
      
      if (beforeType !== afterType) {
        // Look for transition start and end
        const transitionStart = this.findTransitionStart(emergenceTypes, i, beforeType, afterType);
        const transitionEnd = this.findTransitionEnd(emergenceTypes, i, beforeType, afterType);
        
        if (transitionStart !== -1 && transitionEnd !== -1) {
          const catalysts = this.identifyCatalystFactors(transitionStart, transitionEnd);
          
          transitions.push({
            from_type: beforeType,
            to_type: afterType,
            transition_point: transitionStart,
            transition_duration: transitionEnd - transitionStart,
            catalyst_factors: catalysts
          });
        }
      }
    }
    
    return transitions;
  }

  /**
   * Generate emergence signature fingerprint
   */
  generateSignatureFingerprint(timeWindow: number = 50): string {
    const recentRecords = this.records.slice(-timeWindow);
    
    if (recentRecords.length < 10) {
      throw new Error('Insufficient data for signature generation');
    }

    const signature = this.calculateEmergenceSignature(recentRecords);
    
    // Convert signature to hashable string
    const fingerprint = [
      signature.fingerprint.slice(0, 10).map(v => v.toFixed(3)).join(','),
      signature.stability_score.toFixed(3),
      signature.novelty_score.toFixed(3)
    ].join('|');

    return fingerprint;
  }

  // Private helper methods

  private calculateTrajectory(bedauHistory: number[]): EmergenceTrajectory {
    const n = bedauHistory.length;
    
    // Calculate linear regression for trend
    const xMean = (n - 1) / 2;
    const yMean = bedauHistory.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = bedauHistory[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const trend = slope > 0.01 ? 'improving' : slope < -0.01 ? 'declining' : 'stable';
    
    // Calculate velocity and acceleration
    const velocity = n >= 2 ? bedauHistory[n - 1] - bedauHistory[n - 2] : 0;
    const acceleration = n >= 3 ? 
      (bedauHistory[n - 1] - bedauHistory[n - 2]) - (bedauHistory[n - 2] - bedauHistory[n - 3]) : 0;
    
    return {
      history: bedauHistory,
      trend,
      velocity,
      acceleration
    };
  }

  private calculateEmergenceSignature(records: TemporalBedauRecord[]): EmergenceSignature {
    const windowSize = records.length;
    
    // Extract profiles
    const complexityProfile = records.map(r => r.bedau_metrics.kolmogorov_complexity);
    const entropyProfile = records.map(r => r.bedau_metrics.semantic_entropy);
    const divergenceProfile = records.map(r => r.bedau_metrics.bedau_index);
    
    // Generate fingerprint using statistical moments
    const fingerprint = [
      this.mean(divergenceProfile),
      this.stdDev(divergenceProfile),
      this.skewness(divergenceProfile),
      this.kurtosis(divergenceProfile),
      this.mean(complexityProfile),
      this.stdDev(complexityProfile),
      this.mean(entropyProfile),
      this.stdDev(entropyProfile),
      this.autocorrelation(divergenceProfile, 1),
      this.autocorrelation(divergenceProfile, 5)
    ];
    
    // Calculate stability score (inverse of variance)
    const stabilityScore = 1 / (1 + this.variance(divergenceProfile));
    
    // Calculate novelty score (how different from historical patterns)
    const noveltyScore = this.calculateNoveltyScore(divergenceProfile);
    
    return {
      fingerprint,
      complexity_profile: complexityProfile,
      entropy_profile: entropyProfile,
      divergence_profile: divergenceProfile,
      stability_score: stabilityScore,
      novelty_score: noveltyScore
    };
  }

  private predictTrajectory(bedauHistory: number[], horizon: number = 10): {
    predictions: number[];
    confidence: number;
  } {
    // Simple ARIMA-like prediction using linear regression and recent trends
    const recentWindow = Math.min(20, bedauHistory.length);
    const recentData = bedauHistory.slice(-recentWindow);
    
    // Calculate trend and seasonality
    const trend = this.linearRegression(recentData);
    const seasonal = this.detectSeasonality(recentData);
    
    const predictions: number[] = [];
    let lastValue = recentData[recentData.length - 1];
    
    for (let i = 1; i <= horizon; i++) {
      const trendComponent = trend.slope * i;
      const seasonalComponent = seasonal ? seasonal[i % seasonal.length] : 0;
      const predictedValue = lastValue + trendComponent + seasonalComponent;
      
      predictions.push(Math.max(0, Math.min(1, predictedValue)));
      lastValue = predictedValue;
    }
    
    // Calculate confidence based on historical prediction accuracy
    const confidence = this.calculatePredictionConfidence(recentData);
    
    return { predictions, confidence };
  }

  private detectEmergencePatterns(records: TemporalBedauRecord[]): EmergencePattern[] {
    const detectedPatterns: EmergencePattern[] = [];
    
    for (const [patternId, pattern] of this.patterns) {
      const match = this.matchPattern(records, pattern);
      if (match.confidence > 0.7) {
        detectedPatterns.push({
          ...pattern,
          confidence: match.confidence
        });
      }
    }
    
    return detectedPatterns;
  }

  private updatePatterns(): void {
    // This would implement pattern learning from historical data
    // For now, we'll use predefined patterns
    if (this.patterns.size === 0) {
      this.initializeDefaultPatterns();
    }
  }

  private initializeDefaultPatterns(): void {
    // Predefined emergence patterns based on research
    const defaultPatterns: EmergencePattern[] = [
      {
        pattern_id: 'sudden_emergence',
        name: 'Sudden Emergence',
        description: 'Rapid transition from linear to weak emergence',
        detection_signature: [0.1, 0.15, 0.2, 0.4, 0.7, 0.8, 0.75],
        confidence: 0.8,
        phase_transitions: []
      },
      {
        pattern_id: 'gradual_emergence',
        name: 'Gradual Emergence',
        description: 'Slow, steady increase in emergence indicators',
        detection_signature: [0.1, 0.2, 0.3, 0.35, 0.4, 0.45, 0.5],
        confidence: 0.7,
        phase_transitions: []
      },
      {
        pattern_id: 'oscillating_emergence',
        name: 'Oscillating Emergence',
        description: 'Periodic fluctuations between emergence states',
        detection_signature: [0.3, 0.6, 0.3, 0.7, 0.3, 0.6, 0.4],
        confidence: 0.6,
        phase_transitions: []
      }
    ];
    
    defaultPatterns.forEach(pattern => {
      this.patterns.set(pattern.pattern_id, pattern);
    });
  }

  // Statistical utility methods
  private mean(arr: number[]): number {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  private variance(arr: number[]): number {
    const avg = this.mean(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
  }

  private stdDev(arr: number[]): number {
    return Math.sqrt(this.variance(arr));
  }

  private skewness(arr: number[]): number {
    const avg = this.mean(arr);
    const std = this.stdDev(arr);
    const n = arr.length;
    
    return arr.reduce((sum, val) => sum + Math.pow((val - avg) / std, 3), 0) / n;
  }

  private kurtosis(arr: number[]): number {
    const avg = this.mean(arr);
    const std = this.stdDev(arr);
    const n = arr.length;
    
    return arr.reduce((sum, val) => sum + Math.pow((val - avg) / std, 4), 0) / n - 3;
  }

  private autocorrelation(arr: number[], lag: number): number {
    const n = arr.length;
    if (lag >= n) return 0;
    
    const avg = this.mean(arr);
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - lag; i++) {
      numerator += (arr[i] - avg) * (arr[i + lag] - avg);
    }
    
    for (let i = 0; i < n; i++) {
      denominator += Math.pow(arr[i] - avg, 2);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private linearRegression(data: number[]): { slope: number; intercept: number } {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = (n - 1) / 2;
    const yMean = this.mean(data);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (data[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    return { slope, intercept };
  }

  private detectSeasonality(data: number[]): number[] | null {
    // Simple seasonality detection using autocorrelation
    const maxPeriod = Math.min(12, Math.floor(data.length / 2));
    let bestCorrelation = 0;
    let bestPeriod = 0;
    
    for (let period = 2; period <= maxPeriod; period++) {
      const correlation = Math.abs(this.autocorrelation(data, period));
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestCorrelation > 0.3 ? this.extractSeasonalPattern(data, bestPeriod) : null;
  }

  private extractSeasonalPattern(data: number[], period: number): number[] {
    const pattern: number[] = new Array(period).fill(0);
    const counts: number[] = new Array(period).fill(0);
    
    for (let i = 0; i < data.length; i++) {
      const seasonIndex = i % period;
      pattern[seasonIndex] += data[i];
      counts[seasonIndex]++;
    }
    
    return pattern.map((sum, i) => {
      const avg = sum / counts[i];
      const overallAvg = this.mean(data);
      return avg - overallAvg;
    });
  }

  private calculatePredictionConfidence(historicalData: number[]): number {
    if (historicalData.length < 4) return 0.5;
    
    // Use leave-one-out cross-validation to estimate prediction accuracy
    let totalError = 0;
    const n = historicalData.length;
    
    for (let i = 3; i < n; i++) {
      const trainingData = historicalData.slice(0, i);
      const actual = historicalData[i];
      const predicted = this.predictNextValue(trainingData);
      totalError += Math.abs(actual - predicted);
    }
    
    const avgError = totalError / (n - 3);
    const confidence = Math.max(0, 1 - avgError);
    
    return confidence;
  }

  private predictNextValue(data: number[]): number {
    if (data.length < 2) return data[data.length - 1];
    
    // Simple linear prediction
    const recentTrend = data[data.length - 1] - data[data.length - 2];
    return data[data.length - 1] + recentTrend * 0.5; // Dampen the trend
  }

  private matchPattern(records: TemporalBedauRecord[], pattern: EmergencePattern): {
    confidence: number;
  } {
    const recentBedau = records.slice(-pattern.detection_signature.length)
      .map(r => r.bedau_metrics.bedau_index);
    
    if (recentBedau.length !== pattern.detection_signature.length) {
      return { confidence: 0 };
    }
    
    // Calculate correlation between recent pattern and signature
    const correlation = this.calculateCorrelation(recentBedau, pattern.detection_signature);
    
    return { confidence: Math.max(0, correlation) };
  }

  private calculateCorrelation(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    const aMean = this.mean(a);
    const bMean = this.mean(b);
    
    let numerator = 0;
    let aDenom = 0;
    let bDenom = 0;
    
    for (let i = 0; i < a.length; i++) {
      const aDiff = a[i] - aMean;
      const bDiff = b[i] - bMean;
      numerator += aDiff * bDiff;
      aDenom += aDiff * aDiff;
      bDenom += bDiff * bDiff;
    }
    
    const denominator = Math.sqrt(aDenom * bDenom);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateTrend(data: number[]): { direction: 'improving' | 'declining' | 'stable'; strength: number } {
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = this.mean(data);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = data[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const strength = Math.min(1, Math.abs(slope) * 10); // Scale to 0-1
    
    const direction = slope > 0.01 ? 'improving' : slope < -0.01 ? 'declining' : 'stable';
    
    return { direction, strength };
  }

  private detectCyclicalPatterns(data: number[]): number[] {
    const periods: number[] = [];
    const maxPeriod = Math.min(20, Math.floor(data.length / 3));
    
    for (let period = 2; period <= maxPeriod; period++) {
      const correlation = Math.abs(this.autocorrelation(data, period));
      if (correlation > 0.5) {
        periods.push(period);
      }
    }
    
    return periods;
  }

  private calculateAnomalyScore(data: number[]): number {
    if (data.length < 10) return 0;
    
    const baseline = data.slice(0, Math.floor(data.length * 0.8));
    const recent = data.slice(-Math.floor(data.length * 0.2));
    
    const baselineMean = this.mean(baseline);
    const baselineStd = this.stdDev(baseline);
    const recentMean = this.mean(recent);
    
    // Z-score of recent behavior compared to baseline
    const zScore = Math.abs(recentMean - baselineMean) / baselineStd;
    
    // Convert to 0-1 scale (higher = more anomalous)
    return Math.min(1, zScore / 3);
  }

  private calculateNoveltyScore(currentPattern: number[]): number {
    if (this.records.length < 20) return 0.5; // Not enough history
    
    // Compare current pattern with historical patterns
    const historicalPatterns: number[][] = [];
    
    for (let i = 0; i <= this.records.length - currentPattern.length; i += 5) {
      const pattern = this.records.slice(i, i + currentPattern.length)
        .map(r => r.bedau_metrics.bedau_index);
      historicalPatterns.push(pattern);
    }
    
    if (historicalPatterns.length === 0) return 0.5;
    
    // Find minimum distance to any historical pattern
    let minDistance = Infinity;
    for (const historicalPattern of historicalPatterns) {
      const distance = this.calculateEuclideanDistance(currentPattern, historicalPattern);
      minDistance = Math.min(minDistance, distance);
    }
    
    // Convert distance to novelty score
    return Math.min(1, minDistance / 2);
  }

  private calculateEuclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return Infinity;
    
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
    );
  }

  private findTransitionStart(
    types: ('LINEAR' | 'WEAK_EMERGENCE')[], 
    centerIndex: number,
    fromType: 'LINEAR' | 'WEAK_EMERGENCE',
    toType: 'LINEAR' | 'WEAK_EMERGENCE'
  ): number {
    // Look backwards from centerIndex for the first fromType
    for (let i = centerIndex - 1; i >= 0; i--) {
      if (types[i] === fromType) {
        return i;
      }
    }
    return -1;
  }

  private findTransitionEnd(
    types: ('LINEAR' | 'WEAK_EMERGENCE')[], 
    centerIndex: number,
    fromType: 'LINEAR' | 'WEAK_EMERGENCE',
    toType: 'LINEAR' | 'WEAK_EMERGENCE'
  ): number {
    // Look forwards from centerIndex for the last toType
    for (let i = centerIndex + 1; i < types.length; i++) {
      if (types[i] !== toType) {
        return i - 1;
      }
    }
    return types.length - 1;
  }

  private identifyCatalystFactors(startIndex: number, endIndex: number): string[] {
    const catalysts: string[] = [];
    const transitionRecords = this.records.slice(startIndex, endIndex + 1);
    
    // Analyze factors that might have triggered the transition
    const avgComplexityBefore = startIndex > 0 ? 
      this.records[startIndex - 1].bedau_metrics.kolmogorov_complexity : 0;
    const avgComplexityAfter = transitionRecords[transitionRecords.length - 1].bedau_metrics.kolmogorov_complexity;
    
    if (avgComplexityAfter > avgComplexityBefore + 0.2) {
      catalysts.push('complexity_increase');
    }
    
    const avgEntropyBefore = startIndex > 0 ? 
      this.records[startIndex - 1].bedau_metrics.semantic_entropy : 0;
    const avgEntropyAfter = transitionRecords[transitionRecords.length - 1].bedau_metrics.semantic_entropy;
    
    if (avgEntropyAfter > avgEntropyBefore + 0.2) {
      catalysts.push('entropy_increase');
    }
    
    // Check for context tags that might explain the transition
    const contextTags = new Set<string>();
    for (const record of transitionRecords) {
      record.context_tags.forEach(tag => contextTags.add(tag));
    }
    
    if (contextTags.has('complex_query') || contextTags.has('novel_domain')) {
      catalysts.push('cognitive_challenge');
    }
    
    if (contextTags.has('stress_test') || contextTags.has('edge_case')) {
      catalysts.push('system_pressure');
    }
    
    return catalysts;
  }
}

/**
 * Factory function for creating temporal Bedau trackers
 */
export function createTemporalBedauTracker(): TemporalBedauTracker {
  return new TemporalBedauTracker();
}