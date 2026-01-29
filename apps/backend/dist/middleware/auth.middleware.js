"use strict";
/**
 * Authentication Middleware
 * Integrates SecureAuthService from @sonate/core with Express
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
exports.protect = protect;
exports.requireAdmin = requireAdmin;
exports.optionalAuth = optionalAuth;
exports.requireTenant = requireTenant;
const mongoose_1 = __importDefault(require("mongoose"));
const core_1 = require("@sonate/core");
const user_model_1 = require("../models/user.model");
const error_utils_1 = require("../utils/error-utils");
const logger_1 = require("../utils/logger");
// Initialize SecureAuthService
if (!process.env.JWT_SECRET) {
    logger_1.securityLogger.warn('JWT_SECRET is not set. A random secret will be generated, which may cause session invalidation on restart.');
}
const authService = new core_1.SecureAuthService({
    jwtSecret: process.env.JWT_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    saltRounds: 12,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
});
exports.authService = authService;
/**
 * Protect routes - verify JWT token
 */
async function protect(req, res, next) {
    const requestId = req.requestId || Math.random().toString(36).substring(7);
    logger_1.securityLogger.debug('Processing authentication request', { requestId, path: req.path });
    try {
        let token;
        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            logger_1.securityLogger.debug('No token provided', { requestId });
            res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
            return;
        }
        // Verify token using SecureAuthService
        let payload;
        try {
            payload = authService.verifyToken(token);
            logger_1.securityLogger.debug('Token verified', { requestId, username: payload.username || 'unknown' });
        }
        catch (verifyError) {
            const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown error';
            logger_1.securityLogger.warn('Token verification failed', { requestId, error: errorMessage });
            res.status(401).json({
                success: false,
                message: `Token verification failed: ${errorMessage}`,
                code: 'INVALID_TOKEN'
            });
            return;
        }
        const userId = payload.userId || payload.sub;
        const email = payload.email;
        if (!userId) {
            logger_1.securityLogger.warn('Invalid payload: missing userId', { requestId });
            res.status(401).json({
                success: false,
                message: 'Invalid token payload: missing user identifier'
            });
            return;
        }
        // Get user from database (exclude password)
        // First try by ID (if it's a valid MongoDB ObjectId)
        let user;
        if (mongoose_1.default.isValidObjectId(userId)) {
            try {
                user = await user_model_1.User.findById(userId).select('-password');
            }
            catch (dbError) {
                const dbErrorMsg = dbError instanceof Error ? dbError.message : 'Unknown error';
                logger_1.securityLogger.error('DB Error finding user by ID', { requestId, error: dbErrorMsg });
                // Don't fail yet, try by email
            }
        }
        // If not found by ID, try by email (handle users coming from Next.js/Postgres)
        if (!user && email) {
            logger_1.securityLogger.debug('User not found by ID, trying email', { requestId, email });
            try {
                user = await user_model_1.User.findOne({ email }).select('-password');
            }
            catch (dbError) {
                const dbErrorMsg = dbError instanceof Error ? dbError.message : 'Unknown error';
                logger_1.securityLogger.error('DB Error finding user by email', { requestId, error: dbErrorMsg });
            }
            // If still not found, create a shadow user in MongoDB so they can store API keys
            if (!user) {
                logger_1.securityLogger.info('Creating shadow MongoDB user', { requestId, email, userId });
                try {
                    user = await user_model_1.User.create({
                        name: payload.username || payload.name || email.split('@')[0],
                        email: email,
                        password: 'external-auth-no-password-' + Math.random().toString(36),
                        apiKeys: [],
                    });
                    logger_1.securityLogger.info('Shadow user created', { requestId, mongoUserId: user._id });
                }
                catch (createError) {
                    const createErrorMsg = createError instanceof Error ? createError.message : 'Unknown error';
                    logger_1.securityLogger.error('Failed to create shadow user', { requestId, error: createErrorMsg });
                    // Check if user was created by another concurrent request
                    try {
                        user = await user_model_1.User.findOne({ email }).select('-password');
                    }
                    catch (retryError) {
                        const retryErrorMsg = retryError instanceof Error ? retryError.message : 'Unknown error';
                        logger_1.securityLogger.error('Retry find failed', { requestId, error: retryErrorMsg });
                    }
                    if (!user) {
                        // Return 500 here but with JSON
                        res.status(500).json({
                            success: false,
                            message: 'Failed to provision user account',
                            details: createErrorMsg
                        });
                        return;
                    }
                }
            }
        }
        if (!user) {
            logger_1.securityLogger.warn('User not found and could not be provisioned', { requestId });
            res.status(401).json({
                success: false,
                message: 'User not found and could not be provisioned'
            });
            return;
        }
        // Attach user to request
        req.user = user;
        req.userId = user._id.toString();
        req.tenant = payload.tenant || payload.tenant_id || 'default';
        req.userTenant = req.tenant; // Alias for compatibility
        req.userEmail = user.email;
        req.sessionId = payload.session_id || payload.sessionId;
        logger_1.securityLogger.info('Auth successful', { requestId, email: user.email });
        next();
    }
    catch (error) {
        const err = error;
        logger_1.securityLogger.error('Critical auth error', {
            requestId,
            message: (0, error_utils_1.getErrorMessage)(error),
            stack: err?.stack,
            name: err?.name
        });
        // Ensure we always return JSON even for 500s
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: `Authentication middleware error: ${(0, error_utils_1.getErrorMessage)(error)}`,
                error: (0, error_utils_1.getErrorMessage)(error),
                details: err?.stack,
                requestId
            });
        }
    }
}
/**
 * Admin middleware - check if user has admin role
 */
async function requireAdmin(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
        return;
    }
    // Check if user has admin role
    const isAdmin = req.user.role === 'admin' || req.user.email.endsWith('@yseeku.com');
    if (!isAdmin) {
        res.status(403).json({
            success: false,
            message: 'Not authorized as admin'
        });
        return;
    }
    next();
}
/**
 * Optional auth - doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            const payload = authService.verifyToken(token);
            const user = await user_model_1.User.findById(payload.userId).select('-password');
            if (user) {
                req.user = user;
                req.userId = payload.userId;
                req.tenant = payload.tenant;
            }
        }
    }
    catch (error) {
        // Token is invalid, but we continue without user
        req.user = undefined;
    }
    next();
}
/**
 * Tenant isolation middleware
 */
function requireTenant(req, res, next) {
    if (!req.tenant) {
        res.status(400).json({
            success: false,
            message: 'Tenant context required'
        });
        return;
    }
    next();
}
