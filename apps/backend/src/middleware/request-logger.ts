/**
 * Request Logging Middleware
 * Logs all incoming HTTP requests with timing and metadata
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger, { apiLogger } from '../utils/logger';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Log incoming request
  apiLogger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - (req.startTime || 0);

    apiLogger.info('Outgoing response', {
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

export function errorLogger(err: any, req: Request, res: Response, next: NextFunction): void {
  logger.error('Request error', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    statusCode: err.status || 500,
  });

  next(err);
}
