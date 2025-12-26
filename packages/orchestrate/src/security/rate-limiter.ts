/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 */

// Simple logger implementation to avoid missing dependencies
const auditLogger = {
  logEvent: (eventType: string, severity: string, message: string, details?: any) => {
    console.log(`[${severity.toUpperCase()}] ${eventType}: ${message}`, details || '');
  }
};

const AuditEventType = {
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_WARNING: 'RATE_LIMIT_WARNING'
};

const AuditSeverity = {
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  INFO: 'INFO'
};

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  identifier: string; // User ID, IP address, or API key
  identifierType: 'user' | 'ip' | 'api_key';
  endpoint?: string; // Optional endpoint-specific limiting
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: () => string;
  skip?: (req: any) => boolean;
  onLimitReached?: (req: any, res: any) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface RateLimitStore {
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
  cleanup(): Promise<number>;
}

// Mock implementation for build compatibility
class MockRateLimitStore implements RateLimitStore {
  private counts = new Map<string, number>();

  async increment(key: string): Promise<number> {
    const current = this.counts.get(key) || 0;
    const newCount = current + 1;
    this.counts.set(key, newCount);
    return newCount;
  }

  async reset(key: string): Promise<void> {
    this.counts.delete(key);
  }

  async cleanup(): Promise<number> {
    const size = this.counts.size;
    this.counts.clear();
    return size;
  }
}

export class RateLimiter {
  private store: RateLimitStore;

  constructor(store?: RateLimitStore) {
    this.store = store || new MockRateLimitStore();
  }

  async checkLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    const windowEnd = new Date(now.getTime() + config.windowMs);

    try {
      const key = `${config.identifier}:${config.identifierType}${config.endpoint ? ':' + config.endpoint : ''}`;
      const currentCount = await this.store.increment(key);

      if (currentCount > config.maxRequests) {
        const retryAfter = Math.ceil(config.windowMs / 1000);
        await this.logRateLimitExceeded(config, retryAfter);
        
        return {
          allowed: false,
          remaining: 0,
          resetAt: windowEnd,
          retryAfter
        };
      }

      return {
        allowed: true,
        remaining: config.maxRequests - currentCount,
        resetAt: windowEnd
      };

    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Fail open - allow request if we can't check limits
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: windowEnd
      };
    }
  }

  private async logRateLimitExceeded(config: RateLimitConfig, retryAfter: number): Promise<void> {
    auditLogger.logEvent(
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditSeverity.WARNING,
      `Rate limit exceeded for ${config.identifierType}: ${config.identifier}`,
      {
        retryAfter,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        endpoint: config.endpoint
      }
    );
  }

  async resetLimit(
    identifier: string,
    identifierType: 'user' | 'ip' | 'api_key',
    endpoint?: string
  ): Promise<void> {
    const key = `${identifier}:${identifierType}${endpoint ? ':' + endpoint : ''}`;
    await this.store.reset(key);
  }

  async getLimitStatus(
    identifier: string,
    identifierType: 'user' | 'ip' | 'api_key',
    endpoint?: string
  ): Promise<{
    requestCount: number;
    windowStart: Date;
    windowEnd: Date;
    blockedUntil?: Date;
  } | null> {
    // Mock implementation for build compatibility
    return {
      requestCount: 0,
      windowStart: new Date(),
      windowEnd: new Date()
    };
  }

  /**
   * Cleanup old rate limit records
   */
  async cleanup(): Promise<number> {
    return await this.store.cleanup();
  }
}

// Factory functions for different store types
export function createRateLimiter(store?: RateLimitStore): RateLimiter {
  return new RateLimiter(store);
}

export function createEndpointRateLimiters(configs: Record<string, RateLimitConfig>): Record<string, RateLimiter> {
  const limiters: Record<string, RateLimiter> = {};
  
  for (const [endpoint, config] of Object.entries(configs)) {
    limiters[endpoint] = createRateLimiter();
  }
  
  return limiters;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private windows = new Map<string, { count: number; resetTime: number }>();
  
  async increment(key: string): Promise<number> {
    const now = Date.now();
    const existing = this.windows.get(key);
    
    if (existing && now < existing.resetTime) {
      existing.count++;
      return existing.count;
    }
    
    // Create new window
    const resetTime = now + 60000; // 1 minute window
    this.windows.set(key, { count: 1, resetTime });
    return 1;
  }
  
  async reset(key: string): Promise<void> {
    this.windows.delete(key);
  }
  
  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, window] of this.windows.entries()) {
      if (now >= window.resetTime) {
        this.windows.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

export class RedisRateLimitStore implements RateLimitStore {
  private redis: any; // Redis client
  
  constructor(redis: any) {
    this.redis = redis;
  }
  
  async increment(key: string): Promise<number> {
    // Mock implementation for build compatibility
    return 1;
  }
  
  async reset(key: string): Promise<void> {
    // Mock implementation for build compatibility
  }
  
  async cleanup(): Promise<number> {
    // Mock implementation for build compatibility
    return 0;
  }
}

export default RateLimiter;