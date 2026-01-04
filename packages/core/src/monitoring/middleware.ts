/**
 * @sonate/core - HTTP Monitoring Middleware
 *
 * Express middleware for tracking HTTP requests and responses.
 */

import { Request, Response, NextFunction } from 'express';
import {
  httpRequestsTotal,
  httpRequestDurationHistogram,
  httpRequestSizeHistogram,
  httpResponseSizeHistogram,
} from './metrics';
import { apiLogger } from '../logger';

/**
 * Prometheus metrics middleware
 *
 * Tracks request count, duration, and sizes for all HTTP requests.
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Record request size
    const requestSize = parseInt(req.get('content-length') || '0', 10);
    if (requestSize > 0) {
      httpRequestSizeHistogram.observe(
        { method: req.method, route: req.route?.path || req.path },
        requestSize
      );
    }

    // Capture original res.end to record metrics after response
    const originalEnd = res.end.bind(res);

    res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
      // Calculate duration
      const duration = (Date.now() - startTime) / 1000; // seconds

      // Get status code
      const statusCode = res.statusCode;

      // Get route (use path if route not available)
      const route = req.route?.path || req.path;

      // Increment request counter
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code: statusCode.toString(),
      });

      // Record request duration
      httpRequestDurationHistogram.observe(
        { method: req.method, route, status_code: statusCode.toString() },
        duration
      );

      // Record response size if available
      const responseSize = parseInt(res.get('content-length') || '0', 10);
      if (responseSize > 0) {
        httpResponseSizeHistogram.observe(
          { method: req.method, route },
          responseSize
        );
      }

      // Log API request
      apiLogger.http(`${req.method} ${route}`, {
        method: req.method,
        path: req.path,
        route,
        status_code: statusCode,
        duration_ms: duration * 1000,
        request_size: requestSize,
        response_size: responseSize,
        user_agent: req.get('user-agent'),
        ip: req.ip,
      });

      // Call original end
      return originalEnd(chunk, encoding, callback);
    };

    next();
  };
}

/**
 * Error tracking middleware
 *
 * Should be used as Express error handler (after all other middleware).
 */
export function errorTrackingMiddleware() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Log error
    apiLogger.error('HTTP request error', {
      method: req.method,
      path: req.path,
      error: err.message,
      stack: err.stack,
      user_agent: req.get('user-agent'),
      ip: req.ip,
    });

    // Increment error counter
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: '500',
    });

    next(err);
  };
}

/**
 * Request ID middleware
 *
 * Adds a unique request ID to each request for tracing.
 */
export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.get('x-request-id') || generateRequestId();

    // Add to request
    (req as any).requestId = requestId;

    // Add to response headers
    res.setHeader('x-request-id', requestId);

    next();
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Combined monitoring middleware
 *
 * Includes metrics, request ID, and error tracking.
 */
export function monitoringMiddleware() {
  return [
    requestIdMiddleware(),
    metricsMiddleware(),
  ];
}
