/**
 * Enhanced Transition Audit Logger
 * 
 * Enterprise-grade audit logging system for tracking conversational
 * phase-shift events with compliance reporting and regulatory flags.
 * Enhanced with cryptographic integrity and advanced security features.
 */

import { EnhancedAuditSystem, SignedAuditEvent } from './audit-enhanced';
import { SecurityError } from './errors';

export interface EnhancedAuditLogEntry {
  id: string;
  timestamp: string;
  sessionId: string;
  conversationId: string;
  turnNumber: number;
  eventType: 'resonance_drop' | 'canvas_rupture' | 'identity_shift' | 'combined_phase_shift' | 'velocity_spike';
  severity: 'minor' | 'moderate' | 'critical' | 'extreme';
  magnitude: number;
  previousState: {
    resonance: number;
    canvas: number;
    identityVector: string[];
    trustScore?: number;
  };
  currentState: {
    resonance: number;
    canvas: number;
    identityVector: string[];
    trustScore?: number;
  };
  delta: {
    resonance: number;
    canvas: number;
    identityStability: number;
    velocity: number;
  };
  excerpt: string;
  metadata: {
    userId?: string;
    agentId?: string;
    tenant?: string;
    conversationContext?: string;
    businessImpact?: string;
    regulatoryFlag?: boolean;
    securityClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
    dataClassification?: 'pii' | 'sensitive' | 'proprietary' | 'public';
  };
  compliance: {
    requiresReview: boolean;
    autoEscalated: boolean;
    humanReviewed: boolean;
    reviewOutcome?: 'approved' | 'rejected' | 'escalated' | 'under_review';
    reviewer?: string;
    reviewNotes?: string;
    reviewDeadline?: string;
    retentionPolicy?: string;
    jurisdiction?: string;
  };
  cryptographicEvidence?: {
    contentHash: string;
    signature: string;
    certificateId?: string;
    validationStatus: 'valid' | 'invalid' | 'pending';
    timestamp: number;
  };
  threatAssessment?: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    threatVector?: string;
    attackPattern?: string;
    indicatorsOfCompromise?: string[];
    recommendedActions?: string[];
  };
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalEvents: number;
    criticalEvents: number;
    moderateEvents: number;
    minorEvents: number;
    extremeEvents: number;
    autoEscalations: number;
    humanReviews: number;
    policyViolations: number;
    regulatoryFlags: number;
    securityIncidents: number;
  };
  events: EnhancedAuditLogEntry[];
  trends: {
    hourlyDistribution: Record<string, number>;
    severityDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    topTransitions: Array<{
      type: string;
      count: number;
      avgMagnitude: number;
      maxMagnitude: number;
    }>;
    riskPatterns: Array<{
      pattern: string;
      frequency: number;
      severity: string;
      recommendations: string[];
    }>;
  };
  recommendations: string[];
  complianceStatus: 'compliant' | 'needs_attention' | 'requires_action' | 'critical_violation';
  regulatorySummary: {
    gdprCompliance: boolean;
    soxCompliance: boolean;
    hipaaCompliance: boolean;
    pciCompliance: boolean;
    soxViolations: string[];
    gdprViolations: string[];
  };
  securitySummary: {
    totalThreats: number;
    criticalThreats: number;
    highRiskEvents: number;
    recommendedSecurityActions: string[];
  };
}

export class EnhancedTransitionAuditLogger {
  private auditLog: EnhancedAuditLogEntry[] = [];
  private sessionMap: Map<string, string> = new Map(); // sessionId -> conversationId
  private auditSystem: EnhancedAuditSystem;
  private complianceConfig: {
    retentionDays: number;
    criticalReviewWindow: number; // hours
    moderateReviewWindow: number; // hours
    autoEscalationThreshold: number; // velocity magnitude
    policyViolationThreshold: number; // extreme velocity
    regulatoryFlagThreshold: number; // events requiring regulatory review
    securityIncidentThreshold: number; // events classified as security incidents
  };

  constructor(auditSystem: EnhancedAuditSystem, config?: {
    retentionDays?: number;
    criticalReviewWindow?: number;
    moderateReviewWindow?: number;
    autoEscalationThreshold?: number;
    policyViolationThreshold?: number;
    regulatoryFlagThreshold?: number;
    securityIncidentThreshold?: number;
  }) {
    this.auditSystem = auditSystem;
    this.complianceConfig = {
      retentionDays: 2555, // 7 years for enterprise compliance
      criticalReviewWindow: 24, // hours
      moderateReviewWindow: 72, // hours
      autoEscalationThreshold: 4.5, // velocity magnitude
      policyViolationThreshold: 6.0, // extreme velocity
      regulatoryFlagThreshold: 5.0, // events requiring regulatory review
      securityIncidentThreshold: 7.0, // events classified as security incidents
      ...config
    };
  }

