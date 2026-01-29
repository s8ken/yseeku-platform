"use strict";
/**
 * Structured Logging with Winston
 * Production-grade logging with different transports and formats
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.apiLogger = exports.performanceLogger = exports.securityLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const { combine, timestamp, printf, colorize, json, errors } = winston_1.default.format;
// Custom format for console output (development)
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});
// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
// Create logger instance
const logger = winston_1.default.createLogger({
    level: logLevel,
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
    defaultMeta: { service: 'yseeku-platform' },
    transports: [
        // Console transport for all environments
        new winston_1.default.transports.Console({
            format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), consoleFormat),
        }),
    ],
});
exports.logger = logger;
// Add file transports in production
if (process.env.NODE_ENV === 'production') {
    // Ensure logs directory exists
    const logsDir = path_1.default.join(process.cwd(), 'logs');
    logger.add(new winston_1.default.transports.File({
        filename: path_1.default.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
    logger.add(new winston_1.default.transports.File({
        filename: path_1.default.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
// Create specialized loggers for different concerns
exports.securityLogger = logger.child({ context: 'security' });
exports.performanceLogger = logger.child({ context: 'performance' });
exports.apiLogger = logger.child({ context: 'api' });
exports.default = logger;
