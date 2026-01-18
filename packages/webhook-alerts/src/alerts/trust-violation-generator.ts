/**
 * Trust Violation Alert Generator
 */

import { 
  WebhookAlertRequest, 
  WebhookEventType, 
  WebhookEventData,
  TrustScore,
  TrustPrincipleKey,
  ViolationSeverity,
  ViolationContext
} from '../types';

/**
 * Generates webhook alerts for trust violations
 */
export class TrustViolationAlertGenerator {
  /**
   * Generate alert for trust score below threshold
   */
  generateTrustScoreBelowThresholdAlert(
    trustScore: TrustScore,
    threshold: number,
    context?: ViolationContext
  ): WebhookAlertRequest {
    return {
      type: 'trust_score_below_threshold',
      data: {
        trustScore,
        violation: {
          score: trustScore.overall,
          threshold,
          severity: this.getViolationSeverity(trustScore.overall, threshold),
          principles: this.getViolatingPrinciples(trustScore, threshold),
          context: context || {}
        }
      },
      priority: this.getPriority(trustScore.overall, threshold),
      metadata: {
        eventId: '',
        source: 'trust-violation-generator',
        version: '1.0.0',
        timestamp: Date.now(),
        processingTime: 0,
        retryCount: 0,
        priority: 'medium'
      }
    };
  }

  /**
   * Generate alert for critical trust violation
   */
  generateCriticalViolationAlert(
    trustScore: TrustScore,
    principle: TrustPrincipleKey,
    description: string,
    context?: ViolationContext
  ): WebhookAlertRequest {
    return {
      type: 'trust_violation_critical',
      data: {
        trustScore,
        principleViolation: {
          principle,
          score: trustScore.principles[principle],
          threshold: 7.0, // Critical threshold
          severity: 'critical',
          description,
          context: context || {}
        }
      },
      priority: 'critical',
      metadata: {
        eventId: '',
        source: 'trust-violation-generator',
        version: '1.0.0',
        timestamp: Date.now(),
        processingTime: 0,
        retryCount: 0,
        priority: 'critical'
      }
    };
  }

  /**
   * Generate alert for error-level trust violation
   */
  generateErrorViolationAlert(
    trustScore: TrustScore,
    principle: TrustPrincipleKey,
    description: string,
    context?: ViolationContext
  ): WebhookAlertRequest {
    return {
      type: 'trust_violation_error',
      data: {
        trustScore,
        principleViolation: {
          principle,
          score: trustScore.principles[principle],
          threshold: 5.0, // Error threshold
          severity: 'error',
          description,
          context: context || {}
        }
      },
      priority: 'high',
      metadata: {
        eventId: '',
        source: 'trust-violation-generator',
        version: '1.0.0',
        timestamp: Date.now(),
        processingTime: 0,
        retryCount: 0,
        priority: 'high'
      }
    };
  }

  /**
   * Generate alert for warning-level trust violation
   */
  generateWarningViolationAlert(
    trustScore: TrustScore,
    principle: TrustPrincipleKey,
    description: string,
    context?: ViolationContext
  ): WebhookAlertRequest {
    return {
      type: 'trust_violation_warning',
      data: {
        trustScore,
        principleViolation: {
          principle,
          score: trustScore.principles[principle],
          threshold: 3.0, // Warning threshold
          severity: 'warning',
          description,
          context: context || {}
        }
      },
      priority: 'medium',
      metadata: {
        eventId: '',
        source: 'trust-violation-generator',
        version: '1.0.0',
        timestamp: Date.now(),
        processingTime: 0,
        retryCount: 0,
        priority: 'medium'
      }
    };
  }

  /**
   * Generate alert for multiple principle violations
   */
  generateMultipleViolationsAlert(
    trustScore: TrustScore,
    violations: Array<{
      principle: TrustPrincipleKey;
      score: number;
      threshold: number;
      severity: ViolationSeverity;
      description: string;
    }>,
    context?: ViolationContext
  ): WebhookAlertRequest {
    const highestSeverity = this.getHighestSeverity(violations.map(v => v.severity));
    
    return {
      type: this.getEventTypeForSeverity(highestSeverity),
      data: {
        trustScore,
        violation: {
          score: trustScore.overall,
          threshold: Math.min(...violations.map(v => v.threshold)),
          severity: highestSeverity,
          principles: violations.map(v => v.principle),
          description: `Multiple violations: ${violations.map(v => v.description).join('; ')}`,
          context: context || {}
        }
      },
      priority: this.getPriorityForSeverity(highestSeverity),
      metadata: {
        eventId: '',
        source: 'trust-violation-generator',
        version: '1.0.0',
        timestamp: Date.now(),
        processingTime: 0,
        retryCount: 0,
        priority: 'medium'
      }
    };
  }

  /**
   * Get violating principles
   */
  private getViolatingPrinciples(trustScore: TrustScore, threshold: number): TrustPrincipleKey[] {
    return Object.entries(trustScore.principles)
      .filter(([_, score]) => score < threshold)
      .map(([principle, _]) => principle as TrustPrincipleKey);
  }

  /**
   * Get violation severity based on score and threshold
   */
  private getViolationSeverity(score: number, threshold: number): ViolationSeverity {
    const difference = threshold - score;
    
    if (difference >= 3) return 'critical';
    if (difference >= 2) return 'error';
    if (difference >= 1) return 'warning';
    return 'info';
  }

  /**
   * Get event type for severity
   */
  private getEventTypeForSeverity(severity: ViolationSeverity): WebhookEventType {
    switch (severity) {
      case 'critical':
        return 'trust_violation_critical';
      case 'error':
        return 'trust_violation_error';
      case 'warning':
        return 'trust_violation_warning';
      default:
        return 'trust_violation_warning';
    }
  }

  /**
   * Get priority based on score and threshold
   */
  private getPriority(score: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const difference = threshold - score;
    
    if (difference >= 3) return 'critical';
    if (difference >= 2) return 'high';
    if (difference >= 1) return 'medium';
    return 'low';
  }

  /**
   * Get priority for severity
   */
  private getPriorityForSeverity(severity: ViolationSeverity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Get highest severity from array
   */
  private getHighestSeverity(severities: ViolationSeverity[]): ViolationSeverity {
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('error')) return 'error';
    if (severities.includes('warning')) return 'warning';
    return 'info';
  }
}