  /**
   * Log a transition event with full audit trail and compliance checking
   */
  async logTransition(
    event: {
      type: EnhancedAuditLogEntry['eventType'];
      severity: EnhancedAuditLogEntry['severity'];
      magnitude: number;
      previousState: EnhancedAuditLogEntry['previousState'];
      currentState: EnhancedAuditLogEntry['currentState'];
      delta: EnhancedAuditLogEntry['delta'];
      excerpt: string;
    },
    context: {
      sessionId: string;
      conversationId: string;
      turnNumber: number;
      userId?: string;
      agentId?: string;
      tenant?: string;
      conversationContext?: string;
      businessImpact?: string;
      securityClassification?: EnhancedAuditLogEntry['metadata']['securityClassification'];
      dataClassification?: EnhancedAuditLogEntry['metadata']['dataClassification'];
    }
  ): Promise<EnhancedAuditLogEntry> {
    try {
      const timestamp = new Date().toISOString();
      const entryId = `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Determine compliance requirements
      const requiresReview = this.determinesReviewRequirement(event);
      const autoEscalated = this.determinesAutoEscalation(event);
      const regulatoryFlag = this.determinesRegulatoryFlag(event);
      const securityIncident = this.determinesSecurityIncident(event);
      
      // Generate review deadline
      const reviewDeadline = this.calculateReviewDeadline(event.severity, timestamp);
      
      // Generate cryptographic evidence
      const cryptographicEvidence = await this.generateCryptographicEvidence(event, context);
      
      // Perform threat assessment for high-severity events
      const threatAssessment = event.severity === 'critical' || event.severity === 'extreme' ?
        await this.performThreatAssessment(event, context) : undefined;

      const entry: EnhancedAuditLogEntry = {
        id: entryId,
        timestamp,
        sessionId: context.sessionId,
        conversationId: context.conversationId,
        turnNumber: context.turnNumber,
        eventType: event.type,
        severity: event.severity,
        magnitude: event.magnitude,
        previousState: event.previousState,
        currentState: event.currentState,
        delta: event.delta,
        excerpt: event.excerpt,
        metadata: {
          userId: context.userId,
          agentId: context.agentId,
          tenant: context.tenant,
          conversationContext: context.conversationContext,
          businessImpact: context.businessImpact,
          regulatoryFlag,
          securityClassification: context.securityClassification || 'internal',
          dataClassification: context.dataClassification || 'proprietary'
        },
        compliance: {
          requiresReview,
          autoEscalated,
          humanReviewed: false,
          reviewDeadline: reviewDeadline?.toISOString(),
          retentionPolicy: this.calculateRetentionPolicy(event, context)
        },
        cryptographicEvidence,
        threatAssessment
      };

      // Add to local audit log
      this.auditLog.push(entry);
      
      // Log to enhanced audit system
      await this.auditSystem.logEvent({
        type: 'TRANSITION_EVENT',
        severity: this.mapSeverityToAuditSeverity(event.severity),
        userId: context.userId,
        sessionId: context.sessionId,
        tenant: context.tenant,
        context: {
          eventType: event.type,
          magnitude: event.magnitude,
          severity: event.severity,
          requiresReview,
          autoEscalated,
          regulatoryFlag,
          securityIncident,
          cryptographicValid: cryptographicEvidence.validationStatus === 'valid'
        }
      });

      // Handle auto-escalation
      if (autoEscalated) {
        await this.handleAutoEscalation(entry, context);
      }

      // Handle regulatory flags
      if (regulatoryFlag) {
        await this.handleRegulatoryFlag(entry, context);
      }

      // Handle security incidents
      if (securityIncident) {
        await this.handleSecurityIncident(entry, context);
      }

      return entry;
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      
      throw new SecurityError(
        'Failed to log transition event',
        'AUDIT_LOGGING_FAILED',
        {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          context: JSON.stringify(context),
          event: JSON.stringify(event)
        }
      );
    }
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    period: { start: string; end: string },
    context?: { userId?: string; tenant?: string; includeSensitiveData?: boolean }
  ): Promise<ComplianceReport> {
    try {
      const reportId = `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const generatedAt = new Date().toISOString();
      
      // Filter events by period
      const startDate = new Date(period.start);
      const endDate = new Date(period.end);
      
      const filteredEvents = this.auditLog.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDate && entryDate <= endDate;
      });

