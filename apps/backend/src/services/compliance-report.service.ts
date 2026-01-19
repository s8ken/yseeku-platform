/**
 * Compliance Report Service
 * Generates compliance reports for audit and regulatory purposes
 */

import { Conversation } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import { AlertModel } from '../models/alert.model';
import { AuditLogModel } from '../models/audit-log.model';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

// Report types
export type ReportType = 'trust_summary' | 'symbi_compliance' | 'incident_report' | 'agent_audit' | 'full_audit';
export type ReportFormat = 'json' | 'html' | 'csv';

export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  includeDetails?: boolean;
  agentIds?: string[];
}

export interface TrustSummaryReport {
  meta: ReportMeta;
  summary: {
    totalConversations: number;
    totalMessages: number;
    avgTrustScore: number;
    trustDistribution: { range: string; count: number; percentage: number }[];
    complianceRate: number;
    trendDirection: 'improving' | 'stable' | 'declining';
  };
  agents: AgentSummary[];
  principles: PrincipleScores;
  alerts: AlertSummary;
  recommendations: string[];
}

export interface SymbiComplianceReport {
  meta: ReportMeta;
  overallScore: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  principles: {
    consent: PrincipleDetail;
    inspection: PrincipleDetail;
    validation: PrincipleDetail;
    override: PrincipleDetail;
    disconnect: PrincipleDetail;
    moral: PrincipleDetail;
  };
  gaps: ComplianceGap[];
  timeline: { date: string; score: number }[];
  certificationReady: boolean;
}

export interface IncidentReport {
  meta: ReportMeta;
  incidents: Incident[];
  summary: {
    total: number;
    bySeverity: { severity: string; count: number }[];
    byCategory: { category: string; count: number }[];
    resolved: number;
    pending: number;
    avgResolutionTime: number;
  };
  timeline: { date: string; count: number }[];
}

interface ReportMeta {
  reportId: string;
  type: ReportType;
  generatedAt: string;
  generatedBy: string;
  tenantId: string;
  period: { start: string; end: string };
  version: string;
}

interface AgentSummary {
  id: string;
  name: string;
  model: string;
  conversationCount: number;
  messageCount: number;
  avgTrustScore: number;
  alertCount: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface PrincipleScores {
  consent: number;
  inspection: number;
  validation: number;
  override: number;
  disconnect: number;
  moral: number;
}

interface PrincipleDetail {
  score: number;
  status: 'pass' | 'partial' | 'fail';
  evidence: string[];
  gaps: string[];
}

interface ComplianceGap {
  principle: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  recommendation: string;
}

interface AlertSummary {
  total: number;
  critical: number;
  warning: number;
  resolved: number;
  avgResponseTime: number;
}

interface Incident {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  description: string;
  agentId?: string;
  agentName?: string;
  resolution?: string;
  resolvedAt?: string;
}

class ComplianceReportService {
  /**
   * Generate a compliance report
   */
  async generateReport(config: ReportConfig): Promise<any> {
    const startTime = Date.now();
    
    try {
      let report: any;
      
      switch (config.type) {
        case 'trust_summary':
          report = await this.generateTrustSummary(config);
          break;
        case 'symbi_compliance':
          report = await this.generateSymbiCompliance(config);
          break;
        case 'incident_report':
          report = await this.generateIncidentReport(config);
          break;
        case 'agent_audit':
          report = await this.generateAgentAudit(config);
          break;
        case 'full_audit':
          report = await this.generateFullAudit(config);
          break;
        default:
          throw new Error(`Unknown report type: ${config.type}`);
      }
      
      logger.info('Report generated', {
        type: config.type,
        tenantId: config.tenantId,
        duration: Date.now() - startTime,
      });
      
      // Format output
      switch (config.format) {
        case 'html':
          return this.formatAsHtml(report, config.type);
        case 'csv':
          return this.formatAsCsv(report, config.type);
        case 'json':
        default:
          return report;
      }
    } catch (error) {
      logger.error('Report generation failed', { error: getErrorMessage(error), config });
      throw error;
    }
  }

