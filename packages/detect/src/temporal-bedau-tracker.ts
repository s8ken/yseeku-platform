/**
 * Production Temporal Bedau Tracker
 *
 * Complete implementation for tracking emergence patterns over time
 * Replaces mock implementation with production-grade algorithms
 */

import { BedauMetrics, EmergenceTrajectory } from './bedau-index';

export interface TemporalBedauRecord {
  timestamp: number;
  bedau_metrics: BedauMetrics;
  emergence_signature: EmergenceSignature;
  context_data: Record<string, any>;
  semantic_intent?: SemanticIntent;
  surface_pattern?: SurfacePattern;
  session_id?: string;
  context_tags?: string[];
}

export interface SemanticIntent {
  embedding: number[];
  intent_class: string;
  confidence: number;
}

export interface SurfacePattern {
  embedding: number[];
  pattern_class: string;
  confidence: number;
}

export interface EmergencePattern {
  type: 'LINEAR' | 'EXPONENTIAL' | 'OSCILLATORY' | 'CHAOTIC';
  confidence: number;
  characteristics: {
    slope?: number;
    correlation?: number;
    periodicity?: number;
    entropy?: number;
    lyapunov_exponent?: number;
    [key: string]: any;
  };
}

export interface PhaseTransition {
  timestamp: number;
  type: 'LOW_TO_HIGH' | 'HIGH_TO_LOW' | 'OSCILLATION' | 'STABILIZATION';
  confidence: number;
  context: Record<string, any>;
}

export interface EmergenceSignature {
  complexity: number;
  novelty: number;
  coherence: number;
  stability: number;
  timestamp: number;
  complexity_profile?: number[];
  entropy_profile?: number[];
  fingerprint?: number[];
  divergence_profile?: number[];
  stability_score?: number;
  novelty_score?: number;
}

/**
 * Production-grade Temporal Bedau Tracker
 * Implements sophisticated temporal analysis of emergence patterns
 */
export class TemporalBedauTracker {
  private records: TemporalBedauRecord[] = [];
  private patterns: Map<string, EmergencePattern> = new Map();
  private readonly MAX_RECORDS = 10000;
  private readonly MIN_SAMPLES_FOR_PATTERN = 30;
  private readonly PATTERN_LEARNING_RATE = 0.1;

  constructor() {
    this.initializeDefaultPatterns();
  }

