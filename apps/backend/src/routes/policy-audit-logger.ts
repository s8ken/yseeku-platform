/**
 * Policy Audit Logger
 * 
 * NOTE: This file is disabled - @sonate/policy package not yet available
 * Will be restored when package is ready for production
 */

// Stub types when packages unavailable
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  agentDid: string;
  receiptId: string;
}

export class PolicyAuditLogger {
  constructor() {}
  
  log(entry: AuditLogEntry): void {
    // Disabled
  }
}
