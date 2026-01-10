import Redis from 'ioredis';

const url = process.env.REDIS_URL || '';
const redis = url ? new Redis(url) : null;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const raw = await redis.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

