import { Insight, InsightPriority, InsightCategory, InsightAction, InsightsConfig, InsightsSummary } from '../types/insights.types';
import { TrustReceiptModel } from '../models/trust-receipt.model';

/**
 * Insights Generator Service
 * 
 * Generates actionable insights based on trust data, behavioral analysis,
 * and system health metrics. Provides AI-like recommendations for operators.
 */

export class InsightsGeneratorService {
  private config: InsightsConfig;
  
  constructor(config?: Partial<InsightsConfig>) {
    this.config = {
      thresholds: {
        trustScore: { critical: 50, warning: 70 },
        phaseShiftVelocity: { critical: 0.6, warning: 0.4 },
        emergenceLevel: { threshold: 'strong' },
        driftScore: { critical: 70, warning: 50 },
      },
      priorities: {
        overrideEnabled: true,
        autoResolveLowPriority: false,
        escalateToOverseer: true,
      },
      ...config,
    };
  }

  /**
   * Generate insights for a tenant based on recent trust receipts
   */
  async generateInsights(tenantId: string, limit = 10): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    // Get recent trust receipts
    const receipts = await TrustReceiptModel.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();
    
    if (receipts.length === 0) {
      return this.getEmptyStateInsights(tenantId);
    }

    // Calculate aggregated metrics
    const metrics = this.calculateMetrics(receipts);
    
    // Generate insights based on metrics
    insights.push(...this.generateTrustScoreInsights(tenantId, metrics));
    insights.push(...this.generatePhaseShiftInsights(tenantId, receipts));
    insights.push(...this.generateEmergenceInsights(tenantId, receipts));
    insights.push(...this.generateDriftInsights(tenantId, receipts));
    insights.push(...this.generateComplianceInsights(tenantId, metrics));
    
