/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 */
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    identifier: string;
    identifierType: 'user' | 'ip' | 'api_key';
    endpoint?: string;
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
export declare class RateLimiter {
    private store;
    constructor(store?: RateLimitStore);
    checkLimit(config: RateLimitConfig): Promise<RateLimitResult>;
    private logRateLimitExceeded;
    resetLimit(identifier: string, identifierType: 'user' | 'ip' | 'api_key', endpoint?: string): Promise<void>;
    getLimitStatus(identifier: string, identifierType: 'user' | 'ip' | 'api_key', endpoint?: string): Promise<{
        requestCount: number;
        windowStart: Date;
        windowEnd: Date;
        blockedUntil?: Date;
    } | null>;
    /**
     * Cleanup old rate limit records
     */
    cleanup(): Promise<number>;
}
export declare function createRateLimiter(store?: RateLimitStore): RateLimiter;
export declare function createEndpointRateLimiters(configs: Record<string, RateLimitConfig>): Record<string, RateLimiter>;
export declare class InMemoryRateLimitStore implements RateLimitStore {
    private windows;
    increment(key: string): Promise<number>;
    reset(key: string): Promise<void>;
    cleanup(): Promise<number>;
    resetMatching(prefix: string): Promise<number>;
    getCount(key: string): Promise<number | null>;
}
export declare class RedisRateLimitStore implements RateLimitStore {
    private redis;
    constructor(redis: any);
    increment(key: string): Promise<number>;
    reset(key: string): Promise<void>;
    cleanup(): Promise<number>;
    resetMatching(prefix: string): Promise<number>;
    getCount(key: string): Promise<number | null>;
}
export default RateLimiter;
//# sourceMappingURL=rate-limiter.d.ts.map