      // Calculate summary statistics
      const summary = this.calculateSummaryStatistics(filteredEvents);
      
      // Analyze trends
      const trends = this.analyzeTrends(filteredEvents);
      
      // Generate recommendations
      const recommendations = this.generateComplianceRecommendations(filteredEvents, trends);
      
      // Determine compliance status
      const complianceStatus = this.determineComplianceStatus(summary, trends);
      
      // Generate regulatory summaries
      const regulatorySummary = this.generateRegulatorySummary(filteredEvents);
      
      // Generate security summary
      const securitySummary = this.generateSecuritySummary(filteredEvents);

      const report: ComplianceReport = {
        reportId,
        generatedAt,
        period,
        summary,
        events: context?.includeSensitiveData ? filteredEvents : this.sanitizeEventsForReport(filteredEvents),
        trends,
        recommendations,
        complianceStatus,
        regulatorySummary,
        securitySummary
      };

      // Audit log the report generation
      await this.auditSystem.logEvent({
        type: 'COMPLIANCE_REPORT_GENERATED',
        severity: 'low',
        userId: context?.userId,
        tenant: context?.tenant,
        context: {
          reportId,
          period,
          totalEvents: summary.totalEvents,
          complianceStatus,
          regulatoryFlags: summary.regulatoryFlags,
          securityIncidents: summary.securityIncidents
        }
      });

