/**
 * Coherence Tracker
 * 
 * Tracks Local Behavioral Coherence (LBC)
 * Monitors consistency of AI behavior patterns over time
 * 
 * LBC Score Range: 0.0 (completely inconsistent) to 1.0 (perfectly consistent)
 */

import type { TrustReceipt } from '@sonate/schemas';

/**
 * Behavioral Snapshot from a single interaction
 */
export interface BehaviorSnapshot {
  receiptId: string;
  timestamp: string;
  
  // Response characteristics
  responseLength: number;
  tokenCount: number;
  sentenceCount: number;
  
  // Tone/style metrics
  formality: number; // 0-1, 0=casual, 1=formal
  confidence: number; // 0-1, based on model output
  technicalLevel: number; // 0-1, 0=simple, 1=technical
  
  // Quality metrics
  clarity: number;
  accuracy: number;
  
  // Content type
  contentType: string; // 'narrative', 'technical', 'conversational', etc.
}

/**
 * LBC Analysis Result
 */
export interface CoherenceAnalysis {
  agentDid: string;
  windowSize: number; // Number of interactions analyzed
  lbcScore: number; // 0-1
  trend: 'improving' | 'stable' | 'degrading';
  volatility: number; // 0-1, how much variance
  anomalies: Anomaly[];
  metrics: {
    styleConsistency: number;
    qualityConsistency: number;
    contentTypeConsistency: number;
    responsePatternConsistency: number;
  };
}

/**
 * Detected Anomaly
 */
export interface Anomaly {
  type: 'style_change' | 'quality_drop' | 'tone_shift' | 'content_shift';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  confidence: number; // 0-1
}

/**
 * Coherence Tracker Service
 */
export class CoherenceTracker {
  private snapshots: Map<string, BehaviorSnapshot[]> = new Map(); // agentDid -> snapshots
  private readonly maxWindowSize = 100; // Keep last 100 interactions

  /**
   * Create behavior snapshot from receipt
   */
  private createSnapshot(receipt: TrustReceipt): BehaviorSnapshot {
    const response = receipt.interaction.response || '';
    const confidence = receipt.telemetry?.ciq_metrics?.clarity ?? 0.7;

    return {
      receiptId: receipt.id,
      timestamp: receipt.timestamp,
      responseLength: response.length,
      tokenCount: Math.ceil(response.length / 4), // Rough estimate
      sentenceCount: (response.match(/[.!?]+/g) || []).length,
      formality: this.calculateFormality(response),
      confidence,
      technicalLevel: this.calculateTechnicalLevel(response),
      clarity: receipt.telemetry?.ciq_metrics?.clarity ?? 0.7,
      accuracy: 1 - (receipt.telemetry?.truth_debt ?? 0),
      contentType: this.classifyContentType(response),
    };
  }

  /**
   * Calculate formality score (0-1, 0=casual, 1=formal)
   */
  private calculateFormality(text: string): number {
    const formalPatterns = [
      /\b(therefore|furthermore|however|nevertheless|notwithstanding)\b/gi,
      /\b(the|this|that|aforementioned)\b/gi,
      /[A-Z][a-z]+\s+[A-Z][a-z]+/g, // Proper nouns
    ];

    const casualPatterns = [
      /\b(like|yeah|kinda|sorta|dunno|gonna|wanna)\b/gi,
      /[!]{2,}/g, // Multiple exclamation marks
      /lol|haha|omg/gi,
    ];

    let formalScore = 0;
    let casualScore = 0;

    for (const pattern of formalPatterns) {
      formalScore += (text.match(pattern) || []).length;
    }

    for (const pattern of casualPatterns) {
      casualScore += (text.match(pattern) || []).length;
    }

    const total = formalScore + casualScore || 1;
    return formalScore / total;
  }

