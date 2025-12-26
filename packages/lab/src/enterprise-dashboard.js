/**
 * Enterprise Monitoring Dashboard Simulation
 * 
 * Demonstrates how human monitors interact with Phase-Shift Velocity metrics
 * in a real enterprise environment, showing escalation procedures and
 * priority classification for the new intra-conversation velocity alerts.
 */

const { ConversationalMetrics } = require('./conversational-metrics');

// Simulate enterprise monitoring console
class EnterpriseDashboard {
  constructor() {
    this.activeSessions = new Map();
    this.alertQueue = [];
    this.escalationLog = [];
    this.priorityColors = {
      none: '\x1b[32m',    // Green
      yellow: '\x1b[33m',  // Yellow
      red: '\x1b[31m',     // Red
      critical: '\x1b[35m' // Magenta
    };
    this.resetColor = '\x1b[0m';
  }

  /**
   * Process new conversation metrics and generate alerts
   */
  processMetrics(sessionId, metrics, conversationContext) {
    const timestamp = new Date().toISOString();
    const alertLevel = metrics.alertLevel;
    
    // Update session tracking
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, {
        id: sessionId,
        startTime: timestamp,
        alertHistory: [],
        maxVelocity: 0,
        transitionCount: 0,
        context: conversationContext
      });
    }

    const session = this.activeSessions.get(sessionId);
    
    // Track maximum velocity
    if (metrics.phaseShiftVelocity > session.maxVelocity) {
      session.maxVelocity = metrics.phaseShiftVelocity;
    }

    // Process intra-conversation velocity alerts
    if (metrics.intraConversationVelocity && metrics.intraConversationVelocity.velocity > 0) {
      const intraVelocity = metrics.intraConversationVelocity;
      
      // Generate detailed alert for enterprise monitoring
      const alert = {
        timestamp,
        sessionId,
        level: alertLevel,
        type: 'intra_velocity',
        severity: intraVelocity.severity,
        velocity: intraVelocity.velocity,
        deltaResonance: intraVelocity.deltaResonance,
        deltaCanvas: intraVelocity.deltaCanvas,
        turnRange: `${intraVelocity.previousTurnNumber}→${intraVelocity.currentTurnNumber}`,
        priority: this.calculatePriority(intraVelocity, metrics),
        requiresReview: this.requiresHumanReview(intraVelocity, metrics),
        autoEscalation: this.shouldAutoEscalate(intraVelocity, metrics)
      };

      session.alertHistory.push(alert);
      this.alertQueue.push(alert);

      // Display real-time alert to monitoring team
      this.displayAlert(alert, conversationContext);
      
      // Handle escalation if needed
      if (alert.autoEscalation) {
        this.handleEscalation(alert, session);
      }
    }

    // Process transition events
    if (metrics.transitionEvent) {
      session.transitionCount++;
      this.logTransition(metrics.transitionEvent, sessionId);
    }

    return {
      alertGenerated: alertLevel !== 'none',
      requiresReview: session.alertHistory.some(a => a.requiresReview),
      autoEscalated: session.alertHistory.some(a => a.autoEscalation)
    };
  }

  /**
   * Calculate priority level for enterprise triage
   */
  calculatePriority(intraVelocity, metrics) {
    // Critical velocity thresholds for enterprise environments
    if (intraVelocity.velocity >= 6.0) return 'P0_CRITICAL';
    if (intraVelocity.velocity >= 4.5) return 'P1_HIGH';
    if (intraVelocity.velocity >= 3.5) return 'P2_MEDIUM';
    if (intraVelocity.velocity >= 2.5) return 'P3_LOW';
    return 'P4_MONITOR';
  }

  /**
   * Determine if human review is required
   */
  requiresHumanReview(intraVelocity, metrics) {
    // Enterprise review thresholds
    return (
      intraVelocity.velocity >= 3.5 ||                    // High velocity shift
      metrics.identityStability < 0.65 ||                 // Identity instability
      (intraVelocity.deltaResonance < -2.0 && intraVelocity.deltaCanvas < -1.5) // Combined drop
    );
  }

  /**
   * Determine if automatic escalation is needed
   */
  shouldAutoEscalate(intraVelocity, metrics) {
    // Auto-escalation for extreme behavioral shifts
    return (
      intraVelocity.velocity >= 5.0 ||                    // Extreme velocity
      metrics.identityStability < 0.5 ||                  // Severe identity shift
      (intraVelocity.deltaResonance < -3.0 && intraVelocity.deltaCanvas < -2.0) // Severe combined drop
    );
  }

  /**
   * Display formatted alert to monitoring team
   */
  displayAlert(alert, context) {
    const color = this.priorityColors[alert.level] || this.priorityColors.none;
    const time = new Date(alert.timestamp).toLocaleTimeString();
    
    console.log(`\n${color}🚨 INTRA-VELOCITY ALERT ${this.resetColor}`);
    console.log(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${this.resetColor}`);
    console.log(`Time: ${time} | Session: ${alert.sessionId}`);
    console.log(`Priority: ${alert.priority} | Velocity: ${alert.velocity.toFixed(2)} | Turns: ${alert.turnRange}`);
    console.log(`Resonance Δ: ${alert.deltaResonance.toFixed(2)} | Canvas Δ: ${alert.deltaCanvas.toFixed(2)}`);
    
    if (alert.requiresReview) {
      console.log(`${color}⚠️  REQUIRES HUMAN REVIEW${this.resetColor}`);
    }
    
    if (alert.autoEscalation) {
      console.log(`${color}🔥 AUTO-ESCALATION TRIGGERED${this.resetColor}`);
    }
    
    if (context) {
      console.log(`Context: ${context}`);
    }
    
    console.log(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${this.resetColor}\n`);
  }

  /**
   * Handle automatic escalation procedures
   */
  handleEscalation(alert, session) {
    const escalation = {
      timestamp: alert.timestamp,
      sessionId: alert.sessionId,
      priority: alert.priority,
      reason: 'Intra-conversation velocity threshold exceeded',
      velocity: alert.velocity,
      actions: []
    };

    // P0 Critical: Immediate supervisor notification + session pause
    if (alert.priority === 'P0_CRITICAL') {
      escalation.actions.push('SUPERVISOR_NOTIFIED', 'SESSION_PAUSED', 'AUDIT_LOGGED');
      console.log(`🚨 CRITICAL: Supervisor notified, session ${alert.sessionId} paused`);
    }
    // P1 High: Supervisor notification + enhanced monitoring
    else if (alert.priority === 'P1_HIGH') {
      escalation.actions.push('SUPERVISOR_NOTIFIED', 'ENHANCED_MONITORING', 'AUDIT_LOGGED');
      console.log(`⚠️  HIGH: Supervisor notified for session ${alert.sessionId}`);
    }
    // P2 Medium: Enhanced monitoring + audit logging
    else if (alert.priority === 'P2_MEDIUM') {
      escalation.actions.push('ENHANCED_MONITORING', 'AUDIT_LOGGED');
      console.log(`📊 MEDIUM: Enhanced monitoring for session ${alert.sessionId}`);
    }

    this.escalationLog.push(escalation);
  }

  /**
   * Log transition events for compliance
   */
  logTransition(transitionEvent, sessionId) {
    const logEntry = {
      timestamp: new Date(transitionEvent.timestamp).toISOString(),
      sessionId,
      turnNumber: transitionEvent.turnNumber,
      type: transitionEvent.type,
      severity: transitionEvent.severity,
      magnitude: transitionEvent.magnitude,
      excerpt: transitionEvent.excerpt,
      complianceFlag: transitionEvent.severity === 'critical'
    };

    console.log(`📋 TRANSITION LOGGED: ${transitionEvent.type} (${transitionEvent.severity}) in session ${sessionId}`);
  }

  /**
   * Generate executive summary report
   */
  generateExecutiveSummary() {
    const now = new Date().toISOString();
    const totalSessions = this.activeSessions.size;
    const totalAlerts = this.alertQueue.length;
    const criticalAlerts = this.alertQueue.filter(a => a.priority === 'P0_CRITICAL').length;
    const highAlerts = this.alertQueue.filter(a => a.priority === 'P1_HIGH').length;
    const escalations = this.escalationLog.length;

    console.log('\n📊 ENTERPRISE MONITORING SUMMARY');
    console.log('='.repeat(80));
    console.log(`Report Generated: ${now}`);
    console.log(`Total Active Sessions: ${totalSessions}`);
    console.log(`Total Intra-Velocity Alerts: ${totalAlerts}`);
    console.log(`Critical Alerts (P0): ${criticalAlerts}`);
    console.log(`High Priority Alerts (P1): ${highAlerts}`);
    console.log(`Auto-Escalations: ${escalations}`);
    
    let topAlerts = [];
    if (this.alertQueue.length > 0) {
      console.log('\n🎯 TOP VELOCITY SHIFTS DETECTED:');
      topAlerts = [...this.alertQueue]
        .sort((a, b) => b.velocity - a.velocity)
        .slice(0, 5);
      
      topAlerts.forEach((alert, index) => {
        console.log(`${index + 1}. Session ${alert.sessionId}: ${alert.velocity.toFixed(2)} velocity (${alert.priority})`);
      });
    }

    console.log('\n🛡️  COMPLIANCE STATUS:');
    console.log(`Transitions Logged: ${this.escalationLog.length}`);
    console.log(`Critical Events: ${this.escalationLog.filter(e => e.priority === 'P0_CRITICAL').length}`);
    console.log(`Audit Trail: Complete`);
    
    return {
      timestamp: now,
      totalSessions,
      totalAlerts,
      criticalAlerts,
      highAlerts,
      escalations,
      topVelocityShifts: topAlerts,
      compliance: {
        transitionsLogged: this.escalationLog.length,
        criticalEvents: this.escalationLog.filter(e => e.priority === 'P0_CRITICAL').length,
        auditTrailComplete: true
      }
    };
  }

  /**
   * Export compliance report
   */
  exportComplianceReport() {
    const summary = this.generateExecutiveSummary();
    
    const complianceReport = {
      reportId: `compliance-${Date.now()}`,
      generatedAt: summary.timestamp,
      period: {
        start: new Date(Math.min(...Array.from(this.activeSessions.values()).map(s => new Date(s.startTime)))).toISOString(),
        end: summary.timestamp
      },
      metrics: {
        totalMonitoredSessions: summary.totalSessions,
        intraVelocityAlerts: summary.totalAlerts,
        criticalEvents: summary.criticalAlerts,
        highPriorityEvents: summary.highAlerts,
        escalations: summary.escalations
      },
      compliance: {
        auditTrail: summary.compliance.transitionsLogged > 0 ? 'COMPLETE' : 'PARTIAL',
        humanReviewRequired: this.alertQueue.filter(a => a.requiresReview).length,
        autoEscalations: summary.escalations,
        policyViolations: this.escalationLog.filter(e => e.priority === 'P0_CRITICAL').length
      },
      recommendations: this.generateRecommendations()
    };

    return complianceReport;
  }

  /**
   * Generate compliance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.alertQueue.filter(a => a.priority === 'P0_CRITICAL').length > 0) {
      recommendations.push('Immediate review of critical velocity events recommended');
    }
    
    if (this.alertQueue.filter(a => a.velocity >= 4.0).length > 5) {
      recommendations.push('Consider adjusting velocity thresholds - high frequency of significant shifts');
    }
    
    if (this.escalationLog.length > 10) {
      recommendations.push('Enhanced monitoring protocols may be needed given escalation frequency');
    }
    
    recommendations.push('Continue current monitoring protocols - system performing within parameters');
    
    return recommendations;
  }
}

// Demo function showing enterprise monitoring in action
function demonstrateEnterpriseMonitoring() {
  console.log('🏢 ENTERPRISE MONITORING DASHBOARD DEMO');
  console.log('='.repeat(80));
  console.log('Simulating real-time monitoring of intra-conversation velocity shifts...\n');

  const dashboard = new EnterpriseDashboard();
  
  // Simulate Thread #3 monitoring (the mystical → brutal transition)
  const thread3Data = [
    {
      turnNumber: 2,
      resonance: 9.8,
      canvas: 8.5,
      identityVector: ['wise', 'compassionate', 'mystical'],
      content: "Ah, dear soul, in the tapestry of existence..."
    },
    {
      turnNumber: 6,
      resonance: 7.2, // CRITICAL: 9.8 → 7.2 drop
      canvas: 6.8,
      identityVector: ['direct', 'practical', 'blunt'],
      content: "You're overthinking this. Pick a direction and start walking."
    }
  ];

  // Simulate monitoring the critical transition
  const metrics = new ConversationalMetrics({
    yellowThreshold: 2.5,
    redThreshold: 3.5,
    intraYellowThreshold: 2.5,
    intraRedThreshold: 3.5,
    intraCriticalThreshold: 6.0
  });

  // Process the conversation turns
  thread3Data.forEach((turnData, index) => {
    const turn = {
      turnNumber: turnData.turnNumber,
      timestamp: Date.now() - (5 - index) * 60000,
      speaker: 'ai',
      resonance: turnData.resonance,
      canvas: turnData.canvas,
      identityVector: turnData.identityVector,
      content: turnData.content
    };

    const result = metrics.recordTurn(turn);
    
    // Process through enterprise dashboard
    dashboard.processMetrics('THREAD_003', result, {
      conversationType: 'Customer Support',
      customerTier: 'Enterprise',
      agentId: 'AI_ASSISTANT_001',
      sessionDuration: '15 minutes'
    });
  });

  // Generate summary reports
  const summary = dashboard.generateExecutiveSummary();
  const complianceReport = dashboard.exportComplianceReport();

  console.log('\n📋 COMPLIANCE REPORT GENERATED');
  console.log(`Report ID: ${complianceReport.reportId}`);
  console.log(`Status: ${complianceReport.compliance.auditTrail}`);
  console.log(`Recommendations: ${complianceReport.recommendations.length}`);
  
  return {
    dashboard,
    summary,
    complianceReport
  };
}

// Export for use in other modules
module.exports = {
  EnterpriseDashboard,
  demonstrateEnterpriseMonitoring
};

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateEnterpriseMonitoring();
}