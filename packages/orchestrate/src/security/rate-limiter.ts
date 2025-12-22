/**
 * Rate Limiting and Throttling System
 * Protects against abuse and ensures fair resource usage
 */

import { Logger } from '../observability/logger';
import { getAuditLogger, AuditEventType } from './audit';

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  keyGenerator?: (req: any) => string;  // Function to generate rate limit key
  skipSuccessfulRequests?: boolean;     // Don't count successful requests
  skipFailedRequests?: boolean;         // Don't count failed requests
  message?: string;        // Custom error message
  statusCode?: number;     // HTTP status code for rate limit exceeded
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

export interface RateLimitStore {
  increment(key: string): Promise<RateLimitInfo>;
  decrement(key: string): Promise<void>;
  reset(key: string): Promise<void>;
  get(key: string): Promise<RateLimitInfo | null>;
}

/**
 * In-memory rate limit store
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetTime) {
      // Create new entry or reset expired entry
      const resetTime = now + this.config.windowMs;
      this.store.set(key, { count: 1, resetTime });
      
      return {
        limit: this.config.maxRequests,
        current: 1,
        remaining: this.config.maxRequests - 1,
        resetTime: new Date(resetTime),
      };
    }

    // Increment existing entry
    entry.count++;
    this.store.set(key, entry);

    return {
      limit: this.config.maxRequests,
      current: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: new Date(entry.resetTime),
    };
  }

  async decrement(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
      this.store.set(key, entry);
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetTime) {
      return null;
    }

    return {
      limit: this.config.maxRequests,
      current: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: new Date(entry.resetTime),
    };
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now >= entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }
}

/**
 * Redis-based rate limit store (for distributed systems)
 */
export class RedisRateLimitStore implements RateLimitStore {
  private redis: any;
  private config: RateLimitConfig;

  constructor(redis: any, config: RateLimitConfig) {
    this.redis = redis;
    this.config = config;
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Use Redis sorted set to track requests in time window
    const multi = this.redis.multi();
    
    // Remove old entries outside the window
    multi.zremrangebyscore(redisKey, 0, windowStart);
    
    // Add current request
    multi.zadd(redisKey, now, `${now}-${Math.random()}`);
    
    // Count requests in window
    multi.zcard(redisKey);
    
    // Set expiry
    multi.expire(redisKey, Math.ceil(this.config.windowMs / 1000));

    const results = await multi.exec();
    const count = results[2][1]; // Get count from zcard result

    return {
      limit: this.config.maxRequests,
      current: count,
      remaining: Math.max(0, this.config.maxRequests - count),
      resetTime: new Date(now + this.config.windowMs),
    };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `ratelimit:${key}`;
    // Remove the most recent entry
    await this.redis.zpopmax(redisKey);
  }

  async reset(key: string): Promise<void> {
    const redisKey = `ratelimit:${key}`;
    await this.redis.del(redisKey);
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old entries and count
    await this.redis.zremrangebyscore(redisKey, 0, windowStart);
    const count = await this.redis.zcard(redisKey);

    if (count === 0) {
      return null;
    }

    return {
      limit: this.config.maxRequests,
      current: count,
      remaining: Math.max(0, this.config.maxRequests - count),
      resetTime: new Date(now + this.config.windowMs),
    };
  }
}

export class RateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;
  private logger = new Logger('RateLimiter');

  constructor(store: RateLimitStore, config: RateLimitConfig) {
    this.store = store;
    this.config = {
      statusCode: 429,
      message: 'Too many requests, please try again later.',
      ...config,
    };
  }

  /**
   * Check if a request should be rate limited
   */
  async checkLimit(key: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const info = await this.store.increment(key);
    const allowed = info.current <= info.limit;

    if (!allowed) {
      this.logger.warn('Rate limit exceeded', { key, info });
      
      // Log to audit
      const audit = getAuditLogger();
      await audit.log(
        AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        'failure',
        {
          details: { key, ...info },
          severity: 'warning' as any,
        }
      );
    }

    return { allowed, info };
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    await this.store.reset(key);
  }

  /**
   * Get current rate limit info for a key
   */
  async getInfo(key: string): Promise<RateLimitInfo | null> {
    return await this.store.get(key);
  }

  /**
   * Express middleware for rate limiting
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        // Generate rate limit key
        const key = this.config.keyGenerator 
          ? this.config.keyGenerator(req)
          : this.defaultKeyGenerator(req);

        // Check rate limit
        const { allowed, info } = await this.checkLimit(key);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', info.limit);
        res.setHeader('X-RateLimit-Remaining', info.remaining);
        res.setHeader('X-RateLimit-Reset', info.resetTime.toISOString());

        if (!allowed) {
          return res.status(this.config.statusCode!).json({
            error: 'Rate Limit Exceeded',
            message: this.config.message,
            retryAfter: info.resetTime,
          });
        }

        // Handle skip options
        const originalSend = res.send;
        res.send = (data: any) => {
          const shouldDecrement = 
            (this.config.skipSuccessfulRequests && res.statusCode < 400) ||
            (this.config.skipFailedRequests && res.statusCode >= 400);

          if (shouldDecrement) {
            this.store.decrement(key).catch(err => {
              this.logger.error('Failed to decrement rate limit', { error: err });
            });
          }

          return originalSend.call(res, data);
        };

        next();
      } catch (error) {
        this.logger.error('Rate limiter error', { error });
        next(); // Allow request on error
      }
    };
  }

  private defaultKeyGenerator(req: any): string {
    // Use IP address as default key
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }
}

/**
 * Create a rate limiter with common presets
 */
export function createRateLimiter(
  preset: 'strict' | 'moderate' | 'lenient' | 'custom',
  customConfig?: Partial<RateLimitConfig>
): RateLimiter {
  let config: RateLimitConfig;

  switch (preset) {
    case 'strict':
      config = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        ...customConfig,
      };
      break;
    case 'moderate':
      config = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 500,
        ...customConfig,
      };
      break;
    case 'lenient':
      config = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        ...customConfig,
      };
      break;
    case 'custom':
      if (!customConfig) {
        throw new Error('Custom config required for custom preset');
      }
      config = customConfig as RateLimitConfig;
      break;
  }

  const store = new InMemoryRateLimitStore(config);
  return new RateLimiter(store, config);
}

/**
 * Create rate limiters for different endpoints
 */
export function createEndpointRateLimiters() {
  return {
    // Authentication endpoints - strict
    auth: createRateLimiter('strict', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      keyGenerator: (req: any) => `auth:${req.ip}`,
    }),

    // API endpoints - moderate
    api: createRateLimiter('moderate', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 500,
      keyGenerator: (req: any) => `api:${req.user?.id || req.ip}`,
    }),

    // Public endpoints - lenient
    public: createRateLimiter('lenient', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 1000,
      keyGenerator: (req: any) => `public:${req.ip}`,
    }),

    // Admin endpoints - very strict
    admin: createRateLimiter('strict', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 50,
      keyGenerator: (req: any) => `admin:${req.user?.id || req.ip}`,
    }),
  };
}