import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/security-utils';

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  headers?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: 'Too many requests, please try again later',
  statusCode: 429,
  headers: true
};

/**
 * In-memory rate limiter - for production, consider using Redis or similar
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupInterval();
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }> {
    const key = this.generateKey(request);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanupStore();
    
    let entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      };
      this.store.set(key, entry);
    }
    
    entry.count++;
    
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const allowed = entry.count <= this.config.maxRequests;
    
    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      reset: entry.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
    };
  }

  /**
   * Apply rate limiting to a request
   */
  async limit(request: NextRequest, response?: NextResponse): Promise<{
    allowed: boolean;
    response?: NextResponse;
  }> {
    const result = await this.checkLimit(request);
    
    if (result.allowed) {
      return { allowed: true };
    }
    
    // Create rate limit response
    const rateLimitResponse = NextResponse.json(
      { 
        success: false, 
        error: {
          message: this.config.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter
        }
      },
      { 
        status: this.config.statusCode,
        headers: this.config.headers ? {
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.reset),
          'Retry-After': String(result.retryAfter || Math.ceil(this.config.windowMs / 1000))
        } : {}
      }
    );
    
    return { allowed: false, response: rateLimitResponse };
  }

  /**
   * Create middleware function for rate limiting
   */
  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.limit(request);
      return result.allowed ? null : result.response!;
    };
  }

  /**
   * Generate rate limit key from request
   */
  private generateKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }
    
    // Default: use IP address
    const ip = getClientIp(request);
    return `rate_limit:${ip}`;
  }

  /**
   * Clean up expired entries from store
   */
  private cleanupStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Start periodic cleanup interval
   */
  private startCleanupInterval(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStore();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get current statistics
   */
  getStats(): {
    totalKeys: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.store.values());
    if (entries.length === 0) {
      return { totalKeys: 0, oldestEntry: null, newestEntry: null };
    }

    const oldestEntry = Math.min(...entries.map(e => e.firstRequest));
    const newestEntry = Math.max(...entries.map(e => e.firstRequest));

    return {
      totalKeys: entries.length,
      oldestEntry,
      newestEntry
    };
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later'
  }),

  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later'
  }),

  // Relaxed rate limiting for read operations
  read: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
    message: 'Too many read requests, please slow down'
  }),

  // Strict rate limiting for write operations
  write: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
    message: 'Too many write requests, please slow down'
  })
};

/**
 * Create a rate limiting middleware with custom configuration
 */
export function createRateLimit(config: Partial<RateLimitConfig> = {}) {
  const limiter = new RateLimiter(config);
  return limiter.middleware();
}

/**
 * Apply rate limiting to a route handler
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: Partial<RateLimitConfig> = {}
) {
  const limiter = new RateLimiter(config);
  
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await limiter.limit(request);
    if (!result.allowed) {
      return result.response!;
    }
    
    try {
      const response = await handler(request);
      
      // Optionally skip rate limiting for successful requests
      if (config.skipSuccessfulRequests) {
        // Remove this request from rate limit count
        const key = limiter['generateKey'](request);
        const entry = limiter['store'].get(key);
        if (entry && entry.count > 0) {
          entry.count--;
        }
      }
      
      return response;
    } catch (error) {
      // Optionally skip rate limiting for failed requests
      if (config.skipFailedRequests) {
        // Remove this request from rate limit count
        const key = limiter['generateKey'](request);
        const entry = limiter['store'].get(key);
        if (entry && entry.count > 0) {
          entry.count--;
        }
      }
      
      throw error;
    }
  };
}
