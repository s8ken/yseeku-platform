"use strict";
/**
 * @sonate/core - Structured Logging Infrastructure
 *
 * Provides Winston-based structured logging for all SONATE packages.
 * Replaces console.log with production-grade logging.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.apiLogger = exports.performanceLogger = exports.securityLogger = exports.logger = exports.LogLevel = void 0;
exports.createLogger = createLogger;
const winston_1 = __importDefault(require("winston"));
// Log levels (in order of severity)
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["HTTP"] = "http";
    LogLevel["VERBOSE"] = "verbose";
    LogLevel["DEBUG"] = "debug";
    LogLevel["SILLY"] = "silly";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// Custom format for development
const developmentFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
}));
// JSON format for production (easily parseable by log aggregators)
const productionFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Determine format based on environment
const logFormat = process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat;
// Create the logger instance
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'sonate-platform',
        environment: process.env.NODE_ENV || 'development',
    },
    transports: [
        // Error logs
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined logs
        new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});
// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: developmentFormat,
    }));
}
else {
    // In production, still log to console for container log aggregation
    exports.logger.add(new winston_1.default.transports.Console({
        format: productionFormat,
    }));
}
/**
 * Create a child logger with additional context
 * @param context - Additional metadata to include in all logs
 */
function createLogger(context) {
    return exports.logger.child(context);
}
/**
 * Security-sensitive logger (for audit trails)
 * Ensures security events are always logged, even if log level is higher
 */
exports.securityLogger = createLogger({ type: 'security' });
/**
 * Performance logger (for metrics and benchmarks)
 */
exports.performanceLogger = createLogger({ type: 'performance' });
/**
 * API logger (for request/response logging)
 */
exports.apiLogger = createLogger({ type: 'api' });
// Export convenience methods
exports.log = {
    error: (message, meta) => exports.logger.error(message, meta),
    warn: (message, meta) => exports.logger.warn(message, meta),
    info: (message, meta) => exports.logger.info(message, meta),
    http: (message, meta) => exports.logger.http(message, meta),
    debug: (message, meta) => exports.logger.debug(message, meta),
    // Security-specific logging (always logs, bypasses level check)
    security: (message, meta) => exports.securityLogger.error(message, { ...meta, _security_event: true }),
    // Performance logging
    performance: (message, meta) => exports.performanceLogger.info(message, meta),
    // API logging
    api: (message, meta) => exports.apiLogger.http(message, meta),
};
// Default export
exports.default = exports.logger;
