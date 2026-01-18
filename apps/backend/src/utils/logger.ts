/**
 * Structured Logging with Winston
 * Production-grade logging with different transports and formats
 */

import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

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
const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'yseeku-platform' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), 'logs');

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create specialized loggers for different concerns
export const securityLogger = logger.child({ context: 'security' });
export const performanceLogger = logger.child({ context: 'performance' });
export const apiLogger = logger.child({ context: 'api' });

export default logger;
