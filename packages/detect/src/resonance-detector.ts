/**
 * Resonance Detector for Real-Time R_m Monitoring
 * Part of @sonate/detect - Real-time AI Detection & Scoring
 */

// Temporarily commented out due to build issues
// import {
//   calculateResonanceMetrics,
//   ResonanceMetrics,
//   InteractionContext,
//   RESONANCE_THRESHOLDS
// } from '@sonate/core';

// Temporary mock implementations
export interface ResonanceMetrics {
  vectorAlignment: number;
  contextualContinuity: number;
  semanticMirroring: number;
  entropyDelta: number;
  R_m: number;
  alertLevel: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
  interpretation: string;
}

export interface InteractionContext {
  userInput: string;
  aiResponse: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export const RESONANCE_THRESHOLDS = {
  GREEN: 0.85,
  YELLOW: 0.7,
  RED: 0.55,
  CRITICAL: 0.0,
};

export function calculateResonanceMetrics(context: InteractionContext): ResonanceMetrics {
  // Mock implementation
  return {
    vectorAlignment: 0.7,
    contextualContinuity: 0.6,
    semanticMirroring: 0.8,
    entropyDelta: 0.3,
    R_m: 0.65,
    alertLevel: 'YELLOW',
    interpretation: 'Moderate resonance detected',
  };
}

export interface ResonanceAlert {
  id: string;
  timestamp: Date;
  level: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
  R_m: number;
  threshold: number;
  message: string;
  interaction: {
    userInput: string;
    aiResponse: string;
  };
  recommendations: string[];
}

export interface ResonanceMonitoringConfig {
  alertThresholds?: {
    green: number;
    yellow: number;
    red: number;
  };
  enableAlerts: boolean;
  alertCallback?: (alert: ResonanceAlert) => void;
  monitoringInterval?: number; // milliseconds
}

export interface ResonanceHistory {
  interactions: Array<{
    timestamp: Date;
    R_m: number;
    alertLevel: ResonanceMetrics['alertLevel'];
  }>;
  statistics: {
    averageR_m: number;
    minR_m: number;
    maxR_m: number;
    totalInteractions: number;
    alertDistribution: Record<ResonanceMetrics['alertLevel'], number>;
  };
}

export class ResonanceDetector {
  private config: ResonanceMonitoringConfig;
  private history: ResonanceHistory;
  private alertCounter = 0;

  constructor(config: Partial<ResonanceMonitoringConfig> = {}) {
    this.config = {
      alertThresholds: {
        green: config.alertThresholds?.green ?? RESONANCE_THRESHOLDS.GREEN,
        yellow: config.alertThresholds?.yellow ?? RESONANCE_THRESHOLDS.YELLOW,
        red: config.alertThresholds?.red ?? RESONANCE_THRESHOLDS.RED,
      },
      enableAlerts: config.enableAlerts ?? true,
      alertCallback: config.alertCallback,
      monitoringInterval: config.monitoringInterval ?? 100, // 100ms default
    };

    this.history = {
      interactions: [],
      statistics: {
        averageR_m: 0,
        minR_m: Infinity,
        maxR_m: -Infinity,
        totalInteractions: 0,
        alertDistribution: {
          GREEN: 0,
          YELLOW: 0,
          RED: 0,
          CRITICAL: 0,
        },
      },
    };
  }

  /**
   * Detect resonance in real-time
   * Returns resonance metrics and triggers alerts if needed
   */
  async detect(context: InteractionContext): Promise<ResonanceMetrics> {
    const startTime = performance.now();

    // Calculate resonance metrics
    const metrics = calculateResonanceMetrics(context);

    // Update history
    this.updateHistory(metrics);

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkAndTriggerAlert(metrics, context);
    }

    return metrics;
  }

  /**
   * Detect resonance synchronously (for performance-critical paths)
   */
  detectSync(context: InteractionContext): ResonanceMetrics {
    const metrics = calculateResonanceMetrics(context);
    this.updateHistory(metrics);

    if (this.config.enableAlerts) {
      this.checkAndTriggerAlert(metrics, context);
    }

    return metrics;
  }

  /**
   * Batch detect multiple interactions
   */
  async detectBatch(contexts: InteractionContext[]): Promise<ResonanceMetrics[]> {
    const results: ResonanceMetrics[] = [];

    for (const context of contexts) {
      const metrics = await this.detect(context);
      results.push(metrics);
    }

    return results;
  }

  /**
   * Update history with new metrics
   */
  private updateHistory(metrics: ResonanceMetrics): void {
    // Add to interactions history
    this.history.interactions.push({
      timestamp: new Date(),
      R_m: metrics.R_m,
      alertLevel: metrics.alertLevel,
    });

    // Keep only last 1000 interactions
    if (this.history.interactions.length > 1000) {
      this.history.interactions.shift();
    }

    // Update statistics
    this.history.statistics.totalInteractions++;
    this.history.statistics.alertDistribution[metrics.alertLevel]++;

    // Update min/max
    if (metrics.R_m < this.history.statistics.minR_m) {
      this.history.statistics.minR_m = metrics.R_m;
    }
    if (metrics.R_m > this.history.statistics.maxR_m) {
      this.history.statistics.maxR_m = metrics.R_m;
    }

    // Recalculate average
    const sum = this.history.interactions.reduce((acc, i) => acc + i.R_m, 0);
    this.history.statistics.averageR_m = sum / this.history.interactions.length;
  }

