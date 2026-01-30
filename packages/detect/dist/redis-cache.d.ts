/**
 * Redis Cache Provider for SONATE Detect
 * Enterprise-grade Redis caching with connection pooling and error handling
 */
export interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
    accessCount: number;
}
export interface RedisCacheConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix: string;
    defaultTTL: number;
    connectionTimeout: number;
    retryDelay: number;
    maxRetries: number;
    enableCompression: boolean;
}
/**
 * Redis Cache Provider with enterprise features
 */
export declare class RedisCacheProvider {
    private redis;
    private config;
    private isConnected;
    private stats;
    constructor(config?: Partial<RedisCacheConfig>);
    /**
     * Initialize Redis connection
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Check if Redis is connected and operational
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get value from cache
     */
    get(key: string): Promise<any | null>;
    /**
     * Set value in cache with TTL
     */
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    /**
     * Delete value from cache
     */
    delete(key: string): Promise<boolean>;
    /**
     * Check if key exists in cache
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get cache statistics
     */
    getStats(): {
        hitRate: number;
        connected: boolean;
        config: {
            password: string | undefined;
            host: string;
            port: number;
            db?: number;
            keyPrefix: string;
            defaultTTL: number;
            connectionTimeout: number;
            retryDelay: number;
            maxRetries: number;
            enableCompression: boolean;
        };
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        errors: number;
    };
    /**
     * Clear all cache entries with the configured prefix
     */
    clearAll(): Promise<number>;
    /**
     * Get cache keys matching a pattern
     */
    getKeys(pattern?: string): Promise<string[]>;
    private getFullKey;
    private compressData;
}
/**
 * Global Redis cache instance
 */
export declare const redisCache: RedisCacheProvider;
/**
 * Initialize Redis cache connection
 */
export declare function initializeRedisCache(): Promise<boolean>;
/**
 * Cache wrapper with fallback to in-memory cache
 */
export declare class HybridCache {
    private redisCache;
    private memoryCache;
    private redisAvailable;
    constructor(redisCache: RedisCacheProvider);
    initialize(): Promise<void>;
    get(key: string): Promise<any | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    getStats(): {
        hitRate: number;
        connected: boolean;
        config: {
            password: string | undefined;
            host: string;
            port: number;
            db?: number;
            keyPrefix: string;
            defaultTTL: number;
            connectionTimeout: number;
            retryDelay: number;
            maxRetries: number;
            enableCompression: boolean;
        };
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        errors: number;
    } | {
        memoryCacheSize: number;
        connected: boolean;
    };
}
/**
 * Global hybrid cache instance
 */
export declare const hybridCache: HybridCache;
