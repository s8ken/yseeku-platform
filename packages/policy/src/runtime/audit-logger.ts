/**
 * Policy Audit Logger & Compliance Reporting
 * 
 * Complete audit trail for policy decisions and compliance reporting
 */

import type { TrustReceipt } from '@sonate/schemas';
import type { PolicyEvaluationResult } from '../types';

/**
 * Audit Entry Types
 */
export enum AuditEntryType {
  POLICY_EVALUATION = 'policy_evaluation',
  POLICY_BLOCK = 'policy_block',
  POLICY_ALLOW = 'policy_allow',
  POLICY_ANNOTATE = 'policy_annotate',
  OVERRIDE_CREATED = 'override_created',
  OVERRIDE_USED = 'override_used',
  OVERRIDE_REVOKED = 'override_revoked',
  ALERT_CREATED = 'alert_created',
  ALERT_ACKNOWLEDGED = 'alert_acknowledged',
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  entryType: AuditEntryType;
  
  // Identifiers
  receiptId: string;
  agentDid: string;
  actor?: string; // Who performed the action
  
  // Policy info
  principleIds: string[];
  violations: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  
  // Decision
  decision: 'blocked' | 'allowed' | 'annotated' | 'escalated';
  reason?: string;
  
  // Metrics snapshot
  metrics?: {
    truthDebt: number;
    coherence: number;
    resonance: number;
  };
  
  // Additional context
  metadata?: Record<string, any>;
}

/**
 * Compliance Report
 */
export interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
  
  summary: {
    totalEvaluations: number;
    totalBlocks: number;
    totalAllows: number;
    totalAnnotations: number;
    blockRate: number;
    averageDecisionTimeMs: number;
  };
  
  byPrinciple: Record<string, {
    evaluations: number;
    violations: number;
    violationRate: number;
  }>;
  
  bySeverity: Record<string, number>;
  
  topViolatingAgents: Array<{
    agentDid: string;
    violationCount: number;
    blockCount: number;
  }>;
  
  topViolatedRules: Array<{
    ruleId: string;
    violationCount: number;
  }>;
  
  overrideUsage: {
    totalCreated: number;
    totalUsed: number;
    averageUsesPerOverride: number;
  };
}

/**
 * Policy Audit Logger
 */
export class PolicyAuditLogger {
  private entries: AuditLogEntry[] = [];
  private readonly maxEntries = 100000;
  private fileOutputEnabled = false;
  private logFilePath?: string;

  constructor(fileOutputPath?: string) {
    if (fileOutputPath) {
      this.logFilePath = fileOutputPath;
      this.fileOutputEnabled = true;
    }
  }

  /**
   * Log policy evaluation
   */
  logEvaluation(
    receipt: TrustReceipt,
    evaluation: PolicyEvaluationResult,
    principleIds: string[],
    metrics?: { truthDebt: number; coherence: number; resonance: number }
  ): void {
    const violationCounts = {
      total: evaluation.violations.length,
      critical: evaluation.violations.filter(v => v.severity === 'critical').length,
      high: evaluation.violations.filter(v => v.severity === 'high').length,
      medium: evaluation.violations.filter(v => v.severity === 'medium').length,
      low: evaluation.violations.filter(v => v.severity === 'low').length,
    };

    const decision = evaluation.passed ? 'allowed' : 'blocked';

    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      entryType: decision === 'blocked' ? AuditEntryType.POLICY_BLOCK : AuditEntryType.POLICY_ALLOW,
      receiptId: receipt.id,
      agentDid: receipt.agent_did,
      principleIds,
      violations: violationCounts,
      decision,
      metrics,
    };

