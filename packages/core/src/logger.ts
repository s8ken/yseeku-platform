/**
 * @sonate/core - Structured Logging Infrastructure
 *
 * Provides Winston-based structured logging for all SONATE packages.
 * Replaces console.log with production-grade logging.
 */

import winston from 'winston';

// Log levels (in order of severity)
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// JSON format for production (easily parseable by log aggregators)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine format based on environment
const logFormat =
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat;

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'sonate-platform',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
} else {
  // In production, still log to console for container log aggregation
  logger.add(
    new winston.transports.Console({
      format: productionFormat,
    })
  );
}

/**
 * Create a child logger with additional context
 * @param context - Additional metadata to include in all logs
 */
export function createLogger(context: Record<string, any>): winston.Logger {
  return logger.child(context);
}

/**
 * Security-sensitive logger (for audit trails)
 * Ensures security events are always logged, even if log level is higher
 */
export const securityLogger = createLogger({ type: 'security' });

/**
 * Performance logger (for metrics and benchmarks)
 */
export const performanceLogger = createLogger({ type: 'performance' });

/**
 * API logger (for request/response logging)
 */
export const apiLogger = createLogger({ type: 'api' });

// Export convenience methods
export const log = {
  error: (message: string, meta?: Record<string, any>) => logger.error(message, meta),
  warn: (message: string, meta?: Record<string, any>) => logger.warn(message, meta),
  info: (message: string, meta?: Record<string, any>) => logger.info(message, meta),
  http: (message: string, meta?: Record<string, any>) => logger.http(message, meta),
  debug: (message: string, meta?: Record<string, any>) => logger.debug(message, meta),

  // Security-specific logging (always logs, bypasses level check)
  security: (message: string, meta?: Record<string, any>) =>
    securityLogger.error(message, { ...meta, _security_event: true }),

  // Performance logging
  performance: (message: string, meta?: Record<string, any>) =>
    performanceLogger.info(message, meta),

  // API logging
  api: (message: string, meta?: Record<string, any>) =>
    apiLogger.http(message, meta),
};

// Default export
export default logger;
