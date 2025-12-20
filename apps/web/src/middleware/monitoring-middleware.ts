import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@sonate/orchestrate/src/observability/logger';
import {
  recordHttpRequest,
  recordError,
  recordAuthAttempt,
  recordApiKeyValidation
} from '@sonate/orchestrate/src/observability/metrics';

const logger = getLogger('MonitoringMiddleware');

export interface MonitoringMiddlewareOptions {
  logRequests?: boolean;
  logErrors?: boolean;
  recordMetrics?: boolean;
}

export function withMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: MonitoringMiddlewareOptions = {}
) {
  const {
    logRequests = true,
    logErrors = true,
    recordMetrics = true
  } = options;

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const { method, url } = req;
    const route = new URL(url).pathname;

    try {
      // Log incoming request
      if (logRequests) {
        logger.http(`Incoming request: ${method} ${route}`, {
          method,
          route,
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        });
      }

      // Call the actual handler
      const response = await handler(req);

      const duration = (Date.now() - startTime) / 1000; // in seconds

      // Record metrics
      if (recordMetrics) {
        recordHttpRequest(method, route, response.status, duration);
      }

      // Log response
      if (logRequests) {
        logger.http(`Response: ${method} ${route} -> ${response.status}`, {
          method,
          route,
          status: response.status,
          duration: `${duration.toFixed(3)}s`
        });
      }

      return response;

    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      // Record error metrics
      if (recordMetrics) {
        recordHttpRequest(method, route, 500, duration);
        recordError('middleware', 'request_handler');
      }

      // Log error
      if (logErrors) {
        logger.error(`Request failed: ${method} ${route}`, {
          method,
          route,
          error: (error as Error).message,
          stack: (error as Error).stack,
          duration: `${duration.toFixed(3)}s`
        });
      }

      // Return error response
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

// Helper functions for specific monitoring needs
export function logAuthAttempt(success: boolean, userId?: string, method?: string) {
  if (success) {
    recordAuthAttempt('success');
    logger.info('Authentication successful', { userId, method });
  } else {
    recordAuthAttempt('failure');
    logger.warn('Authentication failed', { userId, method });
  }
}

export function logApiKeyValidation(result: 'valid' | 'invalid' | 'expired', keyId?: string) {
  recordApiKeyValidation(result);
  logger.info(`API key validation: ${result}`, { keyId });
}