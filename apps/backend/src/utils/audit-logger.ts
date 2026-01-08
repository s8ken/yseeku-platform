/**
 * Audit Logging Utility
 * Provides helper functions to log audit events throughout the application
 */

import { Request } from 'express';
import { AuditLog, IAuditLog } from '../models/audit.model';
import logger from './logger';

export type AuditAction =
  // Authentication
  | 'login'
  | 'logout'
  | 'register'
  | 'password_change'
  | 'token_refresh'
  | 'api_key_create'
  | 'api_key_delete'
  // Agent operations
  | 'agent_create'
  | 'agent_update'
  | 'agent_delete'
  | 'agent_connect'
  | 'agent_disconnect'
  // Conversation operations
  | 'conversation_create'
  | 'conversation_update'
  | 'conversation_delete'
  | 'message_send'
  | 'conversation_export'
  // Trust operations
  | 'trust_evaluate'
  | 'receipt_create'
  | 'receipt_verify'
  | 'receipt_revoke'
  // Tenant operations
  | 'tenant_create'
  | 'tenant_update'
  | 'tenant_delete'
  // Risk operations
  | 'risk_event_create'
  | 'risk_event_resolve'
  | 'alert_acknowledge'
  | 'alert_resolve'
  | 'alert_suppress'
  // System operations
  | 'system_health_check'
  | 'metrics_export'
  | 'database_backup'
  | 'config_update'
  // Experiment operations
  | 'experiment_create'
  | 'experiment_update'
  | 'experiment_delete'
  | 'experiment_start'
  | 'experiment_pause'
  | 'experiment_complete';

export type ResourceType =
  | 'user'
  | 'agent'
  | 'conversation'
  | 'message'
  | 'tenant'
  | 'trust-score'
  | 'receipt'
  | 'risk-event'
  | 'alert'
  | 'api-key'
  | 'system'
  | 'experiment';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AuditOutcome = 'success' | 'failure' | 'partial';

export interface AuditLogParams {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  userEmail?: string;
  tenantId: string;
  severity?: AuditSeverity;
  outcome?: AuditOutcome;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const auditLog: Partial<IAuditLog> = {
      timestamp: new Date(),
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      userId: params.userId,
      userEmail: params.userEmail,
      tenantId: params.tenantId,
      severity: params.severity || 'info',
      outcome: params.outcome || 'success',
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
      metadata: params.metadata,
    };

    await AuditLog.create(auditLog);

    logger.info('Audit event logged', {
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      userId: params.userId,
      tenantId: params.tenantId,
      severity: params.severity,
      outcome: params.outcome,
    });
  } catch (error: any) {
    // Don't let audit logging failures break the application
    logger.error('Failed to log audit event', {
      error: error.message,
      stack: error.stack,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
    });
  }
}

/**
 * Extract request metadata for audit logging
 */
export function extractRequestMetadata(req: Request): {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
} {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    sessionId: req.sessionId || req.headers['x-session-id'] as string,
  };
}

/**
 * Helper to log audit from Express request context
 */
export async function logAuditFromRequest(
  req: Request,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  options?: {
    severity?: AuditSeverity;
    outcome?: AuditOutcome;
    details?: Record<string, any>;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const userId = req.userId || 'system';
  const userEmail = req.userEmail;
  const tenantId = req.userTenant || 'default';
  const { ipAddress, userAgent, sessionId } = extractRequestMetadata(req);

  await logAudit({
    action,
    resourceType,
    resourceId,
    userId,
    userEmail,
    tenantId,
    severity: options?.severity,
    outcome: options?.outcome,
    details: options?.details,
    ipAddress,
    userAgent,
    sessionId,
    metadata: options?.metadata,
  });
}

/**
 * Helper to log successful operations
 */
export async function logSuccess(
  req: Request,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditFromRequest(req, action, resourceType, resourceId, {
    severity: 'info',
    outcome: 'success',
    details,
  });
}

/**
 * Helper to log failed operations
 */
export async function logFailure(
  req: Request,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  error: Error | string,
  severity: AuditSeverity = 'error'
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  await logAuditFromRequest(req, action, resourceType, resourceId, {
    severity,
    outcome: 'failure',
    details: {
      error: errorMessage,
      stack: errorStack,
    },
  });
}

/**
 * Helper to log warnings
 */
export async function logWarning(
  req: Request,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditFromRequest(req, action, resourceType, resourceId, {
    severity: 'warning',
    outcome: 'partial',
    details: {
      reason,
      ...details,
    },
  });
}

/**
 * Helper to log critical security events
 */
export async function logSecurityEvent(
  req: Request,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  details: Record<string, any>
): Promise<void> {
  await logAuditFromRequest(req, action, resourceType, resourceId, {
    severity: 'critical',
    outcome: details.blocked ? 'failure' : 'success',
    details,
  });
}

export default {
  logAudit,
  logAuditFromRequest,
  logSuccess,
  logFailure,
  logWarning,
  logSecurityEvent,
  extractRequestMetadata,
};
