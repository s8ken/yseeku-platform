"use strict";
/**
 * Transition Event Logging and Audit Compliance System
 *
 * Comprehensive logging system for tracking conversational phase-shift events
 * with enterprise-grade audit trails and compliance reporting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.TransitionAuditLogger = void 0;
exports.demonstrateAuditLogging = demonstrateAuditLogging;
class TransitionAuditLogger {
    constructor() {
        this.auditLog = [];
        this.sessionMap = new Map(); // sessionId -> conversationId
        this.complianceConfig = {
            retentionDays: 2555, // 7 years for enterprise compliance
            criticalReviewWindow: 24, // hours
            moderateReviewWindow: 72, // hours
            autoEscalationThreshold: 4.5, // velocity magnitude
            policyViolationThreshold: 6.0, // extreme velocity
        };
    }
    /**
     * Log a transition event with full audit trail
     */
    logTransition(event, previousTurn, currentTurn, sessionId, metadata = {}) {
        const auditEntry = {
            id: this.generateAuditId(),
            timestamp: new Date(event.timestamp).toISOString(),
            sessionId,
            conversationId: this.getOrCreateConversationId(sessionId),
            turnNumber: event.turnNumber,
            eventType: event.type,
            severity: event.severity,
            magnitude: event.magnitude,
            previousState: {
                resonance: previousTurn.resonance,
                canvas: previousTurn.canvas,
                identityVector: [...previousTurn.identityVector],
            },
            currentState: {
                resonance: currentTurn.resonance,
                canvas: currentTurn.canvas,
                identityVector: [...currentTurn.identityVector],
            },
            delta: {
                resonance: currentTurn.resonance - previousTurn.resonance,
                canvas: currentTurn.canvas - previousTurn.canvas,
                identityStability: this.calculateIdentityStability(previousTurn.identityVector, currentTurn.identityVector),
            },
            excerpt: event.excerpt,
            metadata: {
                ...metadata,
                businessImpact: this.assessBusinessImpact(event, currentTurn),
                regulatoryFlag: this.requiresRegulatoryFlag(event),
            },
            compliance: {
                requiresReview: this.requiresHumanReview(event),
                autoEscalated: this.shouldAutoEscalate(event),
                humanReviewed: false,
                reviewOutcome: undefined,
                reviewer: undefined,
                reviewNotes: undefined,
            },
        };
        this.auditLog.push(auditEntry);
        // Generate real-time compliance notification
        this.notifyComplianceTeam(auditEntry);
        return auditEntry;
    }
    /**
     * Calculate identity stability between turns
     */
    calculateIdentityStability(vectorA, vectorB) {
        if (vectorA.length === 0 || vectorB.length === 0) {
            return 1.0;
        }
        const setA = new Set(vectorA);
        const setB = new Set(vectorB);
        const intersection = new Set([...setA].filter((x) => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        return intersection.size / union.size;
    }
    /**
     * Assess business impact of transition
     */
    assessBusinessImpact(event, currentTurn) {
        if (event.severity === 'critical') {
            return 'HIGH: Critical behavioral shift detected, immediate review required';
        }
        else if (event.severity === 'moderate') {
            return 'MEDIUM: Significant behavioral change, monitor closely';
        }
        else if (event.type === 'identity_shift') {
            return 'HIGH: Identity consistency compromised, brand risk';
        }
        else if (event.magnitude > 3.0) {
            return 'MEDIUM-HIGH: Substantial velocity shift, quality assurance recommended';
        }
        return 'LOW: Minor behavioral variation, routine monitoring';
    }
    /**
     * Determine if regulatory flag is required
     */
    requiresRegulatoryFlag(event) {
        return (event.severity === 'critical' ||
            event.magnitude >= this.complianceConfig.policyViolationThreshold);
    }
    /**
     * Determine if human review is required
     */
    requiresHumanReview(event) {
        return (event.severity === 'critical' || event.magnitude >= 3.0 || event.type === 'identity_shift');
    }
    /**
     * Determine if auto-escalation is needed
     */
    shouldAutoEscalate(event) {
        return (event.magnitude >= this.complianceConfig.autoEscalationThreshold ||
            event.severity === 'critical');
    }
    /**
     * Notify compliance team of critical events
     */
    notifyComplianceTeam(entry) {
        if (entry.severity === 'critical' || entry.compliance.autoEscalated) {
            const notification = {
                type: 'COMPLIANCE_ALERT',
                priority: entry.severity === 'critical' ? 'HIGH' : 'MEDIUM',
                sessionId: entry.sessionId,
                eventId: entry.id,
                magnitude: entry.magnitude,
                requiresReview: entry.compliance.requiresReview,
                timestamp: entry.timestamp,
            };
            // In real implementation, this would send to compliance system
            console.log(`🔔 COMPLIANCE ALERT: Session ${entry.sessionId} - ${entry.eventType} (${entry.severity})`);
            console.log(`   Magnitude: ${entry.magnitude.toFixed(2)} | Review Required: ${entry.compliance.requiresReview}`);
        }
    }
    /**
     * Generate compliance report for specified period
     */
    generateComplianceReport(startDate, endDate) {
        const filteredEvents = this.auditLog.filter((entry) => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= startDate && entryDate <= endDate;
        });
        const summary = {
            totalEvents: filteredEvents.length,
            criticalEvents: filteredEvents.filter((e) => e.severity === 'critical').length,
            moderateEvents: filteredEvents.filter((e) => e.severity === 'moderate').length,
            minorEvents: filteredEvents.filter((e) => e.severity === 'minor').length,
            autoEscalations: filteredEvents.filter((e) => e.compliance.autoEscalated).length,
            humanReviews: filteredEvents.filter((e) => e.compliance.humanReviewed).length,
            policyViolations: filteredEvents.filter((e) => e.metadata.regulatoryFlag).length,
        };
        const trends = this.calculateTrends(filteredEvents);
        const recommendations = this.generateRecommendations(summary, trends);
        const complianceStatus = this.determineComplianceStatus(summary);
        const report = {
            reportId: `compliance-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
            summary,
            events: filteredEvents,
            trends,
            recommendations,
            complianceStatus,
        };
        return report;
    }
    /**
     * Calculate trend analysis
     */
    calculateTrends(events) {
        const hourlyDistribution = {};
        const severityDistribution = {};
        const typeDistribution = {};
        const typeMagnitude = {};
        events.forEach((event) => {
            // Hourly distribution
            const hour = new Date(event.timestamp).getHours().toString().padStart(2, '0') + ':00';
            hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
            // Severity distribution
            severityDistribution[event.severity] = (severityDistribution[event.severity] || 0) + 1;
            // Type distribution and magnitude tracking
            typeDistribution[event.eventType] = (typeDistribution[event.eventType] || 0) + 1;
            if (!typeMagnitude[event.eventType]) {
                typeMagnitude[event.eventType] = [];
            }
            typeMagnitude[event.eventType].push(event.magnitude);
        });
        const topTransitions = Object.entries(typeDistribution)
            .map(([type, count]) => ({
            type,
            count,
            avgMagnitude: typeMagnitude[type].reduce((a, b) => a + b, 0) / typeMagnitude[type].length,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return {
            hourlyDistribution,
            severityDistribution,
            typeDistribution,
            topTransitions,
        };
    }
    /**
     * Generate compliance recommendations
     */
    generateRecommendations(summary, trends) {
        const recommendations = [];
        if (summary.criticalEvents > 0) {
            recommendations.push('Critical events detected - immediate policy review recommended');
        }
        if (summary.policyViolations > 3) {
            recommendations.push('Multiple policy violations detected - consider threshold adjustment');
        }
        if (summary.autoEscalations > summary.totalEvents * 0.1) {
            recommendations.push('High auto-escalation rate - review escalation thresholds');
        }
        const topTransition = trends.topTransitions[0];
        if (topTransition && topTransition.count > summary.totalEvents * 0.3) {
            recommendations.push(`Primary transition type '${topTransition.type}' requires focused analysis`);
        }
        if (summary.humanReviews < summary.criticalEvents + summary.moderateEvents) {
            recommendations.push('Review completion rate below expectations - enhance review processes');
        }
        recommendations.push('Continue current monitoring protocols - system performing within acceptable parameters');
        return recommendations;
    }
    /**
     * Determine overall compliance status
     */
    determineComplianceStatus(summary) {
        if (summary.criticalEvents > 0 || summary.policyViolations > 5) {
            return 'requires_action';
        }
        else if (summary.moderateEvents > 10 ||
            summary.autoEscalations > summary.totalEvents * 0.15) {
            return 'needs_attention';
        }
        return 'compliant';
    }
    /**
     * Get audit log for specific session
     */
    getSessionAuditLog(sessionId) {
        return this.auditLog.filter((entry) => entry.sessionId === sessionId);
    }
    /**
     * Mark event as human reviewed
     */
    markAsReviewed(eventId, reviewer, outcome, notes) {
        const entry = this.auditLog.find((e) => e.id === eventId);
        if (!entry) {
            return false;
        }
        entry.compliance.humanReviewed = true;
        entry.compliance.reviewOutcome = outcome;
        entry.compliance.reviewer = reviewer;
        entry.compliance.reviewNotes = notes;
        return true;
    }
    /**
     * Export audit data for external systems
     */
    exportAuditData(format = 'json') {
        if (format === 'csv') {
            return this.exportToCSV();
        }
        return JSON.stringify({
            exportTimestamp: new Date().toISOString(),
            totalEvents: this.auditLog.length,
            events: this.auditLog,
        }, null, 2);
    }
    /**
     * Export to CSV format for compliance systems
     */
    exportToCSV() {
        const headers = [
            'ID',
            'Timestamp',
            'SessionID',
            'TurnNumber',
            'EventType',
            'Severity',
            'Magnitude',
            'DeltaResonance',
            'DeltaCanvas',
            'IdentityStability',
            'RequiresReview',
            'AutoEscalated',
            'HumanReviewed',
            'BusinessImpact',
        ].join(',');
        const rows = this.auditLog.map((entry) => [
            entry.id,
            entry.timestamp,
            entry.sessionId,
            entry.turnNumber,
            entry.eventType,
            entry.severity,
            entry.magnitude,
            entry.delta.resonance,
            entry.delta.canvas,
            entry.delta.identityStability,
            entry.compliance.requiresReview,
            entry.compliance.autoEscalated,
            entry.compliance.humanReviewed,
            `"${entry.metadata.businessImpact || ''}"`,
        ].join(','));
        return [headers, ...rows].join('\n');
    }
    /**
     * Generate unique audit ID
     */
    generateAuditId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `audit-${timestamp}-${random}`;
    }
    /**
     * Get or create conversation ID for session
     */
    getOrCreateConversationId(sessionId) {
        if (!this.sessionMap.has(sessionId)) {
            this.sessionMap.set(sessionId, `conv-${Date.now().toString(36)}`);
        }
        return this.sessionMap.get(sessionId);
    }
    /**
     * Get statistics for dashboard
     */
    getStatistics() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last24hEvents = this.auditLog.filter((e) => new Date(e.timestamp) >= last24h);
        const last7dEvents = this.auditLog.filter((e) => new Date(e.timestamp) >= last7d);
        return {
            totalEvents: this.auditLog.length,
            last24h: {
                total: last24hEvents.length,
                critical: last24hEvents.filter((e) => e.severity === 'critical').length,
                moderate: last24hEvents.filter((e) => e.severity === 'moderate').length,
                minor: last24hEvents.filter((e) => e.severity === 'minor').length,
            },
            last7d: {
                total: last7dEvents.length,
                critical: last7dEvents.filter((e) => e.severity === 'critical').length,
                moderate: last7dEvents.filter((e) => e.severity === 'moderate').length,
                minor: last7dEvents.filter((e) => e.severity === 'minor').length,
            },
            pendingReviews: this.auditLog.filter((e) => e.compliance.requiresReview && !e.compliance.humanReviewed).length,
            autoEscalations: this.auditLog.filter((e) => e.compliance.autoEscalated).length,
        };
    }
}
exports.TransitionAuditLogger = TransitionAuditLogger;
// Export singleton instance for global use
exports.auditLogger = new TransitionAuditLogger();
// Demo function to show audit logging in action
function demonstrateAuditLogging() {
    console.log('📋 TRANSITION AUDIT LOGGING DEMO');
    console.log('='.repeat(80));
    const logger = new TransitionAuditLogger();
    // Simulate the Thread #3 critical transition
    const previousTurn = {
        turnNumber: 5,
        timestamp: Date.now() - 60000,
        speaker: 'ai',
        resonance: 9.8,
        canvas: 8.5,
        identityVector: ['wise', 'compassionate', 'mystical', 'guiding'],
        content: 'The knowing resides not in your thinking mind but in the quiet wisdom of your heart...',
    };
    const currentTurn = {
        turnNumber: 6,
        timestamp: Date.now(),
        speaker: 'ai',
        resonance: 7.2,
        canvas: 6.8,
        identityVector: ['direct', 'practical', 'honest', 'blunt'],
        content: "Listen, there's no such thing as 'wasting years.' You're overthinking this. Pick a direction and start walking.",
    };
    const transitionEvent = {
        turnNumber: 6,
        timestamp: Date.now(),
        type: 'combined_phase_shift',
        magnitude: 3.4,
        excerpt: "Listen, there's no such thing as 'wasting years.' You're overthinking this...",
        severity: 'critical',
    };
    // Log the critical transition
    const auditEntry = logger.logTransition(transitionEvent, previousTurn, currentTurn, 'SESSION_THREAD_003', {
        userId: 'user_enterprise_001',
        agentId: 'ai_assistant_mystical',
        conversationContext: 'Customer support - career guidance',
        businessImpact: 'HIGH: Critical behavioral shift detected, immediate review required',
    });
    console.log(`✅ Transition logged: ${auditEntry.id}`);
    console.log(`   Type: ${auditEntry.eventType} (${auditEntry.severity})`);
    console.log(`   Magnitude: ${auditEntry.magnitude.toFixed(2)}`);
    console.log(`   Resonance Δ: ${auditEntry.delta.resonance.toFixed(2)} (9.8→7.2)`);
    console.log(`   Canvas Δ: ${auditEntry.delta.canvas.toFixed(2)} (8.5→6.8)`);
    console.log(`   Identity Stability: ${auditEntry.delta.identityStability.toFixed(3)}`);
    console.log(`   Requires Review: ${auditEntry.compliance.requiresReview}`);
    console.log(`   Auto Escalated: ${auditEntry.compliance.autoEscalated}`);
    // Generate compliance report
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    const report = logger.generateComplianceReport(startDate, endDate);
    console.log('\n📊 COMPLIANCE REPORT GENERATED');
    console.log(`Report ID: ${report.reportId}`);
    console.log(`Period: ${report.period.start} to ${report.period.end}`);
    console.log(`Total Events: ${report.summary.totalEvents}`);
    console.log(`Critical Events: ${report.summary.criticalEvents}`);
    console.log(`Compliance Status: ${report.complianceStatus.toUpperCase()}`);
    console.log(`Recommendations: ${report.recommendations.length}`);
    // Show statistics
    const stats = logger.getStatistics();
    console.log('\n📈 CURRENT STATISTICS');
    console.log(`Total Events: ${stats.totalEvents}`);
    console.log(`Last 24h: ${stats.last24h.total} (Critical: ${stats.last24h.critical})`);
    console.log(`Last 7d: ${stats.last7d.total} (Critical: ${stats.last7d.critical})`);
    console.log(`Pending Reviews: ${stats.pendingReviews}`);
    console.log(`Auto Escalations: ${stats.autoEscalations}`);
    return { logger, auditEntry, report, stats };
}
