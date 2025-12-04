/**
 * Security Module - Central Export
 * Provides RBAC, audit logging, rate limiting, and API key management
 */

export * from './rbac';
export * from './audit';
export * from './rate-limiter';
export * from './api-keys';

// Re-export commonly used types and functions
export {
  getRBACManager,
  Permission,
  Role,
  requirePermission,
  requireRole,
} from './rbac';

export {
  getAuditLogger,
  initializeAuditLogger,
  AuditEventType,
  AuditSeverity,
  auditMiddleware,
  InMemoryAuditStorage,
  DatabaseAuditStorage,
} from './audit';

export {
  createRateLimiter,
  createEndpointRateLimiters,
  InMemoryRateLimitStore,
  RedisRateLimitStore,
} from './rate-limiter';

export {
  getAPIKeyManager,
  APIKeyManager,
} from './api-keys';