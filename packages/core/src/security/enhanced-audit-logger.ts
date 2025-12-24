/**
 * Enhanced Audit Logging System
 * Comprehensive audit trail for security, compliance, and debugging
 */

import { supabase } from '../supabase';

export enum AuditEventType {
  // Authentication Events
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_LOGIN_FAILED = 'auth.login_failed',
  AUTH_MFA_ENABLED = 'auth.mfa_enabled',
  AUTH_MFA_DISABLED = 'auth.mfa_disabled',
  AUTH_MFA_VERIFIED = 'auth.mfa_verified',
  AUTH_PASSWORD_CHANGED = 'auth.password_changed',
  AUTH_PASSWORD_RESET = 'auth.password_reset',
  
  // Authorization Events
  AUTHZ_PERMISSION_GRANTED = 'authz.permission_granted',
  AUTHZ_PERMISSION_DENIED = 'authz.permission_denied',
  AUTHZ_ROLE_ASSIGNED = 'authz.role_assigned',
  AUTHZ_ROLE_REMOVED = 'authz.role_removed',
  
  // Data Access Events
  DATA_READ = 'data.read',
  DATA_CREATE = 'data.create',
  DATA_UPDATE = 'data.update',
  DATA_DELETE = 'data.delete',
  DATA_EXPORT = 'data.export',
  
  // API Events
  API_REQUEST = 'api.request',
  API_ERROR = 'api.error',
  API_RATE_LIMIT = 'api.rate_limit',
  API_KEY_CREATED = 'api.key_created',
  API_KEY_REVOKED = 'api.key_revoked',
  
  // Configuration Events
  CONFIG_CHANGED = 'config.changed',
  SETTINGS_UPDATED = 'settings.updated',
  
  // Security Events
  SECURITY_BREACH_ATTEMPT = 'security.breach_attempt',
  SECURITY_SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  SECURITY_IP_BLOCKED = 'security.ip_blocked',
  
  // Compliance Events
  COMPLIANCE_DATA_ACCESSED = 'compliance.data_accessed',
  COMPLIANCE_DATA_DELETED = 'compliance.data_deleted',
  COMPLIANCE_EXPORT = 'compliance.export',
  
  // System Events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
  SYSTEM_STARTUP = 'system.startup',
  SYSTEM_SHUTDOWN = 'system.shutdown'
}

export enum AuditSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditEvent {
  id?: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  action: string;
  result: 'success' | 'failure' | 'partial';
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  correlationId?: string;
  parentEventId?: string;
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  userId?: string;
  organizationId?: string;
  severity?: AuditSeverity[];
  result?: ('success' | 'failure' | 'partial')[];
  resource?: string;
  limit?: number;
  offset?: number;
}

export class EnhancedAuditLogger {
  private correlationId: string | null = null;
  private sessionId: string | null = null;

  /**
   * Set correlation ID for tracking related events
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Set session ID for tracking user sessions
   */
  setSessionId(id: string): void {
    this.sessionId = id;
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date(),
      correlationId: event.correlationId || this.correlationId || undefined,
      sessionId: event.sessionId || this.sessionId || undefined
    };

