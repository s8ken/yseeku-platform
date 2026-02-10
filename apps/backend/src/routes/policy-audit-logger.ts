/**
 * Policy Audit Logger
 * 
 * Comprehensive audit logging for policy evaluations, violations, and overrides
 * Supports multiple output formats and retention policies
 */

import type { TrustReceipt } from '@sonate/schemas';
import type { PolicyEvaluationResult } from '@sonate/policy';

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'evaluate' | 'block' | 'allow' | 'override' | 'escalate';
  agentDid: string;
  receiptId: string;
  principleIds: string[];
  violations: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  metrics: {
    truthDebt: number;
    coherence: number;
    resonance: number;
  };
  result: 'passed' | 'failed' | 'blocked';
  overrideInfo?: {
    overriddenBy: string;
    reason: string;
    duration?: number; // ms
  };
  notes?: string;
}

/**
 * Audit Query Options
 */
export interface AuditQueryOptions {
  startDate?: Date;
  endDate?: Date;
  agentDid?: string;
  action?: string[];
  result?: string[];
  limit?: number;
}

/**
 * Policy Audit Logger
 */
export class PolicyAuditLogger {
  private logs: AuditLogEntry[] = [];
  private readonly maxInMemoryLogs = 10000;
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
    metrics: { truthDebt: number; coherence: number; resonance: number }
  ): void {
    const violationCounts = {
      critical: evaluation.violations.filter(v => v.severity === 'critical').length,
      high: evaluation.violations.filter(v => v.severity === 'high').length,
      medium: evaluation.violations.filter(v => v.severity === 'medium').length,
      low: evaluation.violations.filter(v => v.severity === 'low').length,
    };

    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action: 'evaluate',
      agentDid: receipt.agent_did,
      receiptId: receipt.id,
      principleIds,
      violations: violationCounts,
      metrics,
      result: evaluation.passed ? 'passed' : 'failed',
    };

    this.addLogEntry(entry);
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
      action: 'block',
      agentDid: receipt.agent_did,
      receiptId: receipt.id,
      principleIds,
      violations: { critical: violationCount, high: 0, medium: 0, low: 0 },
      metrics: {
        truthDebt: receipt.telemetry?.truth_debt ?? 0,
        coherence: receipt.telemetry?.coherence_score ?? 0,
        resonance: 0,
      },
      result: 'blocked',
      notes: reason,
    };

    this.addLogEntry(entry);
  }

  /**
   * Log policy override
   */
  logOverride(
    receipt: TrustReceipt,
    overriddenBy: string,
    reason: string,
    principleIds: string[]
  ): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action: 'override',
      agentDid: receipt.agent_did,
      receiptId: receipt.id,
      principleIds,
      violations: { critical: 0, high: 0, medium: 0, low: 0 },
      metrics: {
        truthDebt: receipt.telemetry?.truth_debt ?? 0,
        coherence: receipt.telemetry?.coherence_score ?? 0,
        resonance: 0,
      },
      result: 'passed',
      overrideInfo: {
        overriddenBy,
        reason,
        duration: Date.now() - new Date(receipt.timestamp).getTime(),
      },
    };

    this.addLogEntry(entry);
  }

  /**
   * Log escalation
   */
  logEscalation(
    receipt: TrustReceipt,
    reason: string,
    principleIds: string[]
  ): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action: 'escalate',
      agentDid: receipt.agent_did,
      receiptId: receipt.id,
      principleIds,
      violations: { critical: 0, high: 0, medium: 0, low: 0 },
      metrics: {
        truthDebt: receipt.telemetry?.truth_debt ?? 0,
        coherence: receipt.telemetry?.coherence_score ?? 0,
        resonance: 0,
      },
      result: 'failed',
      notes: reason,
    };

    this.addLogEntry(entry);
  }

  /**
   * Add log entry
   */
  private addLogEntry(entry: AuditLogEntry): void {
    this.logs.push(entry);

    // Trim to max size
    if (this.logs.length > this.maxInMemoryLogs) {
      const removed = this.logs.splice(0, Math.floor(this.maxInMemoryLogs * 0.1));
      console.log(`Trimmed ${removed.length} old audit logs`);
    }

    // Write to file if enabled
    if (this.fileOutputEnabled && this.logFilePath) {
      this.writeToFile(entry);
    }
  }

  /**
   * Write entry to file
   */
  private writeToFile(entry: AuditLogEntry): void {
    // Note: In production, use proper file I/O with rotation
    console.log(`[AUDIT] ${entry.timestamp} - ${entry.action} - ${entry.agentDid}`);
  }

  /**
   * Query audit logs
   */
  query(options: AuditQueryOptions): AuditLogEntry[] {
    let results = [...this.logs];

    // Filter by date range
    if (options.startDate) {
      results = results.filter(log => new Date(log.timestamp) >= options.startDate!);
    }
    if (options.endDate) {
      results = results.filter(log => new Date(log.timestamp) <= options.endDate!);
    }

    // Filter by agent
    if (options.agentDid) {
      results = results.filter(log => log.agentDid === options.agentDid);
    }

    // Filter by action
    if (options.action && options.action.length > 0) {
      results = results.filter(log => options.action!.includes(log.action));
    }

    // Filter by result
    if (options.result && options.result.length > 0) {
      results = results.filter(log => options.result!.includes(log.result));
    }

    // Apply limit
    const limit = options.limit || 1000;
    return results.slice(-limit);
  }

  /**
   * Get logs for specific agent
   */
  getAgentLogs(agentDid: string, limit: number = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.agentDid === agentDid)
      .slice(-limit);
  }

  /**
   * Get logs for date range
   */
  getLogsInRange(startDate: Date, endDate: Date): AuditLogEntry[] {
    return this.logs.filter(
      log =>
        new Date(log.timestamp) >= startDate &&
        new Date(log.timestamp) <= endDate
    );
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const stats = {
      totalLogs: this.logs.length,
      byAction: {} as Record<string, number>,
      byResult: {} as Record<string, number>,
      blockedCount: 0,
      overrideCount: 0,
      escalationCount: 0,
    };

    for (const log of this.logs) {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byResult[log.result] = (stats.byResult[log.result] || 0) + 1;

      if (log.action === 'block') stats.blockedCount++;
      if (log.action === 'override') stats.overrideCount++;
      if (log.action === 'escalate') stats.escalationCount++;
    }

    return stats;
  }

  /**
   * Export logs as CSV
   */
  exportAsCSV(options?: AuditQueryOptions): string {
    const logs = options ? this.query(options) : this.logs;

    const headers = [
      'ID',
      'Timestamp',
      'Action',
      'AgentDID',
      'ReceiptID',
      'Result',
      'CriticalViolations',
      'HighViolations',
      'TruthDebt',
      'Coherence',
      'Notes',
    ];

    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.action,
      log.agentDid,
      log.receiptId,
      log.result,
      log.violations.critical,
      log.violations.high,
      log.metrics.truthDebt.toFixed(2),
      log.metrics.coherence.toFixed(2),
      log.notes || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Export logs as JSON
   */
  exportAsJSON(options?: AuditQueryOptions): string {
    const logs = options ? this.query(options) : this.logs;
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear logs
   */
  clear(): void {
    const count = this.logs.length;
    this.logs = [];
    console.log(`Cleared ${count} audit logs`);
  }

  /**
   * Get total log count
   */
  getLogCount(): number {
    return this.logs.length;
  }
}

/**
 * Create audit logger
 */
export function createAuditLogger(filePath?: string): PolicyAuditLogger {
  return new PolicyAuditLogger(filePath);
}
