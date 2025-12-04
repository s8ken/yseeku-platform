/**
 * Comprehensive Audit Logging System
 * Tracks all security-relevant events and user actions
 */

import { Logger } from '../observability/logger';

export enum AuditEventType {
  // Authentication Events
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_FAILED = 'auth.failed',
  AUTH_TOKEN_CREATED = 'auth.token.created',
  AUTH_TOKEN_REVOKED = 'auth.token.revoked',
  
  // Authorization Events
  AUTHZ_PERMISSION_GRANTED = 'authz.permission.granted',
  AUTHZ_PERMISSION_DENIED = 'authz.permission.denied',
  AUTHZ_ROLE_ASSIGNED = 'authz.role.assigned',
  AUTHZ_ROLE_REVOKED = 'authz.role.revoked',
  
  // Resource Events
  RESOURCE_CREATED = 'resource.created',
  RESOURCE_READ = 'resource.read',
  RESOURCE_UPDATED = 'resource.updated',
  RESOURCE_DELETED = 'resource.deleted',
  
  // Agent Events
  AGENT_CREATED = 'agent.created',
  AGENT_UPDATED = 'agent.updated',
  AGENT_DELETED = 'agent.deleted',
  AGENT_EXECUTED = 'agent.executed',
  AGENT_FAILED = 'agent.failed',
  
  // Orchestra Events
  ORCHESTRA_CREATED = 'orchestra.created',
  ORCHESTRA_UPDATED = 'orchestra.updated',
  ORCHESTRA_DELETED = 'orchestra.deleted',
  ORCHESTRA_STARTED = 'orchestra.started',
  ORCHESTRA_STOPPED = 'orchestra.stopped',
  
  // System Events
  SYSTEM_CONFIG_CHANGED = 'system.config.changed',
  SYSTEM_STARTED = 'system.started',
  SYSTEM_STOPPED = 'system.stopped',
  SYSTEM_ERROR = 'system.error',
  
  // Security Events
  SECURITY_BREACH_ATTEMPT = 'security.breach.attempt',
  SECURITY_RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SECURITY_SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  outcome: 'success' | 'failure';
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  severity?: AuditSeverity;
  outcome?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

export interface AuditStorage {
  store(event: AuditEvent): Promise<void>;
  query(query: AuditQuery): Promise<AuditEvent[]>;
  count(query: AuditQuery): Promise<number>;
  export(query: AuditQuery, format: 'json' | 'csv'): Promise<string>;
}

/**
 * In-memory audit storage (for development/testing)
 */
export class InMemoryAuditStorage implements AuditStorage {
  private events: AuditEvent[] = [];
  private maxEvents: number;

  constructor(maxEvents: number = 10000) {
    this.maxEvents = maxEvents;
  }

  async store(event: AuditEvent): Promise<void> {
    this.events.push(event);
    
    // Maintain max size by removing oldest events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  async query(query: AuditQuery): Promise<AuditEvent[]> {
    let filtered = [...this.events];

    // Apply filters
    if (query.startDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= query.startDate!);
    }
    if (query.endDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= query.endDate!);
    }
    if (query.eventTypes && query.eventTypes.length > 0) {
      filtered = filtered.filter(e => query.eventTypes!.includes(e.eventType));
    }
    if (query.userId) {
      filtered = filtered.filter(e => e.userId === query.userId);
    }
    if (query.resourceType) {
      filtered = filtered.filter(e => e.resourceType === query.resourceType);
    }
    if (query.resourceId) {
      filtered = filtered.filter(e => e.resourceId === query.resourceId);
    }
    if (query.severity) {
      filtered = filtered.filter(e => e.severity === query.severity);
    }
    if (query.outcome) {
      filtered = filtered.filter(e => e.outcome === query.outcome);
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return filtered.slice(offset, offset + limit);
  }

  async count(query: AuditQuery): Promise<number> {
    const results = await this.query({ ...query, limit: undefined, offset: undefined });
    return results.length;
  }

  async export(query: AuditQuery, format: 'json' | 'csv'): Promise<string> {
    const events = await this.query({ ...query, limit: undefined, offset: undefined });
    
    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    } else {
      // CSV format
      if (events.length === 0) {
        return '';
      }
      
      const headers = Object.keys(events[0]).join(',');
      const rows = events.map(event => 
        Object.values(event).map(v => 
          typeof v === 'object' ? JSON.stringify(v) : String(v)
        ).join(',')
      );
      
      return [headers, ...rows].join('\n');
    }
  }

  clear(): void {
    this.events = [];
  }

  getAll(): AuditEvent[] {
    return [...this.events];
  }
}

/**
 * Database audit storage (for production)
 */
export class DatabaseAuditStorage implements AuditStorage {
  constructor(private db: any) {}

