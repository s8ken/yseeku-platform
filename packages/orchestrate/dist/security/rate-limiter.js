"use strict";
/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisRateLimitStore = exports.InMemoryRateLimitStore = exports.RateLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
exports.createEndpointRateLimiters = createEndpointRateLimiters;
const audit_1 = require("./audit");
class RateLimiter {
    constructor(store) {
        this.store = store || new InMemoryRateLimitStore();
    }
    async checkLimit(config) {
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
        }
        catch (error) {
            const failOpen = config.failOpen ?? process.env.RATE_LIMIT_FAIL_OPEN === 'true';
            const retryAfter = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));
            await (0, audit_1.getAuditLogger)().log(audit_1.AuditEventType.SYSTEM_ERROR, 'rate_limit.check', 'failure', {
                severity: audit_1.AuditSeverity.ERROR,
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
    async logRateLimitExceeded(config, retryAfter) {
        await (0, audit_1.getAuditLogger)().log(audit_1.AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED, 'rate_limit.exceeded', 'failure', {
            severity: audit_1.AuditSeverity.WARNING,
            resourceType: 'rate_limit',
            resourceId: config.identifier,
            details: {
                identifierType: config.identifierType,
                endpoint: config.endpoint,
                retryAfter,
                maxRequests: config.maxRequests,
                windowMs: config.windowMs,
            },
        });
    }
    async resetLimit(identifier, identifierType, endpoint) {
        const ep = endpoint ?? '';
        const prefix = `${identifierType}|${identifier}|${ep}|`;
        if (this.store.resetMatching) {
            await this.store.resetMatching(prefix);
            return;
        }
        const fallbackKey = `${identifierType}|${identifier}|${ep}|${Date.now()}`;
        await this.store.reset(fallbackKey);
    }
    async getLimitStatus(identifier, identifierType, endpoint) {
        return null;
    }
    /**
     * Cleanup old rate limit records
     */
    async cleanup() {
        return await this.store.cleanup();
    }
}
exports.RateLimiter = RateLimiter;
// Factory functions for different store types
function createRateLimiter(store) {
    return new RateLimiter(store);
}
function createEndpointRateLimiters(configs) {
    const limiters = {};
    for (const endpoint of Object.keys(configs)) {
        limiters[endpoint] = createRateLimiter();
    }
    return limiters;
}
class InMemoryRateLimitStore {
    constructor() {
        this.windows = new Map();
    }
    async increment(key) {
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
    async reset(key) {
        this.windows.delete(key);
    }
    async cleanup() {
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
    async resetMatching(prefix) {
        let removed = 0;
        for (const key of this.windows.keys()) {
            if (key.startsWith(prefix)) {
                this.windows.delete(key);
                removed++;
            }
        }
        return removed;
    }
    async getCount(key) {
        const entry = this.windows.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() >= entry.expiresAt) {
            this.windows.delete(key);
            return null;
        }
        return entry.count;
    }
}
exports.InMemoryRateLimitStore = InMemoryRateLimitStore;
class RedisRateLimitStore {
    constructor(redis) {
        this.redis = redis;
    }
    async increment(key) {
        const parts = key.split('|');
        const windowEndMs = Number(parts[parts.length - 1]);
        const count = await this.redis.incr(key);
        if (Number.isFinite(windowEndMs) && windowEndMs > 0) {
            if (count === 1) {
                await this.redis.pexpireat(key, windowEndMs);
            }
            else {
                const ttl = await this.redis.pttl(key);
                if (ttl < 0) {
                    await this.redis.pexpireat(key, windowEndMs);
                }
            }
        }
        return Number(count);
    }
    async reset(key) {
        await this.redis.del(key);
    }
    async cleanup() {
        return 0;
    }
    async resetMatching(prefix) {
        const keys = await this.redis.keys(`${prefix}*`);
        if (!Array.isArray(keys) || keys.length === 0) {
            return 0;
        }
        await this.redis.del(...keys);
        return keys.length;
    }
    async getCount(key) {
        const val = await this.redis.get(key);
        if (val == null) {
            return null;
        }
        const n = Number(val);
        return Number.isFinite(n) ? n : null;
    }
}
exports.RedisRateLimitStore = RedisRateLimitStore;
exports.default = RateLimiter;