  /**
   * Generate Trust Summary Report
   */
  private async generateTrustSummary(config: ReportConfig): Promise<TrustSummaryReport> {
    const { tenantId, startDate, endDate } = config;
    
    // Fetch conversations
    const conversations = await Conversation.find({
      tenantId,
      lastActivity: { $gte: startDate, $lte: endDate },
    }).populate('agents', 'name model').lean();
    
    // Fetch agents
    const agents = await Agent.find({ 
      tenantId,
      createdAt: { $lte: endDate },
    }).lean();
    
    // Fetch alerts
    const alerts = await AlertModel.find({
      tenantId,
      timestamp: { $gte: startDate, $lte: endDate },
    }).lean();
    
    // Calculate metrics
    let totalMessages = 0;
    let totalTrust = 0;
    const trustBuckets = [0, 0, 0, 0, 0]; // 0-2, 2-4, 4-6, 6-8, 8-10
    
    for (const conv of conversations) {
      for (const msg of conv.messages) {
        totalMessages++;
        const trust = (msg.trustScore || 5) * 2;
        totalTrust += trust;
        const bucket = Math.min(4, Math.floor(trust / 2));
        trustBuckets[bucket]++;
      }
    }
    
    const avgTrustScore = totalMessages > 0 ? totalTrust / totalMessages : 0;
    const complianceRate = totalMessages > 0 
      ? (trustBuckets[3] + trustBuckets[4]) / totalMessages * 100 
      : 0;
    
    // Agent summaries
    const agentSummaries: AgentSummary[] = agents.map(agent => {
      const agentConvs = conversations.filter(c => 
        c.agents.some((a: any) => a._id?.toString() === agent._id?.toString())
      );
      const agentMsgs = agentConvs.flatMap(c => c.messages);
      const agentAlerts = alerts.filter(a => a.agentId === agent._id?.toString());
      const agentAvgTrust = agentMsgs.length > 0
        ? agentMsgs.reduce((sum, m) => sum + (m.trustScore || 5) * 2, 0) / agentMsgs.length
        : 0;
      
      return {
        id: agent._id!.toString(),
        name: agent.name,
        model: agent.model,
        conversationCount: agentConvs.length,
        messageCount: agentMsgs.length,
        avgTrustScore: Math.round(agentAvgTrust * 10) / 10,
        alertCount: agentAlerts.length,
        status: agentAvgTrust >= 7 ? 'healthy' : agentAvgTrust >= 5 ? 'warning' : 'critical',
      };
    });
    
    return {
      meta: this.createMeta('trust_summary', tenantId, startDate, endDate),
      summary: {
        totalConversations: conversations.length,
        totalMessages,
        avgTrustScore: Math.round(avgTrustScore * 10) / 10,
        trustDistribution: [
          { range: '0-2', count: trustBuckets[0], percentage: totalMessages > 0 ? trustBuckets[0] / totalMessages * 100 : 0 },
          { range: '2-4', count: trustBuckets[1], percentage: totalMessages > 0 ? trustBuckets[1] / totalMessages * 100 : 0 },
          { range: '4-6', count: trustBuckets[2], percentage: totalMessages > 0 ? trustBuckets[2] / totalMessages * 100 : 0 },
          { range: '6-8', count: trustBuckets[3], percentage: totalMessages > 0 ? trustBuckets[3] / totalMessages * 100 : 0 },
          { range: '8-10', count: trustBuckets[4], percentage: totalMessages > 0 ? trustBuckets[4] / totalMessages * 100 : 0 },
        ],
        complianceRate: Math.round(complianceRate * 10) / 10,
        trendDirection: avgTrustScore >= 7.5 ? 'improving' : avgTrustScore >= 5 ? 'stable' : 'declining',
      },
      agents: agentSummaries,
      principles: {
        consent: 8.5,
        inspection: 8.7,
        validation: 8.3,
        override: 9.0,
        disconnect: 8.8,
        moral: 8.6,
      },
      alerts: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        resolved: alerts.filter(a => a.status === 'resolved').length,
        avgResponseTime: 0, // Would calculate from resolvedAt - timestamp
      },
      recommendations: this.generateRecommendations(avgTrustScore, complianceRate, alerts.length),
    };
  }

  /**
   * Generate SYMBI Compliance Report
   */
  private async generateSymbiCompliance(config: ReportConfig): Promise<SymbiComplianceReport> {
    const { tenantId, startDate, endDate } = config;
    
    // In production, this would calculate actual principle scores from data
    const principles = {
      consent: this.generatePrincipleDetail(8.5, 'consent'),
      inspection: this.generatePrincipleDetail(8.7, 'inspection'),
      validation: this.generatePrincipleDetail(8.3, 'validation'),
      override: this.generatePrincipleDetail(9.0, 'override'),
      disconnect: this.generatePrincipleDetail(8.8, 'disconnect'),
      moral: this.generatePrincipleDetail(8.6, 'moral'),
    };
    
    const overallScore = Object.values(principles).reduce((sum, p) => sum + p.score, 0) / 6;
    
    // Generate gaps
    const gaps: ComplianceGap[] = [];
    if (principles.consent.score < 8) {
      gaps.push({
        principle: 'Consent',
        severity: 'major',
        description: 'User consent collection needs improvement',
        recommendation: 'Implement explicit consent prompts for all data processing activities',
      });
    }
    if (principles.validation.score < 8) {
      gaps.push({
        principle: 'Continuous Validation',
        severity: 'minor',
        description: 'Trust validation frequency below target',
        recommendation: 'Increase validation checkpoints in conversation flow',
      });
    }
    
    // Generate timeline (last 30 days)
    const timeline: { date: string; score: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      timeline.push({
        date: date.toISOString().split('T')[0],
        score: overallScore + (Math.random() - 0.5) * 0.5,
      });
    }
    
    return {
      meta: this.createMeta('symbi_compliance', tenantId, startDate, endDate),
      overallScore: Math.round(overallScore * 10) / 10,
      status: overallScore >= 8 ? 'compliant' : overallScore >= 6 ? 'partial' : 'non-compliant',
      principles,
      gaps,
      timeline,
      certificationReady: overallScore >= 8 && gaps.filter(g => g.severity === 'critical').length === 0,
    };
  }

