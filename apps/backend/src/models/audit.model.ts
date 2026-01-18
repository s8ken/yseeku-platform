/**
 * Audit Trail Model
 * Tracks all significant user actions and system events for compliance and security
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  timestamp: Date;
  userId: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  outcome: 'success' | 'failure' | 'partial';
  details?: Record<string, any>;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

const AuditLogSchema = new Schema<IAuditLog>({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  userEmail: {
    type: String,
  },
  action: {
    type: String,
    required: true,
    index: true,
    // Examples: 'login', 'logout', 'create_agent', 'delete_conversation', 'update_tenant', etc.
  },
  resourceType: {
    type: String,
    required: true,
    index: true,
    // Examples: 'agent', 'conversation', 'tenant', 'user', 'trust-score', 'receipt', etc.
  },
  resourceId: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
    index: true,
  },
  outcome: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    default: 'success',
    index: true,
  },
  details: {
    type: Schema.Types.Mixed,
    // Additional context about the action (e.g., changed fields, error messages, etc.)
  },
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  sessionId: {
    type: String,
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    // Additional metadata (e.g., request ID, trace ID, etc.)
  },
}, {
  timestamps: false, // We use our own timestamp field
  collection: 'audit_logs',
});

// Compound indexes for common queries
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, resourceType: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, severity: 1, timestamp: -1 });

// TTL index - automatically delete logs older than 90 days (configurable)
AuditLogSchema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    name: 'audit_log_ttl',
  }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
