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

export async function cacheDel(pattern: string): Promise<void> {
  if (!redis) return;
  // If pattern contains wildcard, use SCAN + DEL; otherwise direct DEL
  if (pattern.includes('*')) {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } else {
    await redis.del(pattern);
  }
}