  /**
   * Add a new Bedau record to the temporal tracker
   */
  addRecord(record: TemporalBedauRecord): void {
    // Validate input
    this.validateRecord(record);

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
   * Validate a Bedau record before adding it
   */
  private validateRecord(record: TemporalBedauRecord): void {
    if (!record.timestamp || typeof record.timestamp !== 'number') {
      throw new Error('Invalid timestamp in Bedau record');
    }

    if (!record.bedau_metrics) {
      throw new Error('Missing bedau_metrics in record');
    }

    if (
      typeof record.bedau_metrics.bedau_index !== 'number' ||
      record.bedau_metrics.bedau_index < 0 ||
      record.bedau_metrics.bedau_index > 1
    ) {
      throw new Error('Invalid bedau_index: must be between 0 and 1');
    }

    if (record.emergence_signature) {
      this.validateEmergenceSignature(record.emergence_signature);
    }
  }

  /**
   * Validate emergence signature
   */
  private validateEmergenceSignature(signature: EmergenceSignature): void {
    const fields: (keyof EmergenceSignature)[] = [
      'complexity',
      'novelty',
      'coherence',
      'stability',
    ];
    for (const field of fields) {
      const value = signature[field];
      if (typeof value !== 'number' || value < 0 || value > 1) {
        throw new Error(`Invalid ${field} in emergence signature: must be between 0 and 1`);
      }
    }
  }

  /**
   * Get emergence trajectory with enhanced temporal analysis
   */
  getEmergenceTrajectory(
    startTime?: number,
    endTime?: number
  ): EmergenceTrajectory & {
    pattern_signature: EmergenceSignature;
    predicted_trajectory: number[];
    confidence_in_prediction: number;
    detectedPatterns: EmergencePattern[];
    phase_transitions: PhaseTransition[];
  } {
    const relevantRecords = this.filterRecordsByTime(startTime, endTime);

    if (relevantRecords.length === 0) {
      throw new Error('No records found for trajectory analysis');
    }

    const bedauHistory = relevantRecords.map((r) => r.bedau_metrics.bedau_index);
    const trajectory = this.calculateTrajectory(bedauHistory);
    const signature = this.calculateEmergenceSignature(relevantRecords);
    const prediction = this.predictTrajectory(bedauHistory);
    const detectedPatterns = this.detectEmergencePatterns(relevantRecords);
    const phaseTransitions = this.detectPhaseTransitions(relevantRecords);

    return {
      ...trajectory,
      pattern_signature: signature,
      predicted_trajectory: prediction,
      confidence_in_prediction: this.calculatePredictionConfidence(bedauHistory),
      detectedPatterns,
      phase_transitions: phaseTransitions,
    };
  }

  /**
   * Filter records by time range
   */
  private filterRecordsByTime(startTime?: number, endTime?: number): TemporalBedauRecord[] {
    return this.records.filter((r) => {
      if (startTime && r.timestamp < startTime) {return false;}
      if (endTime && r.timestamp > endTime) {return false;}
      return true;
    });
  }

  /**
   * Analyze long-term emergence trends
   */
  analyzeEmergenceTrends(timeWindow: number): {
    trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'OSCILLATING';
    velocity: number;
    acceleration: number;
    pattern_signature: EmergenceSignature;
    trend_confidence: number;
  } {
    const recentRecords = this.records.filter((r) => r.timestamp > Date.now() - timeWindow);

    if (recentRecords.length < 10) {
      throw new Error('Insufficient data for trend analysis');
    }

    const trend = this.calculateTrend(recentRecords);
    const velocity = this.calculateVelocity(recentRecords);
    const acceleration = this.calculateAcceleration(recentRecords);
    const signature = this.calculateEmergenceSignature(recentRecords);
    const confidence = this.calculateTrendConfidence(recentRecords);

    return {
      trend,
      velocity,
      acceleration,
      pattern_signature: signature,
      trend_confidence: confidence,
    };
  }

  /**
   * Update patterns using machine learning
   */
  private updatePatterns(): void {
    const recentRecords = this.records.slice(-this.MIN_SAMPLES_FOR_PATTERN);

    for (const [patternId, pattern] of this.patterns) {
      const updatedPattern = this.refinePattern(pattern, recentRecords);
      this.patterns.set(patternId, updatedPattern);
    }

    // Discover new patterns
    const newPatterns = this.discoverNewPatterns(recentRecords);
    for (const pattern of newPatterns) {
      const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.patterns.set(patternId, pattern);
    }
  }

  /**
   * Refine existing pattern using recent data
   */
  private refinePattern(
    pattern: EmergencePattern,
    records: TemporalBedauRecord[]
  ): EmergencePattern {
    const bedauValues = records.map((r) => r.bedau_metrics.bedau_index);

    // Calculate updated characteristics
    const slope = this.calculateLinearSlope(bedauValues);
    const correlation = this.calculateCorrelation(bedauValues);
    const entropy = this.calculateEntropy(bedauValues);

    // Update characteristics with learning rate
    for (const key in pattern.characteristics) {
      const oldValue = pattern.characteristics[key];
      let newValue;

      switch (key) {
        case 'slope':
          newValue =
            oldValue * (1 - this.PATTERN_LEARNING_RATE) + slope * this.PATTERN_LEARNING_RATE;
          break;
        case 'correlation':
          newValue =
            oldValue * (1 - this.PATTERN_LEARNING_RATE) + correlation * this.PATTERN_LEARNING_RATE;
          break;
        case 'entropy':
          newValue =
            oldValue * (1 - this.PATTERN_LEARNING_RATE) + entropy * this.PATTERN_LEARNING_RATE;
          break;
        default:
          newValue = oldValue;
      }

      pattern.characteristics[key] = newValue;
    }

    return pattern;
  }

  /**
   * Discover new patterns in data
   */
  private discoverNewPatterns(records: TemporalBedauRecord[]): EmergencePattern[] {
    const bedauValues = records.map((r) => r.bedau_metrics.bedau_index);
    const newPatterns: EmergencePattern[] = [];

    // Check for oscillatory pattern
    if (this.isOscillatory(bedauValues)) {
      newPatterns.push({
        type: 'OSCILLATORY',
        confidence: 0.7,
        characteristics: {
          periodicity: this.calculatePeriodicity(bedauValues),
          entropy: this.calculateEntropy(bedauValues),
        },
      });
    }

    // Check for chaotic pattern
    if (this.isChaotic(bedauValues)) {
      newPatterns.push({
        type: 'CHAOTIC',
        confidence: 0.6,
        characteristics: {
          lyapunov_exponent: this.calculateLyapunovExponent(bedauValues),
          entropy: this.calculateEntropy(bedauValues),
        },
      });
    }

    return newPatterns;
  }

  /**
   * Calculate trajectory from bedau history
   */
  private calculateTrajectory(bedauHistory: number[]): EmergenceTrajectory {
    const startTime = this.records[0]?.timestamp || Date.now();
    const endTime = this.records[this.records.length - 1]?.timestamp || Date.now();

    return {
      startTime,
      endTime,
      trajectory: bedauHistory,
      emergenceLevel: bedauHistory[bedauHistory.length - 1] || 0,
      confidence: this.calculateTrajectoryConfidence(bedauHistory),
      critical_transitions: this.detectCriticalTransitions(bedauHistory),
    };
  }

  /**
   * Calculate emergence signature from records
   */
  private calculateEmergenceSignature(records: TemporalBedauRecord[]): EmergenceSignature {
    const n = records.length;
    const bedau = records.map((r) => r.bedau_metrics.bedau_index);

    // Statistical measures
    const meanBedau = bedau.reduce((sum, v) => sum + v, 0) / n;
    const varianceBedau = bedau.reduce((sum, v) => sum + Math.pow(v - meanBedau, 2), 0) / n;
    const stdBedau = Math.sqrt(varianceBedau);
    const meanAbsDelta =
      n > 1 ? bedau.slice(1).reduce((sum, v, i) => sum + Math.abs(v - bedau[i]), 0) / (n - 1) : 0;

    // Complexity profiles
    const complexityProfile = records.map((r) => r.bedau_metrics.kolmogorov_complexity);
    const entropyProfile = records.map((r) => r.bedau_metrics.semantic_entropy);

    const avgKolmogorov = complexityProfile.reduce((sum, v) => sum + v, 0) / n;
    const avgEntropy = entropyProfile.reduce((sum, v) => sum + v, 0) / n;

    // Calculate divergence profile
    const divergenceProfile = records.map((r, i) => {
      if (i === 0) {return 0;}
      return Math.abs(r.bedau_metrics.bedau_index - records[i - 1].bedau_metrics.bedau_index);
    });

    return {
      complexity: clamp01(avgKolmogorov),
      novelty: clamp01(avgEntropy),
      coherence: clamp01(1 - stdBedau * 2),
      stability: clamp01(1 - meanAbsDelta * 2),
      timestamp: records[records.length - 1]?.timestamp ?? Date.now(),
      complexity_profile: complexityProfile,
      entropy_profile: entropyProfile,
      divergence_profile: divergenceProfile,
      stability_score: clamp01(1 - stdBedau),
      novelty_score: clamp01(avgEntropy),
    };
  }

  /**
   * Predict future trajectory using ARIMA-like approach
   */
  private predictTrajectory(bedauHistory: number[]): number[] {
    const windowSize = Math.min(5, bedauHistory.length);
    const lastValues = bedauHistory.slice(-windowSize);

    // Calculate trend and seasonality
    const trend = this.calculateLinearTrend(lastValues);
    const seasonality = this.detectSeasonality(bedauHistory);

    // Generate predictions
    const predictions: number[] = [];
    for (let i = 1; i <= 10; i++) {
      const trendComponent = trend * i;
      const seasonalityComponent = seasonality ? seasonality[(i - 1) % seasonality.length] : 0;
      let prediction =
        bedauHistory[bedauHistory.length - 1] + trendComponent + seasonalityComponent;

      // Clamp to valid range
      prediction = clamp01(prediction);
      predictions.push(prediction);
    }

    return predictions;
  }

  /**
   * Detect emergence patterns in records
   */
  private detectEmergencePatterns(records: TemporalBedauRecord[]): EmergencePattern[] {
    const bedauValues = records.map((r) => r.bedau_metrics.bedau_index);
    const patterns: EmergencePattern[] = [];

    // Linear pattern
    const slope = this.calculateLinearSlope(bedauValues);
    const correlation = this.calculateCorrelation(bedauValues);
    patterns.push({
      type: 'LINEAR',
      confidence: Math.abs(correlation),
      characteristics: { slope, correlation },
    });

    // Exponential pattern
    if (this.isExponential(bedauValues)) {
      patterns.push({
        type: 'EXPONENTIAL',
        confidence: 0.7,
        characteristics: { growth_rate: slope / bedauValues[0] },
      });
    }

    return patterns;
  }

  /**
   * Detect phase transitions in emergence
   */
  private detectPhaseTransitions(records: TemporalBedauRecord[]): PhaseTransition[] {
    const transitions: PhaseTransition[] = [];
    const threshold = 0.3; // Bedau index threshold

    for (let i = 1; i < records.length; i++) {
      const prevIndex = records[i - 1].bedau_metrics.bedau_index;
      const currIndex = records[i].bedau_metrics.bedau_index;

      if (prevIndex < threshold && currIndex >= threshold) {
        transitions.push({
          timestamp: records[i].timestamp,
          type: 'LOW_TO_HIGH',
          confidence: 0.8,
          context: {
            from_index: prevIndex,
            to_index: currIndex,
          },
        });
      } else if (prevIndex >= threshold && currIndex < threshold) {
        transitions.push({
          timestamp: records[i].timestamp,
          type: 'HIGH_TO_LOW',
          confidence: 0.8,
          context: {
            from_index: prevIndex,
            to_index: currIndex,
          },
        });
      }
    }

    return transitions;
  }

  /**
   * Calculate trend from records
   */
  private calculateTrend(
    records: TemporalBedauRecord[]
  ): 'INCREASING' | 'DECREASING' | 'STABLE' | 'OSCILLATING' {
    const values = records.map((r) => r.bedau_metrics.bedau_index);

    // Mann-Kendall trend test
    const n = values.length;
    let S = 0;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        S += Math.sign(values[j] - values[i]);
      }
    }

