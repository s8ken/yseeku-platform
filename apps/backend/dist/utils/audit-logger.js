"use strict";
/**
 * Audit Logging Utility
 * Provides helper functions to log audit events throughout the application
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
exports.extractRequestMetadata = extractRequestMetadata;
exports.logAuditFromRequest = logAuditFromRequest;
exports.logSuccess = logSuccess;
exports.logFailure = logFailure;
exports.logWarning = logWarning;
exports.logSecurityEvent = logSecurityEvent;
const audit_model_1 = require("../models/audit.model");
const logger_1 = __importDefault(require("./logger"));
/**
 * Log an audit event
 */
async function logAudit(params) {
    try {
        const auditLog = {
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
        await audit_model_1.AuditLog.create(auditLog);
        logger_1.default.info('Audit event logged', {
            action: params.action,
            resourceType: params.resourceType,
            resourceId: params.resourceId,
            userId: params.userId,
            tenantId: params.tenantId,
            severity: params.severity,
            outcome: params.outcome,
        });
    }
    catch (error) {
        // Don't let audit logging failures break the application
        logger_1.default.error('Failed to log audit event', {
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
function extractRequestMetadata(req) {
    return {
        ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        sessionId: req.sessionId || req.headers['x-session-id'],
    };
}
/**
 * Helper to log audit from Express request context
 */
async function logAuditFromRequest(req, action, resourceType, resourceId, options) {
    const userId = req.userId || 'system';
    const userEmail = req.userEmail;
    const tenantId = req.userTenant || 'default';
    const { ipAddress, userAgent, sessionId } = extractRequestMetadata(req);
    const mergedDetails = { ...(options?.details || {}), correlationId: req.correlationId };
    await logAudit({
        action,
        resourceType,
        resourceId,
        userId,
        userEmail,
        tenantId,
        severity: options?.severity,
        outcome: options?.outcome,
        details: mergedDetails,
        ipAddress,
        userAgent,
        sessionId,
        metadata: options?.metadata,
    });
}
/**
 * Helper to log successful operations
 */
async function logSuccess(req, action, resourceType, resourceId, details) {
    await logAuditFromRequest(req, action, resourceType, resourceId, {
        severity: 'info',
        outcome: 'success',
        details,
    });
}
/**
 * Helper to log failed operations
 */
async function logFailure(req, action, resourceType, resourceId, error, severity = 'error') {
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
async function logWarning(req, action, resourceType, resourceId, reason, details) {
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
async function logSecurityEvent(req, action, resourceType, resourceId, details) {
    await logAuditFromRequest(req, action, resourceType, resourceId, {
        severity: 'critical',
        outcome: details.blocked ? 'failure' : 'success',
        details,
    });
}
exports.default = {
    logAudit,
    logAuditFromRequest,
    logSuccess,
    logFailure,
    logWarning,
    logSecurityEvent,
    extractRequestMetadata,
};
