/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 */

import { supabase } from '../lib/supabase';
import { auditLogger, AuditEventType, AuditSeverity } from '../lib/audit/enhanced-logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  identifier: string; // user_id, ip_address, or api_key
  identifierType: 'user' | 'ip' | 'api_key';
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds until next request allowed
}

export class RateLimiter {
  /**
   * Check if a request is allowed under rate limits
   */
  async checkLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    const windowEnd = new Date(now.getTime() + config.windowMs);

    try {
      // Get or create rate limit record
      const { data: existingLimit, error: fetchError } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('identifier', config.identifier)
        .eq('identifier_type', config.identifierType)
        .eq('endpoint', config.endpoint)
        .gte('window_end', now.toISOString())
        .single();

      if (fetchError &amp;&amp; fetchError.code !== 'PGRST116') {
        console.error('Error fetching rate limit:', fetchError);
        // Fail open - allow request if we can't check limits
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetAt: windowEnd
        };
      }

      // Check if currently blocked
      if (existingLimit?.blocked_until &amp;&amp; new Date(existingLimit.blocked_until) > now) {
        const retryAfter = Math.ceil(
          (new Date(existingLimit.blocked_until).getTime() - now.getTime()) / 1000
        );

        await this.logRateLimitExceeded(config, retryAfter);

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(existingLimit.blocked_until),
          retryAfter
        };
      }

      // If no existing limit or window expired, create new window
      if (!existingLimit || new Date(existingLimit.window_end) <= now) {
        const { error: insertError } = await supabase
          .from('rate_limits')
          .insert({
            identifier: config.identifier,
            identifier_type: config.identifierType,
            endpoint: config.endpoint,
            request_count: 1,
            window_start: now.toISOString(),
            window_end: windowEnd.toISOString()
          });

        if (insertError) {
          console.error('Error creating rate limit:', insertError);
        }

        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetAt: windowEnd
        };
      }

      // Check if limit exceeded
      if (existingLimit.request_count >= config.maxRequests) {
        // Block for remaining window duration
        const blockedUntil = new Date(existingLimit.window_end);
        const retryAfter = Math.ceil(
          (blockedUntil.getTime() - now.getTime()) / 1000
        );

        await supabase
          .from('rate_limits')
          .update({ blocked_until: blockedUntil.toISOString() })
          .eq('id', existingLimit.id);

        await this.logRateLimitExceeded(config, retryAfter);

        return {
          allowed: false,
          remaining: 0,
          resetAt: blockedUntil,
          retryAfter
        };
      }

      // Increment request count
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({ request_count: existingLimit.request_count + 1 })
        .eq('id', existingLimit.id);

      if (updateError) {
        console.error('Error updating rate limit:', updateError);
      }

      return {
        allowed: true,
        remaining: config.maxRequests - existingLimit.request_count - 1,
        resetAt: new Date(existingLimit.window_end)
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: windowEnd
      };
    }
  }

  /**
   * Log rate limit exceeded event
   */
  private async logRateLimitExceeded(
    config: RateLimitConfig,
    retryAfter: number
  ): Promise<void> {
    await auditLogger.log({
      eventType: AuditEventType.API_RATE_LIMIT,
      severity: AuditSeverity.WARNING,
      userId: config.identifierType === 'user' ? config.identifier : undefined,
      resource: config.endpoint,
      action: 'rate_limit_exceeded',
      result: 'failure',
      details: {
        identifierType: config.identifierType,
        identifier: config.identifier,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        retryAfter
      }
    });
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetLimit(
    identifier: string,
    identifierType: 'user' | 'ip' | 'api_key',
    endpoint?: string
  ): Promise<void> {
    let query = supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType);

    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }

    const { error } = await query;

    if (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  /**
   * Get current rate limit status
   */
  async getStatus(
    identifier: string,
    identifierType: 'user' | 'ip' | 'api_key',
    endpoint: string
  ): Promise<{
    requestCount: number;
    windowStart: Date;
    windowEnd: Date;
    blockedUntil?: Date;
  } | null> {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('endpoint', endpoint)
      .gte('window_end', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return {
      requestCount: data.request_count,
      windowStart: new Date(data.window_start),
      windowEnd: new Date(data.window_end),
      blockedUntil: data.blocked_until ? new Date(data.blocked_until) : undefined
    };
  }

  /**
   * Cleanup old rate limit records
   */
  async cleanup(): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_old_rate_limits');

    if (error) {
      console.error('Error cleaning up rate limits:', error);
      return 0;
    }

    return data || 0;
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // API endpoints
  api_default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  },
  api_strict: {
    windowMs: 60 * 1000,
    maxRequests: 10 // 10 requests per minute for sensitive endpoints
  },
  api_relaxed: {
    windowMs: 60 * 1000,
    maxRequests: 120 // 120 requests per minute for read-only endpoints
  },
  
  // Authentication endpoints
  auth_login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 login attempts per 15 minutes
  },
  auth_password_reset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3 // 3 password reset requests per hour
  },
  
  // Data export endpoints
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // 10 exports per hour
  },
  
  // SYMBI assessment endpoints
  symbi_assess: {
    windowMs: 60 * 1000,
    maxRequests: 30 // 30 assessments per minute
  }
};

/**
 * Express/Hono middleware for rate limiting
 */
export function createRateLimitMiddleware(
  configName: keyof typeof RATE_LIMIT_CONFIGS = 'api_default'
) {
  return async (req: any, res: any, next: any) => {
    const config = RATE_LIMIT_CONFIGS[configName];
    
    // Get identifier (prefer user ID, fallback to IP)
    const userId = req.user?.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    const identifier = userId || ipAddress;
    const identifierType = userId ? 'user' : 'ip';
    const endpoint = `${req.method} ${req.path}`;

    const result = await rateLimiter.checkLimit({
      ...config,
      identifier,
      identifierType,
      endpoint
    });

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter || 0);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
        resetAt: result.resetAt.toISOString()
      });
    }

    next();
  };
}