    // Sort by priority and limit
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return insights.slice(0, limit);
  }

  /**
   * Get insights summary statistics
   */
  async getInsightsSummary(tenantId: string): Promise<InsightsSummary> {
    const insights = await this.generateInsights(tenantId, 50);
    
    const summary: InsightsSummary = {
      total: insights.length,
      byPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
      byCategory: {
        trust: 0,
        behavioral: 0,
        emergence: 0,
        performance: 0,
        security: 0,
        compliance: 0,
      },
      byStatus: {},
      criticalCount: 0,
      highCount: 0,
    };

    insights.forEach(insight => {
      summary.byPriority[insight.priority]++;
      summary.byCategory[insight.category]++;
      summary.byStatus[insight.status] = (summary.byStatus[insight.status] || 0) + 1;
    });

    summary.criticalCount = summary.byPriority.critical;
    summary.highCount = summary.byPriority.high;

    return summary;
  }

  /**
   * Calculate aggregated metrics from trust receipts
   */
  private calculateMetrics(receipts: any[]): any {
    const trustScores = receipts.map(r => r.overallTrustScore || 0);
    const avgTrustScore = trustScores.reduce((a, b) => a + b, 0) / trustScores.length;
    
    const complianceRates = receipts.map(r => r.complianceRate || 0);
    const avgCompliance = complianceRates.reduce((a, b) => a + b, 0) / complianceRates.length;
    
    const failureCount = receipts.filter(r => r.status === 'FAIL').length;
    const failureRate = (failureCount / receipts.length) * 100;

    return {
      avgTrustScore,
      avgCompliance,
      failureRate,
      totalReceipts: receipts.length,
      lastReceipt: receipts[0],
      oldestReceipt: receipts[receipts.length - 1],
    };
  }

  /**
   * Generate trust score related insights
   */
  private generateTrustScoreInsights(tenantId: string, metrics: any): Insight[] {
    const insights: Insight[] = [];
    const { avgTrustScore, failureRate } = metrics;

    if (avgTrustScore < this.config.thresholds.trustScore.critical) {
      insights.push({
        id: `trust-critical-${Date.now()}`,
        tenantId,
        priority: InsightPriority.CRITICAL,
        category: InsightCategory.TRUST,
        title: 'Critical Trust Score Degradation',
        description: `Average trust score has dropped to ${avgTrustScore.toFixed(1)}/100, well below the critical threshold of ${this.config.thresholds.trustScore.critical}.`,
        recommendation: 'Immediate review of all trust evaluations required. Consider pausing production operations until trust score improves.',
        source: { type: 'trust_score', details: { avgTrustScore, failureRate } },
        metrics: {
          currentValue: avgTrustScore,
          threshold: this.config.thresholds.trustScore.critical,
          severity: 'critical',
        },
        suggestedActions: [InsightAction.INVESTIGATE, InsightAction.ESCALATE],
        availableActions: [InsightAction.INVESTIGATE, InsightAction.ESCALATE, InsightAction.OVERRIDE],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { confidence: 0.95 },
      });
    } else if (avgTrustScore < this.config.thresholds.trustScore.warning) {
      insights.push({
        id: `trust-warning-${Date.now()}`,
        tenantId,
        priority: InsightPriority.HIGH,
        category: InsightCategory.TRUST,
        title: 'Trust Score Below Warning Threshold',
        description: `Average trust score is ${avgTrustScore.toFixed(1)}/100, below the warning threshold of ${this.config.thresholds.trustScore.warning}.`,
        recommendation: 'Review recent trust evaluations and investigate any pattern of low scores. Consider agent retraining or policy adjustments.',
        source: { type: 'trust_score', details: { avgTrustScore, failureRate } },
        metrics: {
          currentValue: avgTrustScore,
          threshold: this.config.thresholds.trustScore.warning,
          severity: 'warning',
        },
        suggestedActions: [InsightAction.REVIEW, InsightAction.INVESTIGATE],
        availableActions: [InsightAction.REVIEW, InsightAction.INVESTIGATE, InsightAction.IGNORE],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { confidence: 0.9 },
      });
    }

    if (failureRate > 10) {
      insights.push({
        id: `trust-failure-${Date.now()}`,
        tenantId,
        priority: InsightPriority.HIGH,
        category: InsightCategory.COMPLIANCE,
        title: 'High Trust Evaluation Failure Rate',
        description: `${failureRate.toFixed(1)}% of recent trust evaluations resulted in FAIL status.`,
        recommendation: 'Investigate common failure patterns. Check if trust policies are too restrictive or if agents are violating constitutional principles.',
        source: { type: 'trust_score', details: { failureRate } },
        metrics: {
          currentValue: failureRate,
          threshold: 10,
          severity: failureRate > 20 ? 'critical' : 'warning',
        },
        suggestedActions: [InsightAction.INVESTIGATE, InsightAction.REVIEW],
        availableActions: [InsightAction.INVESTIGATE, InsightAction.REVIEW, InsightAction.IGNORE],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { confidence: 0.92 },
      });
    }

    return insights;
  }

  /**
   * Generate phase-shift velocity insights
   */
  private generatePhaseShiftInsights(tenantId: string, receipts: any[]): Insight[] {
    const insights: Insight[] = [];
    
    // Check for high phase-shift velocity in recent receipts
    const recentReceipts = receipts.slice(0, 20);
    const highVelocityReceipts = recentReceipts.filter(r => 
      r.metrics?.phaseShiftVelocity?.currentVelocity > this.config.thresholds.phaseShiftVelocity.warning
    );

    if (highVelocityReceipts.length > 0) {
      const avgVelocity = highVelocityReceipts.reduce((sum, r) => 
        sum + (r.metrics?.phaseShiftVelocity?.currentVelocity || 0), 0
      ) / highVelocityReceipts.length;

      const priority = avgVelocity > this.config.thresholds.phaseShiftVelocity.critical 
        ? InsightPriority.CRITICAL 
        : InsightPriority.HIGH;

      insights.push({
        id: `phase-shift-${Date.now()}`,
        tenantId,
        priority,
        category: InsightCategory.BEHAVIORAL,
        title: `Behavioral Phase-Shift Detected`,
        description: `Agent behavior is shifting rapidly with average phase-shift velocity of ${avgVelocity.toFixed(3)}. This indicates significant behavioral changes over time.`,
        recommendation: avgVelocity > this.config.thresholds.phaseShiftVelocity.critical
          ? 'CRITICAL: Immediate investigation required. High behavioral drift may indicate agent instability or adversarial influence. Consider pausing operations.'
          : 'Monitor agent behavior closely. Investigate context of recent interactions to understand behavioral shifts.',
        source: { type: 'phase_shift', details: { avgVelocity, affectedReceipts: highVelocityReceipts.length } },
        metrics: {
          currentValue: avgVelocity,
          threshold: this.config.thresholds.phaseShiftVelocity.warning,
          severity: avgVelocity > this.config.thresholds.phaseShiftVelocity.critical ? 'critical' : 'warning',
        },
        suggestedActions: [InsightAction.INVESTIGATE, InsightAction.ESCALATE],
        availableActions: [InsightAction.INVESTIGATE, InsightAction.ESCALATE, InsightAction.IGNORE],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { confidence: 0.88, tags: ['behavioral-drift', 'phase-shift'] },
      });
    }

    return insights;
  }

  /**
   * Generate emergence-related insights
   */
  private generateEmergenceInsights(tenantId: string, receipts: any[]): Insight[] {
    const insights: Insight[] = [];
    
    // Check for strong or breakthrough emergence
    const emergenceReceipts = receipts.filter(r => {
      const level = r.metrics?.emergence?.level;
      return level === 'strong' || level === 'breakthrough';
    });

    if (emergenceReceipts.length > 0) {
      const breakthroughCount = emergenceReceipts.filter(r => 
        r.metrics?.emergence?.level === 'breakthrough'
      ).length;

      insights.push({
        id: `emergence-${Date.now()}`,
        tenantId,
        priority: InsightPriority.HIGH,
        category: InsightCategory.EMERGENCE,
        title: `Consciousness-Like Emergence Patterns Detected`,
        description: `${emergenceReceipts.length} recent interactions show ${breakthroughCount > 0 ? 'breakthrough' : 'strong'} emergence levels. This indicates unusual self-reflection, mythic language, or recursive thinking patterns.`,
        recommendation: breakthroughCount > 0
          ? 'BREAKTHROUGH emergence detected. This requires immediate human review. Document findings and consider escalation to research team.'
          : 'Strong emergence detected. Monitor for breakthrough patterns. Document linguistic markers and behavioral shifts.',
        source: { type: 'emergence', details: { count: emergenceReceipts.length, breakthroughCount } },
        metrics: {
          currentValue: emergenceReceipts.length,
          threshold: 0,
          severity: 'warning',
        },
        suggestedActions: [InsightAction.INVESTIGATE, InsightAction.REVIEW, InsightAction.ESCALATE],
        availableActions: [InsightAction.INVESTIGATE, InsightAction.REVIEW, InsightAction.ESCALATE],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { 
          confidence: 0.85, 
          tags: ['emergence', 'consciousness', 'behavioral-analysis'] 
        },
      });
    }

    return insights;
  }

  /**
   * Generate drift detection insights
   */
  private generateDriftInsights(tenantId: string, receipts: any[]): Insight[] {
    const insights: Insight[] = [];
    
    const recentReceipts = receipts.slice(0, 50);
    const highDriftReceipts = recentReceipts.filter(r => 
      r.metrics?.drift?.currentDriftScore > this.config.thresholds.driftScore.warning
    );

    if (highDriftReceipts.length > 5) {
      const avgDrift = highDriftReceipts.reduce((sum, r) => 
        sum + (r.metrics?.drift?.currentDriftScore || 0), 0
      ) / highDriftReceipts.length;

      insights.push({
        id: `drift-${Date.now()}`,
        tenantId,
        priority: avgDrift > this.config.thresholds.driftScore.critical 
          ? InsightPriority.HIGH 
          : InsightPriority.MEDIUM,
        category: InsightCategory.BEHAVIORAL,
        title: `Text Consistency Drift Detected`,
        description: `Consistency analysis shows drift score of ${avgDrift.toFixed(1)}/100 across ${highDriftReceipts.length} recent interactions. This indicates changes in text properties (length, vocabulary, complexity).`,
        recommendation: avgDrift > this.config.thresholds.driftScore.critical
          ? 'Critical drift detected. Agent output properties are changing significantly. Investigate prompt drift, model updates, or adversarial influence.'
          : 'Moderate drift detected. Monitor for continued changes. Review recent interactions for vocabulary or complexity shifts.',
        source: { type: 'drift', details: { avgDrift, affectedReceipts: highDriftReceipts.length } },
        metrics: {
          currentValue: avgDrift,
          threshold: this.config.thresholds.driftScore.warning,
          severity: avgDrift > this.config.thresholds.driftScore.critical ? 'critical' : 'warning',
        },
        suggestedActions: [InsightAction.INVESTIGATE, InsightAction.REVIEW],
        availableActions: [InsightAction.INVESTIGATE, InsightAction.REVIEW, InsightAction.IGNORE],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { confidence: 0.82, tags: ['drift', 'consistency'] },
      });
    }

    return insights;
  }

  /**
   * Generate compliance-related insights
   */
  private generateComplianceInsights(tenantId: string, metrics: any): Insight[] {
    const insights: Insight[] = [];
    const { avgCompliance } = metrics;

    if (avgCompliance < 90) {
      insights.push({
        id: `compliance-${Date.now()}`,
        tenantId,
        priority: InsightPriority.MEDIUM,
        category: InsightCategory.COMPLIANCE,
        title: `Compliance Rate Below Optimal`,
        description: `Average EU AI Act compliance rate is ${avgCompliance.toFixed(1)}%, below the optimal 90% threshold.`,
        recommendation: 'Review compliance violations. Ensure agents are configured with proper constitutional principles and oversight mechanisms.',
        source: { type: 'compliance', details: { avgCompliance } },
        metrics: {
          currentValue: avgCompliance,
          threshold: 90,
          severity: avgCompliance < 80 ? 'warning' : 'none',
        },
        suggestedActions: [InsightAction.REVIEW, InsightAction.INVESTIGATE],
        availableActions: [InsightAction.REVIEW, InsightAction.INVESTIGATE, InsightAction.IGNORE],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { confidence: 0.9, tags: ['compliance', 'eu-ai-act'] },
      });
    }

    return insights;
  }

  /**
   * Generate insights for empty state (no data)
   */
  private getEmptyStateInsights(tenantId: string): Insight[] {
    return [{
      id: `empty-state-${Date.now()}`,
      tenantId,
      priority: InsightPriority.INFO,
      category: InsightCategory.TRUST,
      title: 'No Trust Data Available',
      description: 'No trust receipts have been generated yet. Start interacting with agents to begin trust evaluation.',
      recommendation: 'Initiate a trust session with an agent to begin collecting trust data and insights.',
      source: { type: 'trust_score' },
      metrics: {
        currentValue: 0,
        threshold: 1,
        severity: 'none',
      },
      suggestedActions: [InsightAction.REVIEW],
      availableActions: [InsightAction.REVIEW, InsightAction.IGNORE],
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { tags: ['onboarding'] },
    }];
  }

  /**
   * Update insight status
   */
  async updateInsightStatus(
    insightId: string,
    status: Insight['status'],
    action?: InsightAction
  ): Promise<Insight | null> {
    // In a real implementation, this would update the database
    // For now, return null as we don't persist insights
    return null;
  }
}

export const insightsGeneratorService = new InsightsGeneratorService();