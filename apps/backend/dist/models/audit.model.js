"use strict";
/**
 * Audit Trail Model
 * Tracks all significant user actions and system events for compliance and security
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AuditLogSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed,
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
        type: mongoose_1.Schema.Types.Mixed,
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
AuditLogSchema.index({ timestamp: 1 }, {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    name: 'audit_log_ttl',
});
exports.AuditLog = mongoose_1.default.model('AuditLog', AuditLogSchema);
