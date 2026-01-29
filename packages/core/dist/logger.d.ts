/**
 * @sonate/core - Structured Logging Infrastructure
 *
 * Provides Winston-based structured logging for all SONATE packages.
 * Replaces console.log with production-grade logging.
 */
import winston from 'winston';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    VERBOSE = "verbose",
    DEBUG = "debug",
    SILLY = "silly"
}
export declare const logger: winston.Logger;
/**
 * Create a child logger with additional context
 * @param context - Additional metadata to include in all logs
 */
export declare function createLogger(context: Record<string, any>): winston.Logger;
/**
 * Security-sensitive logger (for audit trails)
 * Ensures security events are always logged, even if log level is higher
 */
export declare const securityLogger: winston.Logger;
/**
 * Performance logger (for metrics and benchmarks)
 */
export declare const performanceLogger: winston.Logger;
/**
 * API logger (for request/response logging)
 */
export declare const apiLogger: winston.Logger;
export declare const log: {
    error: (message: string, meta?: Record<string, any>) => winston.Logger;
    warn: (message: string, meta?: Record<string, any>) => winston.Logger;
    info: (message: string, meta?: Record<string, any>) => winston.Logger;
    http: (message: string, meta?: Record<string, any>) => winston.Logger;
    debug: (message: string, meta?: Record<string, any>) => winston.Logger;
    security: (message: string, meta?: Record<string, any>) => winston.Logger;
    performance: (message: string, meta?: Record<string, any>) => winston.Logger;
    api: (message: string, meta?: Record<string, any>) => winston.Logger;
};
export default logger;
