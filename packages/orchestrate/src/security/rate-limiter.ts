/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 */

import { AuditEventType, AuditSeverity, getAuditLogger } from './audit';

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
  failOpen?: boolean;
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
  resetMatching?(prefix: string): Promise<number>;
  getCount?(key: string): Promise<number | null>;
}

export class RateLimiter {
  private store: RateLimitStore;

  constructor(store?: RateLimitStore) {
    this.store = store || new InMemoryRateLimitStore();
  }

  async checkLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    const nowMs = Date.now();
    const windowStartMs = Math.floor(nowMs / config.windowMs) * config.windowMs;
    const windowEndMs = windowStartMs + config.windowMs;
    const windowEnd = new Date(windowEndMs);

    try {
      const endpoint = config.endpoint ?? '';
      const key = `${config.identifierType}|${config.identifier}|${endpoint}|${windowEndMs}`;
      const currentCount = await this.store.increment(key);

      if (currentCount > config.maxRequests) {
        const retryAfter = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));
        await this.logRateLimitExceeded(config, retryAfter);

        return {
          allowed: false,
          remaining: 0,
          resetAt: windowEnd,
          retryAfter,
        };
      }

      return {
        allowed: true,
        remaining: config.maxRequests - currentCount,
        resetAt: windowEnd,
      };
    } catch (error) {
      const failOpen = config.failOpen ?? process.env.RATE_LIMIT_FAIL_OPEN === 'true';
      const retryAfter = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));
      await getAuditLogger().log(AuditEventType.SYSTEM_ERROR, 'rate_limit.check', 'failure', {
        severity: AuditSeverity.ERROR,
        resourceType: 'rate_limit',
        resourceId: config.identifier,
        details: {
          identifierType: config.identifierType,
          endpoint: config.endpoint,
          error: String(error),
        },
      });
      if (failOpen) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetAt: windowEnd,
        };
      }
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowEnd,
        retryAfter,
      };
    }
  }

  private async logRateLimitExceeded(config: RateLimitConfig, retryAfter: number): Promise<void> {
    await getAuditLogger().log(
      AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      'rate_limit.exceeded',
      'failure',
      {
        severity: AuditSeverity.WARNING,
        resourceType: 'rate_limit',
        resourceId: config.identifier,
        details: {
          identifierType: config.identifierType,
          endpoint: config.endpoint,
          retryAfter,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
        },
      }
    );
  }

  async resetLimit(
    identifier: string,
    identifierType: 'user' | 'ip' | 'api_key',
    endpoint?: string
  ): Promise<void> {
    const ep = endpoint ?? '';
    const prefix = `${identifierType}|${identifier}|${ep}|`;
    if (this.store.resetMatching) {
      await this.store.resetMatching(prefix);
      return;
    }
    const fallbackKey = `${identifierType}|${identifier}|${ep}|${Date.now()}`;
    await this.store.reset(fallbackKey);
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
    return null;
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

export function createEndpointRateLimiters(
  configs: Record<string, RateLimitConfig>
): Record<string, RateLimiter> {
  const limiters: Record<string, RateLimiter> = {};

  for (const endpoint of Object.keys(configs)) {
    limiters[endpoint] = createRateLimiter();
  }

  return limiters;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private windows = new Map<string, { count: number; expiresAt: number }>();

  async increment(key: string): Promise<number> {
    const now = Date.now();
    const parts = key.split('|');
    const windowEndMs = Number(parts[parts.length - 1]);
    const expiresAt = Number.isFinite(windowEndMs) ? windowEndMs : now;

    const existing = this.windows.get(key);
    if (existing && now < existing.expiresAt) {
      existing.count++;
      return existing.count;
    }

    this.windows.set(key, { count: 1, expiresAt });
    return 1;
  }

  async reset(key: string): Promise<void> {
    this.windows.delete(key);
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, window] of this.windows.entries()) {
      if (now >= window.expiresAt) {
        this.windows.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  async resetMatching(prefix: string): Promise<number> {
    let removed = 0;
    for (const key of this.windows.keys()) {
      if (key.startsWith(prefix)) {
        this.windows.delete(key);
        removed++;
      }
    }
    return removed;
  }

  async getCount(key: string): Promise<number | null> {
    const entry = this.windows.get(key);
    if (!entry) {return null;}
    if (Date.now() >= entry.expiresAt) {
      this.windows.delete(key);
      return null;
    }
    return entry.count;
  }
}

export class RedisRateLimitStore implements RateLimitStore {
  private redis: any; // Redis client

  constructor(redis: any) {
    this.redis = redis;
  }

  async increment(key: string): Promise<number> {
    const parts = key.split('|');
    const windowEndMs = Number(parts[parts.length - 1]);
    const count = await this.redis.incr(key);
    if (Number.isFinite(windowEndMs) && windowEndMs > 0) {
      if (count === 1) {
        await this.redis.pexpireat(key, windowEndMs);
      } else {
        const ttl = await this.redis.pttl(key);
        if (ttl < 0) {
          await this.redis.pexpireat(key, windowEndMs);
        }
      }
    }
    return Number(count);
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async cleanup(): Promise<number> {
    return 0;
  }

  async resetMatching(prefix: string): Promise<number> {
    const keys = await this.redis.keys(`${prefix}*`);
    if (!Array.isArray(keys) || keys.length === 0) {return 0;}
    await this.redis.del(...keys);
    return keys.length;
  }

  async getCount(key: string): Promise<number | null> {
    const val = await this.redis.get(key);
    if (val == null) {return null;}
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
}

export default RateLimiter;
