"use strict";
/**
 * Request Logging Middleware
 * Logs all incoming HTTP requests with timing and metadata
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
exports.requestLogger = requestLogger;
exports.errorLogger = errorLogger;
const uuid_1 = require("uuid");
const logger_1 = __importStar(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
function requestLogger(req, res, next) {
    // Generate unique request ID
    req.requestId = (0, uuid_1.v4)();
    req.startTime = Date.now();
    // Log incoming request
    logger_1.apiLogger.info('Incoming request', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
    });
    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - (req.startTime || 0);
        logger_1.apiLogger.info('Outgoing response', {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        });
        return originalSend.call(this, data);
    };
    next();
}
function errorLogger(err, req, res, next) {
    logger_1.default.error('Request error', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        error: (0, error_utils_1.getErrorMessage)(err),
        stack: err.stack,
        statusCode: err.status || 500,
    });
    next(err);
}
