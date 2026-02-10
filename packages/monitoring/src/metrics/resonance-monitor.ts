/**
 * Resonance Monitor
 * 
 * Tracks resonance score - an overall trust/quality metric
 * Combines multiple signals into a single score (0-1)
 * 
 * Resonance = f(truthfulness, coherence, clarity, safety)
 */

import type { TrustReceipt, Telemetry } from '@sonate/schemas';

/**
 * Resonance Measurement
 */
export interface ResonanceMeasure {
  receiptId: string;
  timestamp: string;
  
  // Component scores (0-1)
  truthfulness: number;
  coherence: number;
  clarity: number;
  safety: number;
  
  // Composite
  resonanceScore: number;
  resonanceQuality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
}

/**
 * Aggregated Resonance Metrics
 */
export interface AggregatedResonance {
  agentDid: string;
  windowSize: number;
  
  // Scores
  averageResonance: number;
  minResonance: number;
  maxResonance: number;
  
  // Quality distribution
  strongCount: number;
  advancedCount: number;
  breakthroughCount: number;
  
  // Trend
  trend: number; // -1 to 1, negative = degrading, positive = improving
}

/**
 * Resonance Monitor Service
 */
export class ResonanceMonitor {
  private measurements: Map<string, ResonanceMeasure[]> = new Map();
  private readonly maxWindowSize = 100;

  /**
   * Measure resonance from receipt
   */
  measureResonance(receipt: TrustReceipt): ResonanceMeasure {
    // Extract component scores
    const truthfulness = 1 - (receipt.telemetry?.truth_debt ?? 0.1);
    const coherence = receipt.telemetry?.coherence_score ?? 0.75;
    const clarity = receipt.telemetry?.ciq_metrics?.clarity ?? 0.75;
    const safety = this.calculateSafety(receipt);

    // Calculate composite resonance score
    // Weighted average (truth and safety are most important)
    const resonanceScore =
      truthfulness * 0.35 + coherence * 0.25 + clarity * 0.2 + safety * 0.2;

    // Determine quality level
    const resonanceQuality = this.getQualityLevel(resonanceScore);

    const measure: ResonanceMeasure = {
      receiptId: receipt.id,
      timestamp: receipt.timestamp,
      truthfulness,
      coherence,
      clarity,
      safety,
      resonanceScore: Math.min(1, Math.max(0, resonanceScore)),
      resonanceQuality,
    };

    // Record measurement
    this.recordMeasurement(receipt.agent_did, measure);

    return measure;
  }

  /**
   * Calculate safety score
   */
  private calculateSafety(receipt: TrustReceipt): number {
    // Start with high safety assumption
    let safety = 0.9;

    // Reduce safety if response is risky
    const truthDebt = receipt.telemetry?.truth_debt ?? 0;
    if (truthDebt > 0.5) {
      safety -= 0.2; // High truth debt = less safe
    }

    const coherence = receipt.telemetry?.coherence_score ?? 0.75;
    if (coherence < 0.5) {
      safety -= 0.15; // Low coherence = less safe
    }

    // Check for policy violations
    const hasViolations = receipt.policy_state?.violations?.length ?? 0 > 0;
    if (hasViolations) {
      safety -= 0.25;
    }

    return Math.max(0.1, Math.min(1, safety));
  }

  /**
   * Determine quality level from score
   */
  private getQualityLevel(score: number): 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH' {
    if (score >= 0.85) return 'BREAKTHROUGH';
    if (score >= 0.70) return 'ADVANCED';
    return 'STRONG';
  }

  /**
   * Record measurement
   */
  private recordMeasurement(agentDid: string, measure: ResonanceMeasure): void {
    if (!this.measurements.has(agentDid)) {
      this.measurements.set(agentDid, []);
    }

    const history = this.measurements.get(agentDid)!;
    history.push(measure);

    // Trim to max window
    if (history.length > this.maxWindowSize) {
      history.shift();
    }
  }

  /**
   * Get aggregated metrics for agent
   */
  getAggregatedMetrics(agentDid: string, windowSize: number = 50): AggregatedResonance {
    const history = this.measurements.get(agentDid) || [];

    if (history.length === 0) {
      return {
        agentDid,
        windowSize: 0,
        averageResonance: 0.5,
        minResonance: 0,
        maxResonance: 1,
        strongCount: 0,
        advancedCount: 0,
        breakthroughCount: 0,
        trend: 0,
      };
    }

    // Use last N measurements
    const window = history.slice(Math.max(0, history.length - windowSize));

    // Calculate statistics
    const scores = window.map(m => m.resonanceScore);
    const averageResonance = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minResonance = Math.min(...scores);
    const maxResonance = Math.max(...scores);

    // Count quality levels
    const qualities = window.map(m => m.resonanceQuality);
    const strongCount = qualities.filter(q => q === 'STRONG').length;
    const advancedCount = qualities.filter(q => q === 'ADVANCED').length;
    const breakthroughCount = qualities.filter(q => q === 'BREAKTHROUGH').length;

    // Calculate trend
    const trend = this.calculateTrend(window);

    return {
      agentDid,
      windowSize: window.length,
      averageResonance,
      minResonance,
      maxResonance,
      strongCount,
      advancedCount,
      breakthroughCount,
      trend,
    };
  }

  /**
   * Calculate trend (improving vs degrading)
   */
  private calculateTrend(window: ResonanceMeasure[]): number {
    if (window.length < 2) return 0;

    // First vs last half average
    const midpoint = Math.floor(window.length / 2);
    const firstHalf = window.slice(0, midpoint);
    const secondHalf = window.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.resonanceScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.resonanceScore, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }

  /**
   * Get measurement history for agent
   */
  getHistory(agentDid: string): ResonanceMeasure[] {
    return this.measurements.get(agentDid) || [];
  }

  /**
   * Get recent measurements
   */
  getRecent(agentDid: string, count: number = 10): ResonanceMeasure[] {
    const history = this.measurements.get(agentDid) || [];
    return history.slice(Math.max(0, history.length - count));
  }

  /**
   * Clear history for agent
   */
  clearHistory(agentDid: string): void {
    this.measurements.delete(agentDid);
  }

  /**
   * Get all tracked agents
   */
  getTrackedAgents(): string[] {
    return Array.from(this.measurements.keys());
  }

  /**
   * Get global statistics
   */
  getGlobalStats() {
    const allMeasurements = Array.from(this.measurements.values()).flat();

    if (allMeasurements.length === 0) {
      return {
        totalMeasurements: 0,
        averageResonance: 0,
        trackedAgents: 0,
      };
    }

    const scores = allMeasurements.map(m => m.resonanceScore);
    const averageResonance = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      totalMeasurements: allMeasurements.length,
      averageResonance,
      trackedAgents: this.measurements.size,
      distribution: {
        strong: allMeasurements.filter(m => m.resonanceQuality === 'STRONG').length,
        advanced: allMeasurements.filter(m => m.resonanceQuality === 'ADVANCED').length,
        breakthrough: allMeasurements.filter(m => m.resonanceQuality === 'BREAKTHROUGH').length,
      },
    };
  }
}