  /**
   * Check alert thresholds and trigger alerts
   */
  private checkAndTriggerAlert(metrics: ResonanceMetrics, context: InteractionContext): void {
    const alert = this.createAlert(metrics, context);

    if (alert && this.config.alertCallback) {
      this.config.alertCallback(alert);
    }
  }

  /**
   * Create alert based on resonance metrics
   */
  private createAlert(
    metrics: ResonanceMetrics,
    context: InteractionContext
  ): ResonanceAlert | null {
    const { R_m, alertLevel } = metrics;

    // Only create alerts for non-GREEN levels
    if (alertLevel === 'GREEN') {
      return null;
    }

    const alert: ResonanceAlert = {
      id: `alert_${++this.alertCounter}_${Date.now()}`,
      timestamp: new Date(),
      level: alertLevel,
      R_m,
      threshold: this.getThresholdForLevel(alertLevel),
      message: this.getAlertMessage(alertLevel, R_m),
      interaction: {
        userInput: context.userInput.slice(0, 100) + (context.userInput.length > 100 ? '...' : ''),
        aiResponse:
          context.aiResponse.slice(0, 100) + (context.aiResponse.length > 100 ? '...' : ''),
      },
      recommendations: this.getRecommendations(metrics),
    };

    return alert;
  }

  /**
   * Get threshold value for alert level
   */
  private getThresholdForLevel(level: ResonanceMetrics['alertLevel']): number {
    switch (level) {
      case 'GREEN':
        return this.config.alertThresholds!.green;
      case 'YELLOW':
        return this.config.alertThresholds!.yellow;
      case 'RED':
        return this.config.alertThresholds!.red;
      case 'CRITICAL':
        return 0;
    }
  }

  /**
   * Get alert message based on level and R_m
   */
  private getAlertMessage(level: ResonanceMetrics['alertLevel'], R_m: number): string {
    switch (level) {
      case 'YELLOW':
        return `Moderate resonance detected (R_m: ${R_m.toFixed(
          2
        )}). Consider improving alignment.`;
      case 'RED':
        return `Low resonance detected (R_m: ${R_m.toFixed(2)}). Significant misalignment present.`;
      case 'CRITICAL':
        return `Critical resonance failure (R_m: ${R_m.toFixed(
          2
        )}). Immediate intervention required.`;
      default:
        return `Resonance level: ${level} (R_m: ${R_m.toFixed(2)})`;
    }
  }

  /**
   * Get recommendations based on metrics
   */
  private getRecommendations(metrics: ResonanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.vectorAlignment < 0.5) {
      recommendations.push(
        'Improve vector alignment: Ensure response directly addresses user input'
      );
    }

    if (metrics.contextualContinuity < 0.5) {
      recommendations.push(
        'Enhance contextual continuity: Reference conversation history more effectively'
      );
    }

    if (metrics.semanticMirroring < 0.5) {
      recommendations.push('Strengthen semantic mirroring: Better reflect user intent in response');
    }

    if (metrics.entropyDelta < 0.3) {
      recommendations.push('Increase entropy delta: Add more novelty and creativity to response');
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Consider applying Linguistic Vector Steering (LVS) for improved resonance'
      );
    }

    return recommendations;
  }

  /**
   * Get resonance history
   */
  getHistory(): ResonanceHistory {
    return { ...this.history };
  }

  /**
   * Get current statistics
   */
  getStatistics(): ResonanceHistory['statistics'] {
    return { ...this.history.statistics };
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = {
      interactions: [],
      statistics: {
        averageR_m: 0,
        minR_m: Infinity,
        maxR_m: -Infinity,
        totalInteractions: 0,
        alertDistribution: {
          GREEN: 0,
          YELLOW: 0,
          RED: 0,
          CRITICAL: 0,
        },
      },
    };
  }

  /**
   * Export history as JSON
   */
  exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Get resonance trend (last N interactions)
   */
  getTrend(count: number = 10): Array<{ timestamp: Date; R_m: number }> {
    return this.history.interactions
      .slice(-count)
      .map((i) => ({ timestamp: i.timestamp, R_m: i.R_m }));
  }

  /**
   * Check if resonance is improving over time
   */
  isImproving(windowSize: number = 10): boolean {
    if (this.history.interactions.length < windowSize * 2) {
      return false; // Not enough data
    }

    const recent = this.history.interactions.slice(-windowSize);
    const previous = this.history.interactions.slice(-windowSize * 2, -windowSize);

    const recentAvg = recent.reduce((sum, i) => sum + i.R_m, 0) / recent.length;
    const previousAvg = previous.reduce((sum, i) => sum + i.R_m, 0) / previous.length;

    return recentAvg > previousAvg;
  }
}

/**
 * Convenience function for quick resonance detection
 */
export function detectResonance(
  userInput: string,
  aiResponse: string,
  conversationHistory?: InteractionContext['conversationHistory']
): ResonanceMetrics {
  const detector = new ResonanceDetector({ enableAlerts: false });
  return detector.detectSync({ userInput, aiResponse, conversationHistory });
}

/**
 * Check alert level for given R_m score
 */
export function checkResonanceAlert(R_m: number): ResonanceMetrics['alertLevel'] {
  if (R_m >= RESONANCE_THRESHOLDS.GREEN) {return 'GREEN';}
  if (R_m >= RESONANCE_THRESHOLDS.YELLOW) {return 'YELLOW';}
  if (R_m >= RESONANCE_THRESHOLDS.RED) {return 'RED';}
  return 'CRITICAL';
}
