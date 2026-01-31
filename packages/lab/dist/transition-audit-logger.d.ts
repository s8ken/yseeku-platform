/**
 * Transition Event Logging and Audit Compliance System
 *
 * Comprehensive logging system for tracking conversational phase-shift events
 * with enterprise-grade audit trails and compliance reporting.
 */
import { TransitionEvent, ConversationTurn } from './conversational-metrics';
export interface AuditLogEntry {
    id: string;
    timestamp: string;
    sessionId: string;
    conversationId: string;
    turnNumber: number;
    eventType: TransitionEvent['type'];
    severity: TransitionEvent['severity'];
    magnitude: number;
    previousState: {
        resonance: number;
        canvas: number;
        identityVector: string[];
    };
    currentState: {
        resonance: number;
        canvas: number;
        identityVector: string[];
    };
    delta: {
        resonance: number;
        canvas: number;
        identityStability: number;
    };
    excerpt: string;
    metadata: {
        userId?: string;
        agentId?: string;
        conversationContext?: string;
        businessImpact?: string;
        regulatoryFlag?: boolean;
    };
    compliance: {
        requiresReview: boolean;
        autoEscalated: boolean;
        humanReviewed: boolean;
        reviewOutcome?: 'approved' | 'rejected' | 'escalated';
        reviewer?: string;
        reviewNotes?: string;
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
        autoEscalations: number;
        humanReviews: number;
        policyViolations: number;
    };
    events: AuditLogEntry[];
    trends: {
        hourlyDistribution: Record<string, number>;
        severityDistribution: Record<string, number>;
        typeDistribution: Record<string, number>;
        topTransitions: Array<{
            type: string;
            count: number;
            avgMagnitude: number;
        }>;
    };
    recommendations: string[];
    complianceStatus: 'compliant' | 'needs_attention' | 'requires_action';
}
export declare class TransitionAuditLogger {
    private auditLog;
    private sessionMap;
    private complianceConfig;
    /**
     * Log a transition event with full audit trail
     */
    logTransition(event: TransitionEvent, previousTurn: ConversationTurn, currentTurn: ConversationTurn, sessionId: string, metadata?: AuditLogEntry['metadata']): AuditLogEntry;
    /**
     * Calculate identity stability between turns
     */
    private calculateIdentityStability;
    /**
     * Assess business impact of transition
     */
    private assessBusinessImpact;
    /**
     * Determine if regulatory flag is required
     */
    private requiresRegulatoryFlag;
    /**
     * Determine if human review is required
     */
    private requiresHumanReview;
    /**
     * Determine if auto-escalation is needed
     */
    private shouldAutoEscalate;
    /**
     * Notify compliance team of critical events
     */
    private notifyComplianceTeam;
    /**
     * Generate compliance report for specified period
     */
    generateComplianceReport(startDate: Date, endDate: Date): ComplianceReport;
    /**
     * Calculate trend analysis
     */
    private calculateTrends;
    /**
     * Generate compliance recommendations
     */
    private generateRecommendations;
    /**
     * Determine overall compliance status
     */
    private determineComplianceStatus;
    /**
     * Get audit log for specific session
     */
    getSessionAuditLog(sessionId: string): AuditLogEntry[];
    /**
     * Mark event as human reviewed
     */
    markAsReviewed(eventId: string, reviewer: string, outcome: 'approved' | 'rejected' | 'escalated', notes?: string): boolean;
    /**
     * Export audit data for external systems
     */
    exportAuditData(format?: 'json' | 'csv'): string;
    /**
     * Export to CSV format for compliance systems
     */
    private exportToCSV;
    /**
     * Generate unique audit ID
     */
    private generateAuditId;
    /**
     * Get or create conversation ID for session
     */
    private getOrCreateConversationId;
    /**
     * Get statistics for dashboard
     */
    getStatistics(): {
        totalEvents: number;
        last24h: {
            total: number;
            critical: number;
            moderate: number;
            minor: number;
        };
        last7d: {
            total: number;
            critical: number;
            moderate: number;
            minor: number;
        };
        pendingReviews: number;
        autoEscalations: number;
    };
}
export declare const auditLogger: TransitionAuditLogger;
export declare function demonstrateAuditLogging(): {
    logger: TransitionAuditLogger;
    auditEntry: AuditLogEntry;
    report: ComplianceReport;
    stats: {
        totalEvents: number;
        last24h: {
            total: number;
            critical: number;
            moderate: number;
            minor: number;
        };
        last7d: {
            total: number;
            critical: number;
            moderate: number;
            minor: number;
        };
        pendingReviews: number;
        autoEscalations: number;
    };
};
