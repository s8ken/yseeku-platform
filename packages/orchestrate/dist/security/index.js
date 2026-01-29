"use strict";
/**
 * Security Module - Central Export
 * Provides RBAC, audit logging, rate limiting, and API key management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIKeyManager = exports.getAPIKeyManager = exports.RedisRateLimitStore = exports.InMemoryRateLimitStore = exports.createEndpointRateLimiters = exports.createRateLimiter = exports.DatabaseAuditStorage = exports.InMemoryAuditStorage = exports.auditMiddleware = exports.AuditSeverity = exports.AuditEventType = exports.initializeAuditLogger = exports.getAuditLogger = exports.requireRole = exports.requirePermission = exports.Role = exports.Permission = exports.getRBACManager = void 0;
__exportStar(require("./rbac"), exports);
__exportStar(require("./audit"), exports);
__exportStar(require("./rate-limiter"), exports);
__exportStar(require("./api-keys"), exports);
__exportStar(require("./secrets-manager"), exports);
// Re-export commonly used types and functions
var rbac_1 = require("./rbac");
Object.defineProperty(exports, "getRBACManager", { enumerable: true, get: function () { return rbac_1.getRBACManager; } });
Object.defineProperty(exports, "Permission", { enumerable: true, get: function () { return rbac_1.Permission; } });
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return rbac_1.Role; } });
Object.defineProperty(exports, "requirePermission", { enumerable: true, get: function () { return rbac_1.requirePermission; } });
Object.defineProperty(exports, "requireRole", { enumerable: true, get: function () { return rbac_1.requireRole; } });
var audit_1 = require("./audit");
Object.defineProperty(exports, "getAuditLogger", { enumerable: true, get: function () { return audit_1.getAuditLogger; } });
Object.defineProperty(exports, "initializeAuditLogger", { enumerable: true, get: function () { return audit_1.initializeAuditLogger; } });
Object.defineProperty(exports, "AuditEventType", { enumerable: true, get: function () { return audit_1.AuditEventType; } });
Object.defineProperty(exports, "AuditSeverity", { enumerable: true, get: function () { return audit_1.AuditSeverity; } });
Object.defineProperty(exports, "auditMiddleware", { enumerable: true, get: function () { return audit_1.auditMiddleware; } });
Object.defineProperty(exports, "InMemoryAuditStorage", { enumerable: true, get: function () { return audit_1.InMemoryAuditStorage; } });
Object.defineProperty(exports, "DatabaseAuditStorage", { enumerable: true, get: function () { return audit_1.DatabaseAuditStorage; } });
var rate_limiter_1 = require("./rate-limiter");
Object.defineProperty(exports, "createRateLimiter", { enumerable: true, get: function () { return rate_limiter_1.createRateLimiter; } });
Object.defineProperty(exports, "createEndpointRateLimiters", { enumerable: true, get: function () { return rate_limiter_1.createEndpointRateLimiters; } });
Object.defineProperty(exports, "InMemoryRateLimitStore", { enumerable: true, get: function () { return rate_limiter_1.InMemoryRateLimitStore; } });
Object.defineProperty(exports, "RedisRateLimitStore", { enumerable: true, get: function () { return rate_limiter_1.RedisRateLimitStore; } });
var api_keys_1 = require("./api-keys");
Object.defineProperty(exports, "getAPIKeyManager", { enumerable: true, get: function () { return api_keys_1.getAPIKeyManager; } });
Object.defineProperty(exports, "APIKeyManager", { enumerable: true, get: function () { return api_keys_1.APIKeyManager; } });