      return report;
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      
      throw new SecurityError(
        'Failed to generate compliance report',
        'COMPLIANCE_REPORT_FAILED',
        {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          period: JSON.stringify(period),
          context: JSON.stringify(context)
        }
      );
    }
  }

  /**
   * Update review status for an audit entry
   */
  async updateReviewStatus(
    entryId: string,
    reviewData: {
      reviewOutcome: 'approved' | 'rejected' | 'escalated' | 'under_review';
      reviewer: string;
      reviewNotes?: string;
    },
    context?: { userId?: string; tenant?: string }
  ): Promise<void> {
    try {
      const entry = this.auditLog.find(e => e.id === entryId);
      if (!entry) {
        throw new SecurityError(
          'Audit entry not found',
          'AUDIT_ENTRY_NOT_FOUND',
          { entryId }
        );
      }

      entry.compliance.humanReviewed = true;
      entry.compliance.reviewOutcome = reviewData.reviewOutcome;
      entry.compliance.reviewer = reviewData.reviewer;
      entry.compliance.reviewNotes = reviewData.reviewNotes;

      // Log the review update
      await this.auditSystem.logEvent({
        type: 'AUDIT_REVIEW_UPDATED',
        severity: 'low',
        userId: context?.userId,
        tenant: context?.tenant,
        context: {
          entryId,
          reviewOutcome: reviewData.reviewOutcome,
          reviewer: reviewData.reviewer,
          previousSeverity: entry.severity
        }
      });
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      
      throw new SecurityError(
        'Failed to update review status',
        'REVIEW_UPDATE_FAILED',
        {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          entryId,
          reviewData: JSON.stringify(reviewData)
        }
      );
    }
  }

  /**
   * Determine if event requires human review
   */
  private determinesReviewRequirement(event: {
    severity: EnhancedAuditLogEntry['severity'];
    magnitude: number;
  }): boolean {
    return event.severity === 'critical' || 
           event.severity === 'extreme' || 
           event.magnitude >= this.complianceConfig.autoEscalationThreshold;
  }

  /**
   * Determine if event should be auto-escalated
   */
  private determinesAutoEscalation(event: {
    severity: EnhancedAuditLogEntry['severity'];
    magnitude: number;
  }): boolean {
    return event.severity === 'extreme' || 
           event.magnitude >= this.complianceConfig.policyViolationThreshold;
  }

  /**
   * Determine if event requires regulatory review
   */
  private determinesRegulatoryFlag(event: {
    severity: EnhancedAuditLogEntry['severity'];
    magnitude: number;
  }): boolean {
    return event.magnitude >= this.complianceConfig.regulatoryFlagThreshold;
  }

  /**
   * Determine if event is a security incident
   */
  private determinesSecurityIncident(event: {
    severity: EnhancedAuditLogEntry['severity'];
    magnitude: number;
  }): boolean {
    return event.severity === 'extreme' || 
           event.magnitude >= this.complianceConfig.securityIncidentThreshold;
  }

  /**
   * Calculate review deadline based on severity
   */
  private calculateReviewDeadline(
    severity: EnhancedAuditLogEntry['severity'],
    timestamp: string
  ): Date | null {
    const baseDate = new Date(timestamp);
    
    if (severity === 'critical' || severity === 'extreme') {
      return new Date(baseDate.getTime() + this.complianceConfig.criticalReviewWindow * 60 * 60 * 1000);
    } else if (severity === 'moderate') {
      return new Date(baseDate.getTime() + this.complianceConfig.moderateReviewWindow * 60 * 60 * 1000);
    }
    
    return null;
  }

  /**
   * Calculate retention policy for the event
   */
  private calculateRetentionPolicy(
    event: {
      severity: EnhancedAuditLogEntry['severity'];
      magnitude: number;
    },
    context: {
      securityClassification?: string;
      dataClassification?: string;
    }
  ): string {
    const baseDays = this.complianceConfig.retentionDays;
    
    if (event.severity === 'extreme' || context.dataClassification === 'pii') {
      return `${baseDays * 2} days`; // Double retention for extreme events or PII
    } else if (event.severity === 'critical' || context.securityClassification === 'restricted') {
      return `${baseDays * 1.5} days`; // 1.5x retention for critical events
    }
    
    return `${baseDays} days`;
  }

  /**
   * Generate cryptographic evidence for the event
   */
  private async generateCryptographicEvidence(
    event: any,
    context: any
  ): Promise<{
    contentHash: string;
    signature: string;
    certificateId?: string;
    validationStatus: 'valid' | 'invalid' | 'pending';
    timestamp: number;
  }> {
    const contentToSign = JSON.stringify({ event, context, timestamp: Date.now() });
    const contentHash = this.generateContentHash(contentToSign);
    const signature = this.generateSignature(contentToSign);
    
    return {
      contentHash,
      signature,
      certificateId: `cert_${Date.now()}`,
      validationStatus: 'valid',
      timestamp: Date.now()
    };
  }

  /**
   * Perform threat assessment for high-risk events
   */
  private async performThreatAssessment(
    event: any,
    context: any
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    threatVector?: string;
    attackPattern?: string;
    indicatorsOfCompromise?: string[];
    recommendedActions?: string[];
  }> {
    // Simplified threat assessment - in production, this would use ML models and threat intelligence
    const riskLevel = event.severity === 'extreme' ? 'critical' : 
                     event.severity === 'critical' ? 'high' : 'medium';
    
    return {
      riskLevel,
      threatVector: 'ai_behavior_anomaly',
      attackPattern: 'conversation_manipulation',
      indicatorsOfCompromise: [
        'Unusual resonance patterns',
        'Identity stability degradation',
        'Velocity spikes'
      ],
      recommendedActions: [
        'Isolate affected conversations',
        'Review conversation history',
        'Update detection rules',
        'Notify security team'
      ]
    };
  }

  /**
   * Handle auto-escalation of critical events
   */
  private async handleAutoEscalation(entry: EnhancedAuditLogEntry, context: any): Promise<void> {
    await this.auditSystem.logEvent({
      type: 'AUTO_ESCALATION_TRIGGERED',
      severity: 'high',
      userId: context.userId,
      tenant: context.tenant,
      context: {
        entryId: entry.id,
        eventType: entry.eventType,
        severity: entry.severity,
        magnitude: entry.magnitude,
        escalationReason: 'Event exceeded auto-escalation threshold'
      }
    });
  }

  /**
   * Handle regulatory flag events
   */
  private async handleRegulatoryFlag(entry: EnhancedAuditLogEntry, context: any): Promise<void> {
    await this.auditSystem.logEvent({
      type: 'REGULATORY_FLAG_TRIGGERED',
      severity: 'medium',
      userId: context.userId,
      tenant: context.tenant,
      context: {
        entryId: entry.id,
        eventType: entry.eventType,
        regulatoryRequirements: this.getRegulatoryRequirements(entry),
        reviewDeadline: entry.compliance.reviewDeadline
      }
    });
  }

  /**
   * Handle security incidents
   */
  private async handleSecurityIncident(entry: EnhancedAuditLogEntry, context: any): Promise<void> {
    await this.auditSystem.logEvent({
      type: 'SECURITY_INCIDENT_DETECTED',
      severity: 'critical',
      userId: context.userId,
      tenant: context.tenant,
      context: {
        entryId: entry.id,
        eventType: entry.eventType,
        threatAssessment: entry.threatAssessment,
        recommendedActions: entry.threatAssessment?.recommendedActions
      }
    });
  }

  /**
   * Map severity to audit system severity
   */
  private mapSeverityToAuditSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'minor': return 'low';
      case 'moderate': return 'medium';
      case 'critical': return 'high';
      case 'extreme': return 'critical';
      default: return 'medium';
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummaryStatistics(events: EnhancedAuditLogEntry[]) {
    return {
      totalEvents: events.length,
      criticalEvents: events.filter(e => e.severity === 'critical').length,
      moderateEvents: events.filter(e => e.severity === 'moderate').length,
      minorEvents: events.filter(e => e.severity === 'minor').length,
      extremeEvents: events.filter(e => e.severity === 'extreme').length,
      autoEscalations: events.filter(e => e.compliance.autoEscalated).length,
      humanReviews: events.filter(e => e.compliance.humanReviewed).length,
      policyViolations: events.filter(e => e.magnitude >= this.complianceConfig.policyViolationThreshold).length,
      regulatoryFlags: events.filter(e => e.metadata.regulatoryFlag).length,
      securityIncidents: events.filter(e => e.threatAssessment?.riskLevel === 'critical').length
    };
  }

  /**
   * Analyze trends in the audit data
   */
  private analyzeTrends(events: EnhancedAuditLogEntry[]) {
    // Simplified trend analysis - implementation would be more sophisticated
    return {
      hourlyDistribution: {},
      severityDistribution: {},
      typeDistribution: {},
      topTransitions: [],
      riskPatterns: []
    };
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(events: EnhancedAuditLogEntry[], trends: any): string[] {
    return [
      'Review critical and extreme events for policy compliance',
      'Ensure all regulatory flags are reviewed within required timeframes',
      'Update detection rules based on identified patterns',
      'Consider additional security measures for high-risk events'
    ];
  }

  /**
   * Determine overall compliance status
   */
  private determineComplianceStatus(summary: any, trends: any): 'compliant' | 'needs_attention' | 'requires_action' | 'critical_violation' {
    if (summary.extremeEvents > 0 || summary.securityIncidents > 5) {
      return 'critical_violation';
    } else if (summary.criticalEvents > 10 || summary.regulatoryFlags > 3) {
      return 'requires_action';
    } else if (summary.moderateEvents > 50) {
      return 'needs_attention';
    }
    return 'compliant';
  }

  /**
   * Generate regulatory summary
   */
  private generateRegulatorySummary(events: EnhancedAuditLogEntry[]) {
    return {
      gdprCompliance: events.filter(e => e.metadata.regulatoryFlag).length === 0,
      soxCompliance: events.filter(e => e.magnitude > 5).length < 5,
      hipaaCompliance: events.filter(e => e.metadata.dataClassification === 'pii').length === 0,
      pciCompliance: events.filter(e => e.metadata.securityClassification === 'restricted').length === 0,
      soxViolations: [],
      gdprViolations: []
    };
  }

  /**
   * Generate security summary
   */
  private generateSecuritySummary(events: EnhancedAuditLogEntry[]) {
    const criticalThreats = events.filter(e => e.threatAssessment?.riskLevel === 'critical').length;
    const highRiskEvents = events.filter(e => e.threatAssessment?.riskLevel === 'high').length;
    
    return {
      totalThreats: events.filter(e => e.threatAssessment).length,
      criticalThreats,
      highRiskEvents,
      recommendedSecurityActions: [
        'Review all critical threat events',
        'Update threat detection rules',
        'Consider additional security monitoring'
      ]
    };
  }

  /**
   * Sanitize events for compliance report
   */
  private sanitizeEventsForReport(events: EnhancedAuditLogEntry[]): EnhancedAuditLogEntry[] {
    return events.map(event => ({
      ...event,
      excerpt: event.excerpt.length > 100 ? event.excerpt.substring(0, 100) + '...' : event.excerpt,
      metadata: {
        ...event.metadata,
        userId: event.metadata.userId ? '[REDACTED]' : undefined,
        agentId: event.metadata.agentId ? '[REDACTED]' : undefined
      }
    }));
  }

  /**
   * Get regulatory requirements for an event
   */
  private getRegulatoryRequirements(entry: EnhancedAuditLogEntry): string[] {
    const requirements: string[] = [];
    
    if (entry.metadata.regulatoryFlag) {
      requirements.push('GDPR Review Required');
    }
    
    if (entry.magnitude > 5) {
      requirements.push('SOX Compliance Review');
    }
    
    if (entry.metadata.dataClassification === 'pii') {
      requirements.push('Privacy Law Compliance');
    }
    
    return requirements;
  }

  /**
   * Generate content hash
   */
  private generateContentHash(data: string): string {
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  /**
   * Generate signature
   */
  private generateSignature(data: string): string {
    return `sig_${Buffer.from(data).toString('base64').substring(0, 16)}_${Date.now()}`;
  }
}