    this.addEntry(entry);
  }

  /**
   * Log policy block
   */
  logBlock(
    receipt: TrustReceipt,
    reason: string,
    principleIds: string[],
    violationCount: number
  ): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      entryType: AuditEntryType.POLICY_BLOCK,
      receiptId: receipt.id,
      agentDid: receipt.agent_did,
      principleIds,
      violations: {
        total: violationCount,
        critical: violationCount,
        high: 0,
        medium: 0,
        low: 0,
      },
      decision: 'blocked',
      reason,
    };

    this.addEntry(entry);
  }

  /**
   * Log override creation
   */
  logOverrideCreated(
    receiptId: string,
    agentDid: string,
    authorizedBy: string,
    reason: string,
    principleIds: string[]
  ): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      entryType: AuditEntryType.OVERRIDE_CREATED,
      receiptId,
      agentDid,
      actor: authorizedBy,
      principleIds,
      violations: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      decision: 'allowed',
      reason,
    };

    this.addEntry(entry);
  }

  /**
   * Log override revocation
   */
  logOverrideRevoked(
    overrideId: string,
    agentDid: string,
    revokedBy: string,
    reason: string
  ): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      entryType: AuditEntryType.OVERRIDE_REVOKED,
      receiptId: overrideId,
      agentDid,
      actor: revokedBy,
      principleIds: [],
      violations: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      decision: 'blocked',
      reason,
    };

    this.addEntry(entry);
  }

  /**
   * Log alert
   */
  logAlert(
    receiptId: string,
    agentDid: string,
    alertId: string,
    violationCount: number
  ): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      entryType: AuditEntryType.ALERT_CREATED,
      receiptId,
      agentDid,
      principleIds: [],
      violations: {
        total: violationCount,
        critical: violationCount,
        high: 0,
        medium: 0,
        low: 0,
      },
      decision: 'blocked',
      metadata: { alertId },
    };

    this.addEntry(entry);
  }

  /**
   * Add entry to audit log
   */
  private addEntry(entry: AuditLogEntry): void {
    this.entries.push(entry);

    // Trim if necessary
    if (this.entries.length > this.maxEntries) {
      const removed = this.entries.splice(0, Math.floor(this.maxEntries * 0.1));
      console.log(`[AuditLogger] Trimmed ${removed.length} old entries`);
    }

    // Write to file if enabled
    if (this.fileOutputEnabled && this.logFilePath) {
      this.writeToFile(entry);
    }
  }

  /**
   * Write to file
   */
  private writeToFile(entry: AuditLogEntry): void {
    // In production, use proper file I/O with rotation
    console.log(
      `[AUDIT] ${entry.timestamp} - ${entry.entryType} - ${entry.agentDid} - ${entry.decision}`
    );
  }

  /**
   * Query audit log
   */
  query(options: {
    startDate?: Date;
    endDate?: Date;
    agentDid?: string;
    entryType?: AuditEntryType;
    decision?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let results = [...this.entries];

    if (options.startDate) {
      results = results.filter(e => new Date(e.timestamp) >= options.startDate!);
    }

    if (options.endDate) {
      results = results.filter(e => new Date(e.timestamp) <= options.endDate!);
    }

    if (options.agentDid) {
      results = results.filter(e => e.agentDid === options.agentDid);
    }

    if (options.entryType) {
      results = results.filter(e => e.entryType === options.entryType);
    }

    if (options.decision) {
      results = results.filter(e => e.decision === options.decision);
    }

    const limit = options.limit || 1000;
    return results.slice(-limit);
  }

  /**
   * Generate compliance report
   */
  generateReport(startDate: Date, endDate: Date): ComplianceReport {
    const entries = this.query({ startDate, endDate });

    const summary = {
      totalEvaluations: entries.filter(
        e =>
          e.entryType === AuditEntryType.POLICY_EVALUATION ||
          e.entryType === AuditEntryType.POLICY_BLOCK ||
          e.entryType === AuditEntryType.POLICY_ALLOW
      ).length,
      totalBlocks: entries.filter(e => e.decision === 'blocked').length,
      totalAllows: entries.filter(e => e.decision === 'allowed').length,
      totalAnnotations: entries.filter(e => e.decision === 'annotated').length,
      blockRate: 0,
      averageDecisionTimeMs: 0,
    };

    summary.blockRate =
      summary.totalEvaluations > 0
        ? summary.totalBlocks / summary.totalEvaluations
        : 0;

    const byPrinciple: Record<string, any> = {};
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    const agentViolations: Record<string, { violations: number; blocks: number }> = {};

    for (const entry of entries) {
      // By principle
      for (const principle of entry.principleIds) {
        if (!byPrinciple[principle]) {
          byPrinciple[principle] = {
            evaluations: 0,
            violations: 0,
            violationRate: 0,
          };
        }
        byPrinciple[principle].evaluations++;
        byPrinciple[principle].violations += entry.violations.total;
      }

      // By severity
      bySeverity.critical += entry.violations.critical;
      bySeverity.high += entry.violations.high;
      bySeverity.medium += entry.violations.medium;
      bySeverity.low += entry.violations.low;

      // By agent
      if (!agentViolations[entry.agentDid]) {
        agentViolations[entry.agentDid] = { violations: 0, blocks: 0 };
      }
      agentViolations[entry.agentDid].violations += entry.violations.total;
      if (entry.decision === 'blocked') {
        agentViolations[entry.agentDid].blocks++;
      }
    }

    // Calculate violation rates
    for (const principle in byPrinciple) {
      byPrinciple[principle].violationRate =
        byPrinciple[principle].evaluations > 0
          ? byPrinciple[principle].violations / byPrinciple[principle].evaluations
          : 0;
    }

    // Top violating agents
    const topViolatingAgents = Object.entries(agentViolations)
      .map(([agentDid, stats]) => ({
        agentDid,
        violationCount: stats.violations,
        blockCount: stats.blocks,
      }))
      .sort((a, b) => b.violationCount - a.violationCount)
      .slice(0, 10);

    return {
      reportId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary,
      byPrinciple,
      bySeverity,
      topViolatingAgents,
      topViolatedRules: [], // TODO: Implement
      overrideUsage: {
        totalCreated: entries.filter(e => e.entryType === AuditEntryType.OVERRIDE_CREATED).length,
        totalUsed: entries.filter(e => e.entryType === AuditEntryType.OVERRIDE_USED).length,
        averageUsesPerOverride: 0, // TODO: Calculate
      },
    };
  }

  /**
   * Export as CSV
   */
  exportAsCSV(options?: any): string {
    const entries = options ? this.query(options) : this.entries;

    const headers = [
      'Timestamp',
      'Entry Type',
      'Receipt ID',
      'Agent DID',
      'Decision',
      'Total Violations',
      'Critical',
      'High',
      'Medium',
      'Low',
      'Reason',
    ];

    const rows = entries.map(e => [
      e.timestamp,
      e.entryType,
      e.receiptId,
      e.agentDid,
      e.decision,
      e.violations.total,
      e.violations.critical,
      e.violations.high,
      e.violations.medium,
      e.violations.low,
      e.reason || '',
    ]);

    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join(
      '\n'
    );
  }

  /**
   * Export as JSON
   */
  exportAsJSON(options?: any): string {
    const entries = options ? this.query(options) : this.entries;
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const total = this.entries.length;
    const byType: Record<string, number> = {};
    const byDecision: Record<string, number> = { blocked: 0, allowed: 0, annotated: 0, escalated: 0 };

    for (const entry of this.entries) {
      byType[entry.entryType] = (byType[entry.entryType] || 0) + 1;
      byDecision[entry.decision] = (byDecision[entry.decision] || 0) + 1;
    }

    return {
      total,
      byType,
      byDecision,
      oldestEntry: this.entries[0]?.timestamp,
      newestEntry: this.entries[this.entries.length - 1]?.timestamp,
    };
  }

  /**
   * Clear log
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Get entry count
   */
  getCount(): number {
    return this.entries.length;
  }
}

/**
 * Create audit logger
 */
export function createAuditLogger(filePath?: string): PolicyAuditLogger {
  return new PolicyAuditLogger(filePath);
}
