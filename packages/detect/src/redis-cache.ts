/**
 * Redis Cache Provider for SONATE Detect
 * Enterprise-grade Redis caching with connection pooling and error handling
 */

import Redis from 'ioredis';

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

const DEFAULT_CONFIG: RedisCacheConfig = {
  host: 'localhost',
  port: 6379,
  db: 0,
  keyPrefix: 'sonate:detect:',
  defaultTTL: 3600, // 1 hour
  connectionTimeout: 5000,
  retryDelay: 1000,
  maxRetries: 3,
  enableCompression: false
};

/**
 * Redis Cache Provider with enterprise features
 */
export class RedisCacheProvider {
  private redis: Redis | null = null;
  private config: RedisCacheConfig;
  private isConnected: boolean = false;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };

  constructor(config: Partial<RedisCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        connectTimeout: this.config.connectionTimeout,
        maxRetriesPerRequest: this.config.maxRetries,
        lazyConnect: true
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
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.redis = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if Redis is connected and operational
   */
  async healthCheck(): Promise<boolean> {
    if (!this.redis || !this.isConnected) return false;

    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any | null> {
    if (!this.redis || !this.isConnected) return null;

    try {
      const fullKey = this.getFullKey(key);
      const data = await this.redis.get(fullKey);

      if (data) {
        this.stats.hits++;
        const entry: CacheEntry = JSON.parse(data);

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl * 1000) {
          await this.delete(key); // Remove expired entry
          return null;
        }

        // Update access count
        entry.accessCount++;
        await this.redis.setex(fullKey, entry.ttl, JSON.stringify(entry));

        return entry.data;
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis || !this.isConnected) return false;

    try {
      const fullKey = this.getFullKey(key);
      const ttl = ttlSeconds || this.config.defaultTTL;

      const entry: CacheEntry = {
        data: value,
        timestamp: Date.now(),
        ttl,
        accessCount: 0
      };

      const serialized = JSON.stringify(entry);
      const compressed = this.config.enableCompression ?
        await this.compressData(serialized) : serialized;

      await this.redis.setex(fullKey, ttl, compressed);
      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) return false;

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.redis.del(fullKey);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) return false;

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
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
      config: { ...this.config, password: this.config.password ? '[REDACTED]' : undefined }
    };
  }

  /**
   * Clear all cache entries with the configured prefix
   */
  async clearAll(): Promise<number> {
    if (!this.redis || !this.isConnected) return 0;

    try {
      const pattern = this.config.keyPrefix + '*';
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis clearAll error:', error);
      return 0;
    }
  }

  /**
   * Get cache keys matching a pattern
   */
  async getKeys(pattern: string = '*'): Promise<string[]> {
    if (!this.redis || !this.isConnected) return [];

    try {
      const fullPattern = this.config.keyPrefix + pattern;
      const keys = await this.redis.keys(fullPattern);
      return keys.map(key => key.replace(this.config.keyPrefix, ''));
    } catch (error) {
      this.stats.errors++;
      console.error('Redis getKeys error:', error);
      return [];
    }
  }

  // Private helper methods

  private getFullKey(key: string): string {
    return this.config.keyPrefix + key;
  }

  private async compressData(data: string): Promise<string> {
    // Simple compression - in production you might use a proper compression library
    // For now, just return the data as-is
    return data;
  }
}

/**
 * Global Redis cache instance
 */
export const redisCache = new RedisCacheProvider({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: 'sonate:detect:',
  defaultTTL: 3600,
  enableCompression: false
});

/**
 * Initialize Redis cache connection
 */
export async function initializeRedisCache(): Promise<boolean> {
  try {
    await redisCache.connect();
    return true;
  } catch (error) {
    console.warn('Failed to initialize Redis cache, falling back to in-memory:', error);
    return false;
  }
}

/**
 * Cache wrapper with fallback to in-memory cache
 */
export class HybridCache {
  private redisCache: RedisCacheProvider;
  private memoryCache = new Map<string, { data: any; expiry: number }>();
  private redisAvailable: boolean = false;

  constructor(redisCache: RedisCacheProvider) {
    this.redisCache = redisCache;
  }

  async initialize(): Promise<void> {
    this.redisAvailable = await this.redisCache.healthCheck();
    if (!this.redisAvailable) {
      console.warn('Redis not available, using in-memory cache fallback');
    }
  }

  async get(key: string): Promise<any | null> {
    if (this.redisAvailable) {
      return this.redisCache.get(key);
    } else {
      const entry = this.memoryCache.get(key);
      if (entry && Date.now() < entry.expiry) {
        return entry.data;
      } else if (entry) {
        this.memoryCache.delete(key); // Remove expired entry
      }
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    if (this.redisAvailable) {
      return this.redisCache.set(key, value, ttlSeconds);
    } else {
      const expiry = Date.now() + (ttlSeconds * 1000);
      this.memoryCache.set(key, { data: value, expiry });
      return true;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (this.redisAvailable) {
      return this.redisCache.delete(key);
    } else {
      return this.memoryCache.delete(key);
    }
  }

  getStats() {
    if (this.redisAvailable) {
      return this.redisCache.getStats();
    } else {
      return {
        memoryCacheSize: this.memoryCache.size,
        connected: false
      };
    }
  }
}

/**
 * Global hybrid cache instance
 */
export const hybridCache = new HybridCache(redisCache);