    try {
      // Store in database
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: auditEvent.eventType,
          severity: auditEvent.severity,
          user_id: auditEvent.userId,
          organization_id: auditEvent.organizationId,
          session_id: auditEvent.sessionId,
          ip_address: auditEvent.ipAddress,
          user_agent: auditEvent.userAgent,
          resource: auditEvent.resource,
          resource_id: auditEvent.resourceId,
          action: auditEvent.action,
          result: auditEvent.result,
          details: auditEvent.details,
          metadata: auditEvent.metadata,
          correlation_id: auditEvent.correlationId,
          parent_event_id: auditEvent.parentEventId,
          created_at: auditEvent.timestamp.toISOString()
        });

      if (error) {
        console.error('Failed to log audit event:', error);
      }

      // For critical events, also log to external system
      if (auditEvent.severity === AuditSeverity.CRITICAL) {
        await this.logToCriticalSystem(auditEvent);
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    eventType: AuditEventType,
    userId: string | undefined,
    result: 'success' | 'failure',
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      eventType,
      severity: result === 'failure' ? AuditSeverity.WARNING : AuditSeverity.INFO,
      userId,
      ipAddress,
      userAgent,
      action: eventType,
      result,
      details
    });
  }

  /**
   * Log authorization event
   */
  async logAuthz(
    eventType: AuditEventType,
    userId: string,
    resource: string,
    action: string,
    result: 'success' | 'failure',
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: result === 'failure' ? AuditSeverity.WARNING : AuditSeverity.INFO,
      userId,
      resource,
      action,
      result,
      details
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    eventType: AuditEventType,
    userId: string,
    resource: string,
    resourceId: string,
    action: string,
    result: 'success' | 'failure',
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: AuditSeverity.INFO,
      userId,
      resource,
      resourceId,
      action,
      result,
      details
    });
  }

  /**
   * Log API request
   */
  async logAPIRequest(
    userId: string | undefined,
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.API_REQUEST,
      severity: statusCode >= 500 ? AuditSeverity.ERROR : AuditSeverity.INFO,
      userId,
      ipAddress,
      userAgent,
      resource: path,
      action: method,
      result: statusCode < 400 ? 'success' : 'failure',
      details: {
        statusCode,
        duration
      }
    });
  }

  /**
   * Log security event
   */
  async logSecurity(
    eventType: AuditEventType,
    userId: string | undefined,
    action: string,
    details: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      eventType,
      severity: AuditSeverity.CRITICAL,
      userId,
      ipAddress,
      action,
      result: 'failure',
      details
    });
  }

  /**
   * Log compliance event
   */
  async logCompliance(
    eventType: AuditEventType,
    userId: string,
    resource: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: AuditSeverity.INFO,
      userId,
      resource,
      action,
      result: 'success',
      details
    });
  }

  /**
   * Query audit logs
   */
  async query(query: AuditQuery): Promise<AuditEvent[]> {
    let dbQuery = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (query.startDate) {
      dbQuery = dbQuery.gte('created_at', query.startDate.toISOString());
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('created_at', query.endDate.toISOString());
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      dbQuery = dbQuery.in('event_type', query.eventTypes);
    }

    if (query.userId) {
      dbQuery = dbQuery.eq('user_id', query.userId);
    }

    if (query.organizationId) {
      dbQuery = dbQuery.eq('organization_id', query.organizationId);
    }

    if (query.severity && query.severity.length > 0) {
      dbQuery = dbQuery.in('severity', query.severity);
    }

    if (query.result && query.result.length > 0) {
      dbQuery = dbQuery.in('result', query.result);
    }

    if (query.resource) {
      dbQuery = dbQuery.eq('resource', query.resource);
    }

    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit);
    }

    if (query.offset) {
      dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 100) - 1);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      timestamp: new Date(row.created_at),
      eventType: row.event_type,
      severity: row.severity,
      userId: row.user_id,
      organizationId: row.organization_id,
      sessionId: row.session_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      resource: row.resource,
      resourceId: row.resource_id,
      action: row.action,
      result: row.result,
      details: row.details,
      metadata: row.metadata,
      correlationId: row.correlation_id,
      parentEventId: row.parent_event_id
    }));
  }

  /**
   * Get audit statistics
   */
  async getStatistics(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    failureRate: number;
  }> {
    const events = await this.query({
      startDate,
      endDate,
      organizationId
    });

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    let failures = 0;

    events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      if (event.result === 'failure') {
        failures++;
      }
    });

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      failureRate: events.length > 0 ? failures / events.length : 0
    };
  }

  /**
   * Log to critical event system (e.g., PagerDuty, Slack)
   */
  private async logToCriticalSystem(event: AuditEvent): Promise<void> {
    // Implementation would send to external alerting system
    console.error('CRITICAL AUDIT EVENT:', event);
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(
    query: AuditQuery,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const events = await this.query(query);

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    } else {
      // CSV export
      const headers = [
        'timestamp',
        'eventType',
        'severity',
        'userId',
        'action',
        'result',
        'resource',
        'ipAddress'
      ];
      
      const rows = events.map(event => [
        event.timestamp.toISOString(),
        event.eventType,
        event.severity,
        event.userId || '',
        event.action,
        event.result,
        event.resource || '',
        event.ipAddress || ''
      ]);

      return [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    }
  }
}

export const auditLogger = new EnhancedAuditLogger();