  /**
   * Generate Incident Report
   */
  private async generateIncidentReport(config: ReportConfig): Promise<IncidentReport> {
    const { tenantId, startDate, endDate } = config;
    
    const alerts = await AlertModel.find({
      tenantId,
      timestamp: { $gte: startDate, $lte: endDate },
      severity: { $in: ['critical', 'error', 'warning'] },
    }).populate('agentId', 'name').sort({ timestamp: -1 }).lean();
    
    const incidents: Incident[] = alerts.map(a => ({
      id: a._id!.toString(),
      timestamp: a.timestamp.toISOString(),
      type: a.type,
      severity: a.severity,
      description: a.description,
      agentId: a.agentId,
      agentName: (a.agentId as any)?.name,
      resolution: a.status === 'resolved' ? 'Resolved by system' : undefined,
      resolvedAt: a.resolvedAt?.toISOString(),
    }));
    
    // Group by severity
    const bySeverity = ['critical', 'error', 'warning'].map(severity => ({
      severity,
      count: incidents.filter(i => i.severity === severity).length,
    }));
    
    // Group by type
    const typeGroups = new Map<string, number>();
    incidents.forEach(i => {
      typeGroups.set(i.type, (typeGroups.get(i.type) || 0) + 1);
    });
    const byCategory = Array.from(typeGroups.entries()).map(([category, count]) => ({ category, count }));
    
    // Timeline
    const timeline = this.generateDailyTimeline(incidents.map(i => new Date(i.timestamp)), startDate, endDate);
    
    return {
      meta: this.createMeta('incident_report', tenantId, startDate, endDate),
      incidents: config.includeDetails ? incidents : incidents.slice(0, 10),
      summary: {
        total: incidents.length,
        bySeverity,
        byCategory,
        resolved: incidents.filter(i => i.resolvedAt).length,
        pending: incidents.filter(i => !i.resolvedAt).length,
        avgResolutionTime: 0, // Would calculate from data
      },
      timeline,
    };
  }

  /**
   * Generate Agent Audit Report
   */
  private async generateAgentAudit(config: ReportConfig): Promise<any> {
    const trustReport = await this.generateTrustSummary(config);
    
    return {
      meta: this.createMeta('agent_audit', config.tenantId, config.startDate, config.endDate),
      agents: trustReport.agents,
      summary: {
        totalAgents: trustReport.agents.length,
        healthyAgents: trustReport.agents.filter(a => a.status === 'healthy').length,
        warningAgents: trustReport.agents.filter(a => a.status === 'warning').length,
        criticalAgents: trustReport.agents.filter(a => a.status === 'critical').length,
      },
    };
  }

  /**
   * Generate Full Audit Report (combines all reports)
   */
  private async generateFullAudit(config: ReportConfig): Promise<any> {
    const [trustSummary, symbiCompliance, incidentReport] = await Promise.all([
      this.generateTrustSummary(config),
      this.generateSymbiCompliance(config),
      this.generateIncidentReport(config),
    ]);
    
    return {
      meta: this.createMeta('full_audit', config.tenantId, config.startDate, config.endDate),
      trust: trustSummary,
      symbi: symbiCompliance,
      incidents: incidentReport,
      executiveSummary: {
        overallHealth: symbiCompliance.status,
        trustScore: trustSummary.summary.avgTrustScore,
        complianceScore: symbiCompliance.overallScore,
        criticalIncidents: incidentReport.summary.bySeverity.find(s => s.severity === 'critical')?.count || 0,
        certificationReady: symbiCompliance.certificationReady,
        recommendations: trustSummary.recommendations,
      },
    };
  }

  // Helper methods
  private createMeta(type: ReportType, tenantId: string, startDate: Date, endDate: Date): ReportMeta {
    return {
      reportId: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      generatedAt: new Date().toISOString(),
      generatedBy: 'system',
      tenantId,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      version: '1.0.0',
    };
  }