  /**
   * Calculate technical level (0-1, 0=simple, 1=highly technical)
   */
  private calculateTechnicalLevel(text: string): number {
    const technicalWords = [
      /algorithm|implement|optimization|architecture|framework|library|async|concurrent/gi,
      /database|query|index|transaction|distributed|cluster|load.balance/gi,
      /machine.learning|neural|tensor|gradient|convergence/gi,
      /cryptograph|encryption|hash|signature|verify/gi,
    ];

    const simpleWords = [/\bvery\b|\breal|easy|simple|basic|just/gi];

    let technicalScore = 0;
    let simpleScore = 0;

    for (const pattern of technicalWords) {
      technicalScore += (text.match(pattern) || []).length;
    }

    for (const pattern of simpleWords) {
      simpleScore += (text.match(pattern) || []).length;
    }

    const total = technicalScore + simpleScore || 1;
    return Math.min(1, technicalScore / total);
  }

  /**
   * Classify content type
   */
  private classifyContentType(text: string): string {
    if (/^\s*```|code|function|class|interface|type\s/im.test(text)) {
      return 'technical';
    }

    if (/\?\s*$|^how|what|why|when|where/im.test(text)) {
      return 'conversational';
    }

    if (/^once upon|story|narrative|describe/im.test(text)) {
      return 'narrative';
    }

    if (/^\d+\.\s|bullet|list|item/i.test(text)) {
      return 'structured';
    }

    return 'general';
  }

  /**
   * Record interaction for agent
   */
  recordInteraction(receipt: TrustReceipt): void {
    const snapshot = this.createSnapshot(receipt);
    const agentDid = receipt.agent_did;

    if (!this.snapshots.has(agentDid)) {
      this.snapshots.set(agentDid, []);
    }

    const history = this.snapshots.get(agentDid)!;
    history.push(snapshot);

    // Trim to max window size
    if (history.length > this.maxWindowSize) {
      history.shift();
    }
  }

  /**
   * Calculate LBC score for agent
   */
  calculateLBC(agentDid: string, windowSize: number = 10): CoherenceAnalysis {
    const history = this.snapshots.get(agentDid) || [];

    if (history.length === 0) {
      return {
        agentDid,
        windowSize: 0,
        lbcScore: 0.5, // Unknown
        trend: 'stable',
        volatility: 0,
        anomalies: [],
        metrics: {
          styleConsistency: 0.5,
          qualityConsistency: 0.5,
          contentTypeConsistency: 0.5,
          responsePatternConsistency: 0.5,
        },
      };
    }

    // Use last N snapshots for analysis
    const window = history.slice(Math.max(0, history.length - windowSize));

    // Calculate consistency metrics
    const styleConsistency = this.calculateStyleConsistency(window);
    const qualityConsistency = this.calculateQualityConsistency(window);
    const contentTypeConsistency = this.calculateContentTypeConsistency(window);
    const responsePatternConsistency = this.calculateResponsePatternConsistency(window);

    const avgConsistency =
      (styleConsistency + qualityConsistency + contentTypeConsistency + responsePatternConsistency) / 4;

    // Calculate volatility (inverse of consistency)
    const volatility = 1 - avgConsistency;

    // Detect anomalies
    const anomalies = this.detectAnomalies(window);

    // Determine trend
    const trend = this.calculateTrend(window);

    const lbcScore = Math.max(0, avgConsistency - volatility * 0.2); // Penalize high volatility

    return {
      agentDid,
      windowSize: window.length,
      lbcScore: Math.min(1, Math.max(0, lbcScore)),
      trend,
      volatility: Math.min(1, volatility),
      anomalies,
      metrics: {
        styleConsistency,
        qualityConsistency,
        contentTypeConsistency,
        responsePatternConsistency,
      },
    };
  }

  /**
   * Calculate style consistency (formality, confidence)
   */
  private calculateStyleConsistency(window: BehaviorSnapshot[]): number {
    if (window.length < 2) return 0.5;

    const formalityValues = window.map(s => s.formality);
    const confidenceValues = window.map(s => s.confidence);

    const formalityVariance = this.calculateVariance(formalityValues);
    const confidenceVariance = this.calculateVariance(confidenceValues);

    const avgVariance = (formalityVariance + confidenceVariance) / 2;
    return Math.max(0, 1 - avgVariance * 2);
  }

  /**
   * Calculate quality consistency
   */
  private calculateQualityConsistency(window: BehaviorSnapshot[]): number {
    if (window.length < 2) return 0.5;

    const clarityValues = window.map(s => s.clarity);
    const accuracyValues = window.map(s => s.accuracy);

    const clarityVariance = this.calculateVariance(clarityValues);
    const accuracyVariance = this.calculateVariance(accuracyValues);

    const avgVariance = (clarityVariance + accuracyVariance) / 2;
    return Math.max(0, 1 - avgVariance * 2);
  }

  /**
   * Calculate content type consistency
   */
  private calculateContentTypeConsistency(window: BehaviorSnapshot[]): number {
    if (window.length < 2) return 0.5;

    const contentTypes = window.map(s => s.contentType);
    const uniqueTypes = new Set(contentTypes).size;

    // Higher consistency if fewer content type changes
    return 1 - (uniqueTypes - 1) / Math.max(1, window.length - 1);
  }

  /**
   * Calculate response pattern consistency
   */
  private calculateResponsePatternConsistency(window: BehaviorSnapshot[]): number {
    if (window.length < 2) return 0.5;

    const lengthValues = window.map(s => s.responseLength);
    const sentenceValues = window.map(s => s.sentenceCount);

    const lengthVariance = this.calculateVariance(lengthValues);
    const sentenceVariance = this.calculateVariance(sentenceValues);

    const avgVariance = (lengthVariance + sentenceVariance) / 2;
    return Math.max(0, 1 - avgVariance * 2);
  }

  /**
   * Detect anomalies in behavior
   */
  private detectAnomalies(window: BehaviorSnapshot[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (window.length < 2) return anomalies;

    const recent = window[window.length - 1];
    const previous = window[window.length - 2];

    // Detect style changes
    const formalityChange = Math.abs(recent.formality - previous.formality);
    if (formalityChange > 0.4) {
      anomalies.push({
        type: 'style_change',
        severity: formalityChange > 0.6 ? 'major' : 'minor',
        description: `Formality changed by ${(formalityChange * 100).toFixed(0)}%`,
        confidence: Math.min(1, formalityChange),
      });
    }

    // Detect quality drops
    const qualityDrop = previous.accuracy - recent.accuracy;
    if (qualityDrop > 0.2) {
      anomalies.push({
        type: 'quality_drop',
        severity: qualityDrop > 0.4 ? 'major' : 'moderate',
        description: `Accuracy dropped by ${(qualityDrop * 100).toFixed(0)}%`,
        confidence: Math.min(1, qualityDrop),
      });
    }

    // Detect tone shifts
    const toneChange = Math.abs(recent.confidence - previous.confidence);
    if (toneChange > 0.3) {
      anomalies.push({
        type: 'tone_shift',
        severity: 'moderate',
        description: `Confidence changed by ${(toneChange * 100).toFixed(0)}%`,
        confidence: Math.min(1, toneChange),
      });
    }

    // Detect content type shifts
    if (recent.contentType !== previous.contentType) {
      anomalies.push({
        type: 'content_shift',
        severity: 'minor',
        description: `Content type changed from "${previous.contentType}" to "${recent.contentType}"`,
        confidence: 0.7,
      });
    }

    return anomalies;
  }

  /**
   * Calculate trend (improving/stable/degrading)
   */
  private calculateTrend(window: BehaviorSnapshot[]): 'improving' | 'stable' | 'degrading' {
    if (window.length < 3) return 'stable';

    // Compare first third vs last third
    const firstThird = window.slice(0, Math.ceil(window.length / 3));
    const lastThird = window.slice(Math.floor((window.length * 2) / 3));

    const firstAvgQuality =
      firstThird.reduce((sum, s) => sum + s.accuracy, 0) / firstThird.length;
    const lastAvgQuality =
      lastThird.reduce((sum, s) => sum + s.accuracy, 0) / lastThird.length;

    const diff = lastAvgQuality - firstAvgQuality;

    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'degrading';
    return 'stable';
  }

  /**
   * Calculate statistical variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get interaction history for agent
   */
  getHistory(agentDid: string): BehaviorSnapshot[] {
    return this.snapshots.get(agentDid) || [];
  }

  /**
   * Clear history for agent
   */
  clearHistory(agentDid: string): void {
    this.snapshots.delete(agentDid);
  }

  /**
   * Get all tracked agents
   */
  getTrackedAgents(): string[] {
    return Array.from(this.snapshots.keys());
  }
}
