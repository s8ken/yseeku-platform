/**
 * Trust Metrics for SONATE Platform
 */

import { metrics } from '@opentelemetry/api';
import { TrustObservabilityData } from '../types';

/**
 * Trust metrics collector
 */
export class TrustMetrics {
  private meter = metrics.getMeter('sonate-trust');
  
  private trustScoreHistogram = this.meter.createHistogram('sonate_trust_score', {
    description: 'Trust score distribution across all evaluations',
    unit: 'score',
  });
  
  private trustViolationsCounter = this.meter.createCounter('sonate_trust_violations_total', {
    description: 'Total number of trust principle violations',
  });
  
  private principleScoreHistogram = this.meter.createHistogram('sonate_trust_principle_score', {
    description: 'Individual principle scores',
    unit: 'score',
  });
  
  private evaluationDurationHistogram = this.meter.createHistogram('sonate_trust_evaluation_duration_ms', {
    description: 'Time taken to evaluate trust scores',
    unit: 'ms',
  });

  /**
   * Record trust score evaluation
   */
  recordTrustEvaluation(data: TrustObservabilityData, duration: number): void {
    // Record overall trust score
    this.trustScoreHistogram.record(data.trustScore, {
      'sonate.tenant': data.tenant || 'unknown',
      'sonate.agent.id': data.agentId || 'unknown',
      'sonate.interaction.id': data.interactionId || 'unknown',
    });

    // Record evaluation duration
    this.evaluationDurationHistogram.record(duration, {
      'sonate.tenant': data.tenant || 'unknown',
      'sonate.agent.id': data.agentId || 'unknown',
    });

    // Record individual principle scores
    Object.entries(data.principleScores).forEach(([principle, score]) => {
      this.principleScoreHistogram.record(score, {
        'sonate.trust.principle': principle,
        'sonate.tenant': data.tenant || 'unknown',
        'sonate.agent.id': data.agentId || 'unknown',
      });
    });

    // Record violations
    if (data.violations.length > 0) {
      this.trustViolationsCounter.add(data.violations.length, {
        'sonate.tenant': data.tenant || 'unknown',
        'sonate.agent.id': data.agentId || 'unknown',
        'sonate.trust.violations': data.violations.join(','),
      });

      // Record violation count per principle
      data.violations.forEach(violation => {
        this.trustViolationsCounter.add(1, {
          'sonate.tenant': data.tenant || 'unknown',
          'sonate.agent.id': data.agentId || 'unknown',
          'sonate.trust.violation_type': violation,
        });
      });
    }
  }

  /**
   * Get the meter for custom trust metrics
   */
  getMeter() {
    return this.meter;
  }
}