  async store(event: AuditEvent): Promise<void> {
    // Implementation would depend on your database
    // Example for PostgreSQL:
    await this.db.query(
      `INSERT INTO audit_logs 
       (id, timestamp, event_type, severity, user_id, username, ip_address, 
        user_agent, resource_type, resource_id, action, outcome, details, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        event.id,
        event.timestamp,
        event.eventType,
        event.severity,
        event.userId,
        event.username,
        event.ipAddress,
        event.userAgent,
        event.resourceType,
        event.resourceId,
        event.action,
        event.outcome,
        JSON.stringify(event.details),
        JSON.stringify(event.metadata),
      ]
    );
  }

  async query(query: AuditQuery): Promise<AuditEvent[]> {
    // Build SQL query based on filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(query.startDate);
    }
    if (query.endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(query.endDate);
    }
    if (query.eventTypes && query.eventTypes.length > 0) {
      conditions.push(`event_type = ANY($${paramIndex++})`);
      params.push(query.eventTypes);
    }
    if (query.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(query.userId);
    }
    if (query.resourceType) {
      conditions.push(`resource_type = $${paramIndex++}`);
      params.push(query.resourceType);
    }
    if (query.resourceId) {
      conditions.push(`resource_id = $${paramIndex++}`);
      params.push(query.resourceId);
    }
    if (query.severity) {
      conditions.push(`severity = $${paramIndex++}`);
      params.push(query.severity);
    }
    if (query.outcome) {
      conditions.push(`outcome = $${paramIndex++}`);
      params.push(query.outcome);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = query.limit || 100;
    const offset = query.offset || 0;

    const sql = `
      SELECT * FROM audit_logs 
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async count(query: AuditQuery): Promise<number> {
    // Similar to query but with COUNT(*)
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // ... (same filter building as query method)

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;

    const result = await this.db.query(sql, params);
    return parseInt(result.rows[0].count);
  }

  async export(query: AuditQuery, format: 'json' | 'csv'): Promise<string> {
    const events = await this.query({ ...query, limit: undefined, offset: undefined });
    
    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    } else {
      // CSV format
      if (events.length === 0) {
        return '';
      }
      
      const headers = Object.keys(events[0]).join(',');
      const rows = events.map(event => 
        Object.values(event).map(v => 
          typeof v === 'object' ? JSON.stringify(v) : String(v)
        ).join(',')
      );
      
      return [headers, ...rows].join('\n');
    }
  }
}

export class AuditLogger {
  private storage: AuditStorage;
  private logger = getLogger('AuditLogger');

  constructor(storage: AuditStorage) {
    this.storage = storage;
  }

  /**
   * Log an audit event
   */
  async log(
    eventType: AuditEventType,
    action: string,
    outcome: 'success' | 'failure',
    options: {
      userId?: string;
      username?: string;
      ipAddress?: string;
      userAgent?: string;
      resourceType?: string;
      resourceId?: string;
      severity?: AuditSeverity;
      details?: Record<string, any>;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      eventType,
      severity: options.severity || this.determineSeverity(eventType, outcome),
      userId: options.userId,
      username: options.username,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      action,
      outcome,
      details: options.details,
      metadata: options.metadata,
    };

    try {
      await this.storage.store(event);
      
      // Also log to standard logger for critical events
      if (event.severity === AuditSeverity.CRITICAL || event.severity === AuditSeverity.ERROR) {
        this.logger.warn('Critical audit event', { event });
      }
    } catch (error) {
      this.logger.error('Failed to store audit event', { error, event });
    }
  }

  /**
   * Query audit logs
   */
  async query(query: AuditQuery): Promise<AuditEvent[]> {
    return await this.storage.query(query);
  }

  /**
   * Count audit logs matching query
   */
  async count(query: AuditQuery): Promise<number> {
    return await this.storage.count(query);
  }

  /**
   * Export audit logs
   */
  async export(query: AuditQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    return await this.storage.export(query, format);
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(eventType: AuditEventType, outcome: 'success' | 'failure'): AuditSeverity {
    // Security events are always critical or error
    if (eventType.startsWith('security.')) {
      return outcome === 'failure' ? AuditSeverity.CRITICAL : AuditSeverity.WARNING;
    }

    // Failed authentication is critical
    if (eventType === AuditEventType.AUTH_FAILED) {
      return AuditSeverity.ERROR;
    }

    // System errors are critical
    if (eventType === AuditEventType.SYSTEM_ERROR) {
      return AuditSeverity.CRITICAL;
    }

    // Failed operations are warnings
    if (outcome === 'failure') {
      return AuditSeverity.WARNING;
    }

    // Everything else is info
    return AuditSeverity.INFO;
  }
}

// Singleton instance
let auditLogger: AuditLogger | null = null;

export function initializeAuditLogger(storage: AuditStorage): AuditLogger {
  auditLogger = new AuditLogger(storage);
  return auditLogger;
}

export function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    // Default to in-memory storage if not initialized
    auditLogger = new AuditLogger(new InMemoryAuditStorage());
  }
  return auditLogger;
}

/**
 * Middleware for Express to automatically log HTTP requests
 */
export function auditMiddleware() {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const audit = getAuditLogger();

    // Capture response
    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const outcome = res.statusCode < 400 ? 'success' : 'failure';

      // Log the request
      audit.log(
        AuditEventType.RESOURCE_READ,
        `HTTP ${req.method} ${req.path}`,
        outcome,
        {
          userId: req.user?.id,
          username: req.user?.username,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
          },
        }
      ).catch(err => {
        console.error('Failed to log audit event:', err);
      });

      return originalSend.call(this, data);
    };

    next();
  };
}