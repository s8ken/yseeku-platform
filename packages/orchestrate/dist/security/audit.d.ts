/**
 * Comprehensive Audit Logging System
 * Tracks all security-relevant events and user actions
 */
export declare enum AuditEventType {
    AUTH_LOGIN = "auth.login",
    AUTH_LOGOUT = "auth.logout",
    AUTH_FAILED = "auth.failed",
    AUTH_TOKEN_CREATED = "auth.token.created",
    AUTH_TOKEN_REVOKED = "auth.token.revoked",
    AUTHZ_PERMISSION_GRANTED = "authz.permission.granted",
    AUTHZ_PERMISSION_DENIED = "authz.permission.denied",
    AUTHZ_ROLE_ASSIGNED = "authz.role.assigned",
    AUTHZ_ROLE_REVOKED = "authz.role.revoked",
    RESOURCE_CREATED = "resource.created",
    RESOURCE_READ = "resource.read",
    RESOURCE_UPDATED = "resource.updated",
    RESOURCE_DELETED = "resource.deleted",
    AGENT_CREATED = "agent.created",
    AGENT_UPDATED = "agent.updated",
    AGENT_DELETED = "agent.deleted",
    AGENT_EXECUTED = "agent.executed",
    AGENT_FAILED = "agent.failed",
    ORCHESTRA_CREATED = "orchestra.created",
    ORCHESTRA_UPDATED = "orchestra.updated",
    ORCHESTRA_DELETED = "orchestra.deleted",
    ORCHESTRA_STARTED = "orchestra.started",
    ORCHESTRA_STOPPED = "orchestra.stopped",
    SYSTEM_CONFIG_CHANGED = "system.config.changed",
    SYSTEM_STARTED = "system.started",
    SYSTEM_STOPPED = "system.stopped",
    SYSTEM_ERROR = "system.error",
    SECURITY_BREACH_ATTEMPT = "security.breach.attempt",
    SECURITY_RATE_LIMIT_EXCEEDED = "security.rate_limit.exceeded",
    SECURITY_SUSPICIOUS_ACTIVITY = "security.suspicious.activity"
}
export declare enum AuditSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
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
export declare class InMemoryAuditStorage implements AuditStorage {
    private events;
    private maxEvents;
    constructor(maxEvents?: number);
    store(event: AuditEvent): Promise<void>;
    query(query: AuditQuery): Promise<AuditEvent[]>;
    count(query: AuditQuery): Promise<number>;
    export(query: AuditQuery, format: 'json' | 'csv'): Promise<string>;
    clear(): void;
    getAll(): AuditEvent[];
}
/**
 * Database audit storage (for production)
 *
 * REQUIREMENTS FOR WORM COMPLIANCE:
 * 1. The underlying database user must ONLY have INSERT and SELECT permissions.
 * 2. The 'audit_logs' table should be created as an append-only table or use
 *    immutable ledger database features (e.g. AWS QLDB, Azure SQL Ledger).
 * 3. Updates and Deletes must be strictly prohibited at the database level.
 */
export declare class DatabaseAuditStorage implements AuditStorage {
    private db;
    constructor(db: any);
    store(event: AuditEvent): Promise<void>;
    query(query: AuditQuery): Promise<AuditEvent[]>;
    count(query: AuditQuery): Promise<number>;
    export(query: AuditQuery, format: 'json' | 'csv'): Promise<string>;
}
export declare class AuditLogger {
    private storage;
    private logger;
    constructor(storage: AuditStorage);
    /**
     * Log an audit event
     */
    log(eventType: AuditEventType, action: string, outcome: 'success' | 'failure', options?: {
        userId?: string;
        username?: string;
        ipAddress?: string;
        userAgent?: string;
        resourceType?: string;
        resourceId?: string;
        severity?: AuditSeverity;
        details?: Record<string, any>;
        metadata?: Record<string, any>;
    }): Promise<void>;
    /**
     * Query audit logs
     */
    query(query: AuditQuery): Promise<AuditEvent[]>;
    /**
     * Count audit logs matching query
     */
    count(query: AuditQuery): Promise<number>;
    /**
     * Export audit logs
     */
    export(query: AuditQuery, format?: 'json' | 'csv'): Promise<string>;
    private generateId;
    private determineSeverity;
}
export declare function initializeAuditLogger(storage: AuditStorage): AuditLogger;
export declare function getAuditLogger(): AuditLogger;
/**
 * Middleware for Express to automatically log HTTP requests
 */
export declare function auditMiddleware(): (req: any, res: any, next: any) => Promise<void>;
