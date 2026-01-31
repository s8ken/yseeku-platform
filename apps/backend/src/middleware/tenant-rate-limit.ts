/**
 * Tenant-Aware Rate Limiting Middleware
 * 
 * Implements rate limiting with different limits per tenant type:
 * - Demo tenant: Higher limits for showcase purposes
 * - Live tenant: Standard limits for real usage
 * - Default tenant: Standard limits
 * 
 * Also implements endpoint-specific rate limits for sensitive operations.
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Tenant IDs
const DEMO_TENANT_ID = 'demo-tenant';
const LIVE_TENANT_ID = 'live-tenant';

/**
 * Rate limit configurations by tenant type
 */
const TENANT_LIMITS = {
  demo: {
    windowMs: 60 * 1000, // 1 minute
    max: 500, // Higher limit for demos
  },
  live: {
    windowMs: 60 * 1000, // 1 minute
    max: 200, // Standard limit
  },
  default: {
    windowMs: 60 * 1000, // 1 minute
    max: 300, // Default limit
  },
};

/**
 * Endpoint-specific rate limits for sensitive operations
 */
const ENDPOINT_LIMITS: Record<string, { windowMs: number; max: number }> = {
  // Authentication endpoints - stricter limits
  '/api/auth/login': { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15 min
  '/api/auth/register': { windowMs: 60 * 60 * 1000, max: 5 }, // 5 per hour
  '/api/auth/guest': { windowMs: 60 * 1000, max: 30 }, // 30 per minute
  
  // LLM endpoints - moderate limits (expensive operations)
  '/api/llm/generate': { windowMs: 60 * 1000, max: 30 }, // 30 per minute
  '/api/conversations': { windowMs: 60 * 1000, max: 60 }, // 60 per minute
  
  // Trust evaluation - moderate limits
  '/api/trust/evaluate': { windowMs: 60 * 1000, max: 100 }, // 100 per minute
  
  // Overseer endpoints - stricter limits
  '/api/overseer/think': { windowMs: 60 * 1000, max: 10 }, // 10 per minute
  '/api/overseer/actions': { windowMs: 60 * 1000, max: 30 }, // 30 per minute
  
  // Demo endpoints - higher limits
  '/api/demo': { windowMs: 60 * 1000, max: 200 }, // 200 per minute
};

/**
 * Get tenant ID from request
 */
function getTenantId(req: Request): string {
  return req.header('X-Tenant-ID') || (req as any).userTenant || 'default';
}

/**
 * Get rate limit config for tenant
 */
function getTenantConfig(tenantId: string): { windowMs: number; max: number } {
  if (tenantId === DEMO_TENANT_ID) {
    return TENANT_LIMITS.demo;
  }
  if (tenantId === LIVE_TENANT_ID) {
    return TENANT_LIMITS.live;
  }
  return TENANT_LIMITS.default;
}

/**
 * Key generator that includes tenant ID
 */
function tenantKeyGenerator(req: Request): string {
  const tenantId = getTenantId(req);
  const userId = (req as any).userId || 'anonymous';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  // Combine tenant, user, and IP for unique rate limiting
  return `${tenantId}:${userId}:${ip}`;
}

/**
 * Create tenant-aware rate limiter
 */
export function createTenantRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000, // Default 1 minute window
    max: (req: Request) => {
      const tenantId = getTenantId(req);
      const config = getTenantConfig(tenantId);
      return config.max;
    },
    keyGenerator: tenantKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const tenantId = getTenantId(req);
      logger.warn('Rate limit exceeded', {
        tenantId,
        userId: (req as any).userId,
        ip: req.ip,
        path: req.path,
      });
      
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(60), // seconds
      });
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
}

/**
 * Create endpoint-specific rate limiter
 */
export function createEndpointRateLimiter(
  endpoint: string,
  config?: { windowMs: number; max: number }
): RateLimitRequestHandler {
  const endpointConfig = config || ENDPOINT_LIMITS[endpoint] || TENANT_LIMITS.default;
  
  return rateLimit({
    windowMs: endpointConfig.windowMs,
    max: endpointConfig.max,
    keyGenerator: tenantKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Endpoint rate limit exceeded', {
        endpoint,
        tenantId: getTenantId(req),
        userId: (req as any).userId,
        ip: req.ip,
      });
      
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded for ${endpoint}. Please try again later.`,
        retryAfter: Math.ceil(endpointConfig.windowMs / 1000),
      });
    },
  });
}

/**
 * Middleware to apply endpoint-specific rate limits
 */
export function endpointRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Find matching endpoint config
  const matchingEndpoint = Object.keys(ENDPOINT_LIMITS).find(endpoint => 
    req.path.startsWith(endpoint)
  );
  
  if (matchingEndpoint) {
    const limiter = createEndpointRateLimiter(matchingEndpoint);
    limiter(req, res, next);
    return;
  }
  
  next();
}

/**
 * Rate limit info middleware - adds rate limit info to response headers
 */
export function rateLimitInfo(req: Request, res: Response, next: NextFunction): void {
  const tenantId = getTenantId(req);
  const config = getTenantConfig(tenantId);
  
  // Add custom headers with rate limit info
  res.setHeader('X-RateLimit-Tenant', tenantId);
  res.setHeader('X-RateLimit-Limit', config.max.toString());
  
  next();
}

// Export pre-configured limiters for common use cases
export const authRateLimiter = createEndpointRateLimiter('/api/auth/login');
export const llmRateLimiter = createEndpointRateLimiter('/api/llm/generate');
export const trustRateLimiter = createEndpointRateLimiter('/api/trust/evaluate');
export const overseerRateLimiter = createEndpointRateLimiter('/api/overseer/think');

export default createTenantRateLimiter;