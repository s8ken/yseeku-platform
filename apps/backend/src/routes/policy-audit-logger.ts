/**
 * Policy Audit Logger
 * 
 * Re-exports the audit logger from @sonate/policy for backward compatibility
 */

export {
  PolicyAuditLogger,
  createAuditLogger,
  type AuditLogEntry,
  type ComplianceReport,
  AuditEntryType,
} from '@sonate/policy';