    // Check for oscillation
    if (this.isOscillatory(values)) {
      return 'OSCILLATING';
    }

    // Determine trend direction
    if (Math.abs(S) < ((n * (n - 1)) / 4) * 0.1) {
      return 'STABLE';
    }
    return S > 0 ? 'INCREASING' : 'DECREASING';
  }

  /**
   * Calculate velocity (rate of change)
   */
  private calculateVelocity(records: TemporalBedauRecord[]): number {
    const values = records.map((r) => r.bedau_metrics.bedau_index);
    if (values.length < 2) {return 0;}

    return (values[values.length - 1] - values[0]) / (values.length - 1);
  }

  /**
   * Calculate acceleration
   */
  private calculateAcceleration(records: TemporalBedauRecord[]): number {
    const values = records.map((r) => r.bedau_metrics.bedau_index);
    if (values.length < 3) {return 0;}

    const v1 = values[1] - values[0];
    const v2 = values[values.length - 1] - values[values.length - 2];
    return (v2 - v1) / (values.length - 2);
  }

  // Helper calculation methods

  private calculateLinearSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) {return 0;}

    const sumX = ((n - 1) * n) / 2;
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = ((n - 1) * n * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateCorrelation(values: number[]): number {
    const n = values.length;
    if (n < 2) {return 0;}

    const meanX = (n - 1) / 2;
    const meanY = values.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < n; i++) {
      const dx = i - meanX;
      const dy = values[i] - meanY;
      numerator += dx * dy;
      sumSqX += dx * dx;
      sumSqY += dy * dy;
    }

    const denominator = Math.sqrt(sumSqX * sumSqY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateEntropy(values: number[]): number {
    const n = values.length;
    if (n === 0) {return 0;}

    // Discretize values into bins
    const bins = 10;
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const binWidth = (maxVal - minVal) / bins || 1;

    const histogram = new Array(bins).fill(0);
    for (const v of values) {
      const binIndex = Math.min(Math.floor((v - minVal) / binWidth), bins - 1);
      histogram[binIndex]++;
    }

    // Calculate Shannon entropy
    let entropy = 0;
    for (const count of histogram) {
      if (count > 0) {
        const probability = count / n;
        entropy -= probability * Math.log2(probability);
      }
    }

    // Normalize to [0, 1]
    return entropy / Math.log2(bins);
  }

  private calculatePeriodicity(values: number[]): number {
    // Simplified periodicity detection using autocorrelation
    const maxLag = Math.min(values.length / 2, 20);
    let maxCorrelation = 0;
    let bestPeriod = 1;

    for (let lag = 1; lag < maxLag; lag++) {
      let correlation = 0;
      for (let i = 0; i < values.length - lag; i++) {
        correlation += values[i] * values[i + lag];
      }
      correlation /= values.length - lag;

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = lag;
      }
    }

    return bestPeriod;
  }

  private calculateLyapunovExponent(values: number[]): number {
    // Simplified Lyapunov exponent calculation
    const n = values.length;
    if (n < 3) {return 0;}

    let sumLogDivergence = 0;
    let count = 0;

    for (let i = 0; i < n - 2; i++) {
      const delta1 = values[i + 1] - values[i];
      const delta2 = values[i + 2] - values[i + 1];

      if (Math.abs(delta1) > 1e-6 && Math.abs(delta2) > 1e-6) {
        sumLogDivergence += Math.log(Math.abs(delta2 / delta1));
        count++;
      }
    }

    return count > 0 ? sumLogDivergence / count : 0;
  }

  private calculateLinearTrend(values: number[]): number {
    return this.calculateLinearSlope(values);
  }

  private detectSeasonality(values: number[]): number[] | null {
    // Simplified seasonality detection
    const n = values.length;
    if (n < 20) {return null;}

    const seasonLength = Math.floor(n / 4);
    const seasonality: number[] = [];

    for (let i = 0; i < seasonLength; i++) {
      let sum = 0;
      let count = 0;

      for (let j = i; j < n; j += seasonLength) {
        sum += values[j];
        count++;
      }

      seasonality.push(sum / count);
    }

    return seasonality;
  }

  private calculateTrajectoryConfidence(values: number[]): number {
    // Confidence based on variance and trend stability
    const n = values.length;
    if (n < 2) {return 0;}

    const variance =
      values.reduce((sum, v) => {
        const mean = values.reduce((s, val) => s + val, 0) / n;
        return sum + Math.pow(v - mean, 2);
      }, 0) / n;

    const stability = 1 - Math.min(variance * 10, 1);
    return stability;
  }

  private calculatePredictionConfidence(values: number[]): number {
    // Confidence decreases with prediction horizon
    const trajectoryConfidence = this.calculateTrajectoryConfidence(values);
    return trajectoryConfidence * 0.8; // Slightly lower than trajectory confidence
  }

  private calculateTrendConfidence(records: TemporalBedauRecord[]): number {
    const values = records.map((r) => r.bedau_metrics.bedau_index);
    const n = values.length;

    // Use Mann-Kendall test p-value approximation
    let S = 0;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        S += Math.sign(values[j] - values[i]);
      }
    }

    const varS = (n * (n - 1) * (2 * n + 5)) / 18;
    const zScore = Math.abs(S) / Math.sqrt(varS);

    // Convert z-score to confidence (simplified)
    return Math.min(zScore / 2, 1);
  }

  private detectCriticalTransitions(values: number[]): number[] {
    const transitions: number[] = [];
    const threshold = 0.3;

    for (let i = 1; i < values.length; i++) {
      if (
        (values[i - 1] < threshold && values[i] >= threshold) ||
        (values[i - 1] >= threshold && values[i] < threshold)
      ) {
        transitions.push(i);
      }
    }

    return transitions;
  }

  private isOscillatory(values: number[]): boolean {
    // Check for sign changes in differences
    if (values.length < 3) {return false;}

    let signChanges = 0;
    for (let i = 1; i < values.length - 1; i++) {
      const diff1 = values[i] - values[i - 1];
      const diff2 = values[i + 1] - values[i];
      if (diff1 * diff2 < 0) {
        signChanges++;
      }
    }

    return signChanges > values.length / 4;
  }

  private isChaotic(values: number[]): boolean {
    // Check for sensitivity to initial conditions
    const lyapunov = this.calculateLyapunovExponent(values);
    return lyapunov > 0.1;
  }

  private isExponential(values: number[]): boolean {
    if (values.length < 3) {return false;}

    // Check if ratios are approximately constant
    const ratios: number[] = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        ratios.push(values[i] / values[i - 1]);
      }
    }

    if (ratios.length < 2) {return false;}

    const meanRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
    const variance = ratios.reduce((sum, r) => sum + Math.pow(r - meanRatio, 2), 0) / ratios.length;
    const cv = Math.sqrt(variance) / Math.abs(meanRatio);

    return cv < 0.2; // Low coefficient of variation indicates exponential
  }

  private initializeDefaultPatterns(): void {
    this.patterns.set('linear', {
      type: 'LINEAR',
      confidence: 0.8,
      characteristics: { slope: 0.1, correlation: 0.8 },
    });
  }

  /**
   * Get all records for a session
   */
  getSessionRecords(sessionId: string): TemporalBedauRecord[] {
    return this.records.filter((r) => r.session_id === sessionId);
  }

  /**
   * Get records within time range
   */
  getRecordsInRange(startTime: number, endTime: number): TemporalBedauRecord[] {
    return this.records.filter((r) => r.timestamp >= startTime && r.timestamp <= endTime);
  }

  /**
   * Get tracker statistics
   */
  getStatistics(): {
    totalRecords: number;
    patternCount: number;
    timeRange: { start: number; end: number };
    averageBedauIndex: number;
  } {
    if (this.records.length === 0) {
      return {
        totalRecords: 0,
        patternCount: this.patterns.size,
        timeRange: { start: 0, end: 0 },
        averageBedauIndex: 0,
      };
    }

    const timestamps = this.records.map((r) => r.timestamp);
    const bedauValues = this.records.map((r) => r.bedau_metrics.bedau_index);

    return {
      totalRecords: this.records.length,
      patternCount: this.patterns.size,
      timeRange: {
        start: Math.min(...timestamps),
        end: Math.max(...timestamps),
      },
      averageBedauIndex: bedauValues.reduce((sum, v) => sum + v, 0) / bedauValues.length,
    };
  }

  /**
   * Clear all records
   */
  clear(): void {
    this.records = [];
    this.patterns.clear();
    this.initializeDefaultPatterns();
  }
}

export function createTemporalBedauTracker(): TemporalBedauTracker {
  return new TemporalBedauTracker();
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