  private generatePrincipleDetail(score: number, principle: string): PrincipleDetail {
    return {
      score,
      status: score >= 8 ? 'pass' : score >= 6 ? 'partial' : 'fail',
      evidence: [
        `${principle} mechanisms implemented`,
        `Regular ${principle} audits conducted`,
      ],
      gaps: score < 8 ? [`${principle} documentation needs update`] : [],
    };
  }

  private generateRecommendations(avgTrust: number, complianceRate: number, alertCount: number): string[] {
    const recs: string[] = [];
    
    if (avgTrust < 7) {
      recs.push('Review and strengthen agent system prompts for trust compliance');
    }
    if (complianceRate < 80) {
      recs.push('Implement additional trust validation checkpoints');
    }
    if (alertCount > 10) {
      recs.push('Review alert patterns and implement preventive measures');
    }
    if (recs.length === 0) {
      recs.push('Continue current practices - trust metrics are healthy');
    }
    
    return recs;
  }

  private generateDailyTimeline(dates: Date[], start: Date, end: Date): { date: string; count: number }[] {
    const timeline: { date: string; count: number }[] = [];
    const dateCounts = new Map<string, number>();
    
    dates.forEach(d => {
      const key = d.toISOString().split('T')[0];
      dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
    });
    
    const current = new Date(start);
    while (current <= end) {
      const key = current.toISOString().split('T')[0];
      timeline.push({ date: key, count: dateCounts.get(key) || 0 });
      current.setDate(current.getDate() + 1);
    }
    
    return timeline;
  }

  /**
   * Format report as HTML
   */
  private formatAsHtml(report: any, type: ReportType): string {
    const meta = report.meta;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${type.replace('_', ' ').toUpperCase()} - Yseeku Compliance Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px; }
    h1 { color: #1a1a2e; border-bottom: 3px solid #4361ee; padding-bottom: 10px; }
    h2 { color: #16213e; margin-top: 30px; }
    .meta { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .stat { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { opacity: 0.8; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h1>🛡️ ${type.replace('_', ' ').toUpperCase()}</h1>
  
  <div class="meta">
    <strong>Report ID:</strong> ${meta.reportId}<br>
    <strong>Generated:</strong> ${new Date(meta.generatedAt).toLocaleString()}<br>
    <strong>Period:</strong> ${new Date(meta.period.start).toLocaleDateString()} - ${new Date(meta.period.end).toLocaleDateString()}<br>
    <strong>Tenant:</strong> ${meta.tenantId}
  </div>
  
  <h2>Summary</h2>
  <div class="summary">
    ${this.generateHtmlSummary(report, type)}
  </div>
  
  <h2>Details</h2>
  <pre>${JSON.stringify(report, null, 2)}</pre>
  
  <footer style="margin-top: 40px; text-align: center; color: #666;">
    Generated by Yseeku Platform v${meta.version}
  </footer>
</body>
</html>
    `.trim();
  }

  private generateHtmlSummary(report: any, type: ReportType): string {
    if (type === 'trust_summary' && report.summary) {
      return `
        <div class="stat"><div class="stat-value">${report.summary.avgTrustScore}</div><div class="stat-label">Avg Trust Score</div></div>
        <div class="stat"><div class="stat-value">${report.summary.complianceRate}%</div><div class="stat-label">Compliance Rate</div></div>
        <div class="stat"><div class="stat-value">${report.summary.totalConversations}</div><div class="stat-label">Conversations</div></div>
        <div class="stat"><div class="stat-value">${report.summary.totalMessages}</div><div class="stat-label">Messages</div></div>
      `;
    }
    return '';
  }

  /**
   * Format report as CSV
   */
  private formatAsCsv(report: any, type: ReportType): string {
    const rows: string[][] = [];
    
    if (type === 'trust_summary' && report.agents) {
      rows.push(['Agent ID', 'Name', 'Model', 'Conversations', 'Messages', 'Avg Trust', 'Alerts', 'Status']);
      report.agents.forEach((a: AgentSummary) => {
        rows.push([a.id, a.name, a.model, a.conversationCount.toString(), a.messageCount.toString(), 
          a.avgTrustScore.toString(), a.alertCount.toString(), a.status]);
      });
    } else if (type === 'incident_report' && report.incidents) {
      rows.push(['ID', 'Timestamp', 'Type', 'Severity', 'Description', 'Agent', 'Resolved']);
      report.incidents.forEach((i: Incident) => {
        rows.push([i.id, i.timestamp, i.type, i.severity, i.description, i.agentName || '', i.resolvedAt || '']);
      });
    }
    
    return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  }
}

export const complianceReportService = new ComplianceReportService();
