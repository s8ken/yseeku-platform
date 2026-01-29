"use strict";
/**
 * Redis Cache Provider for SONATE Detect
 * Enterprise-grade Redis caching with connection pooling and error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hybridCache = exports.HybridCache = exports.redisCache = exports.RedisCacheProvider = void 0;
exports.initializeRedisCache = initializeRedisCache;
const ioredis_1 = __importDefault(require("ioredis"));
const DEFAULT_CONFIG = {
    host: 'localhost',
    port: 6379,
    db: 0,
    keyPrefix: 'sonate:detect:',
    defaultTTL: 3600, // 1 hour
    connectionTimeout: 5000,
    retryDelay: 1000,
    maxRetries: 3,
    enableCompression: false,
};
/**
 * Redis Cache Provider with enterprise features
 */
class RedisCacheProvider {
    constructor(config = {}) {
        this.redis = null;
        this.isConnected = false;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
        };
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Initialize Redis connection
     */
    async connect() {
        try {
            this.redis = new ioredis_1.default({
                host: this.config.host,
                port: this.config.port,
                password: this.config.password,
                db: this.config.db,
                connectTimeout: this.config.connectionTimeout,
                maxRetriesPerRequest: this.config.maxRetries,
                lazyConnect: true,
            });
            // Event handlers
            this.redis.on('connect', () => {
                this.isConnected = true;
                console.log('Redis cache connected');
            });
            this.redis.on('error', (error) => {
                this.stats.errors++;
                console.error('Redis cache error:', error);
            });
            this.redis.on('close', () => {
                this.isConnected = false;
                console.log('Redis cache disconnected');
            });
            await this.redis.connect();
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.redis) {
            await this.redis.disconnect();
            this.redis = null;
            this.isConnected = false;
        }
    }
    /**
     * Check if Redis is connected and operational
     */
    async healthCheck() {
        if (!this.redis || !this.isConnected) {
            return false;
        }
        try {
            await this.redis.ping();
            return true;
        }
        catch (error) {
            this.stats.errors++;
            return false;
        }
    }
    /**
     * Get value from cache
     */
    async get(key) {
        if (!this.redis || !this.isConnected) {
            return null;
        }
        try {
            const fullKey = this.getFullKey(key);
            const data = await this.redis.get(fullKey);
            if (data) {
                this.stats.hits++;
                const entry = JSON.parse(data);
                // Check if entry has expired
                if (Date.now() - entry.timestamp > entry.ttl * 1000) {
                    await this.delete(key); // Remove expired entry
                    return null;
                }
                // Update access count
                entry.accessCount++;
                await this.redis.setex(fullKey, entry.ttl, JSON.stringify(entry));
                return entry.data;
            }
            this.stats.misses++;
            return null;
        }
        catch (error) {
            this.stats.errors++;
            console.error('Redis get error:', error);
            return null;
        }
    }
    /**
     * Set value in cache with TTL
     */
    async set(key, value, ttlSeconds) {
        if (!this.redis || !this.isConnected) {
            return false;
        }
        try {
            const fullKey = this.getFullKey(key);
            const ttl = ttlSeconds || this.config.defaultTTL;
            const entry = {
                data: value,
                timestamp: Date.now(),
                ttl,
                accessCount: 0,
            };
            const serialized = JSON.stringify(entry);
            const compressed = this.config.enableCompression
                ? await this.compressData(serialized)
                : serialized;
            await this.redis.setex(fullKey, ttl, compressed);
            this.stats.sets++;
            return true;
        }
        catch (error) {
            this.stats.errors++;
            console.error('Redis set error:', error);
            return false;
        }
    }
    /**
     * Delete value from cache
     */
    async delete(key) {
        if (!this.redis || !this.isConnected) {
            return false;
        }
        try {
            const fullKey = this.getFullKey(key);
            const result = await this.redis.del(fullKey);
            this.stats.deletes++;
            return result > 0;
        }
        catch (error) {
            this.stats.errors++;
            console.error('Redis delete error:', error);
            return false;
        }
    }
    /**
     * Check if key exists in cache
     */
    async exists(key) {
        if (!this.redis || !this.isConnected) {
            return false;
        }
        try {
            const fullKey = this.getFullKey(key);
            const result = await this.redis.exists(fullKey);
            return result === 1;
        }
        catch (error) {
            this.stats.errors++;
            console.error('Redis exists error:', error);
            return false;
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
        return {
            ...this.stats,
            hitRate,
            connected: this.isConnected,
            config: { ...this.config, password: this.config.password ? '[REDACTED]' : undefined },
        };
    }
    /**
     * Clear all cache entries with the configured prefix
     */
    async clearAll() {
        if (!this.redis || !this.isConnected) {
            return 0;
        }
        try {
            const pattern = this.config.keyPrefix + '*';
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            return keys.length;
        }
        catch (error) {
            this.stats.errors++;
            console.error('Redis clearAll error:', error);
            return 0;
        }
    }
    /**
     * Get cache keys matching a pattern
     */
    async getKeys(pattern = '*') {
        if (!this.redis || !this.isConnected) {
            return [];
        }
        try {
            const fullPattern = this.config.keyPrefix + pattern;
            const keys = await this.redis.keys(fullPattern);
            return keys.map((key) => key.replace(this.config.keyPrefix, ''));
        }
        catch (error) {
            this.stats.errors++;
            console.error('Redis getKeys error:', error);
            return [];
        }
    }
    // Private helper methods
    getFullKey(key) {
        return this.config.keyPrefix + key;
    }
    async compressData(data) {
        // Simple compression - in production you might use a proper compression library
        // For now, just return the data as-is
        return data;
    }
}
exports.RedisCacheProvider = RedisCacheProvider;
/**
 * Global Redis cache instance
 */
exports.redisCache = new RedisCacheProvider({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'sonate:detect:',
    defaultTTL: 3600,
    enableCompression: false,
});
/**
 * Initialize Redis cache connection
 */
async function initializeRedisCache() {
    try {
        await exports.redisCache.connect();
        return true;
    }
    catch (error) {
        console.warn('Failed to initialize Redis cache, falling back to in-memory:', error);
        return false;
    }
}
/**
 * Cache wrapper with fallback to in-memory cache
 */
class HybridCache {
    constructor(redisCache) {
        this.memoryCache = new Map();
        this.redisAvailable = false;
        this.redisCache = redisCache;
    }
    async initialize() {
        this.redisAvailable = await this.redisCache.healthCheck();
        if (!this.redisAvailable) {
            console.warn('Redis not available, using in-memory cache fallback');
        }
    }
    async get(key) {
        if (this.redisAvailable) {
            return this.redisCache.get(key);
        }
        const entry = this.memoryCache.get(key);
        if (entry && Date.now() < entry.expiry) {
            return entry.data;
        }
        else if (entry) {
            this.memoryCache.delete(key); // Remove expired entry
        }
        return null;
    }
    async set(key, value, ttlSeconds = 3600) {
        if (this.redisAvailable) {
            return this.redisCache.set(key, value, ttlSeconds);
        }
        const expiry = Date.now() + ttlSeconds * 1000;
        this.memoryCache.set(key, { data: value, expiry });
        return true;
    }
    async delete(key) {
        if (this.redisAvailable) {
            return this.redisCache.delete(key);
        }
        return this.memoryCache.delete(key);
    }
    getStats() {
        if (this.redisAvailable) {
            return this.redisCache.getStats();
        }
        return {
            memoryCacheSize: this.memoryCache.size,
            connected: false,
        };
    }
}
exports.HybridCache = HybridCache;
/**
 * Global hybrid cache instance
 */
exports.hybridCache = new HybridCache(exports.redisCache);
