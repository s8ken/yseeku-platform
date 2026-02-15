import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
    return client;
  } catch {
    return null;
  }
}

export async function ensureRedis(): Promise<Redis | null> {
  const c = getRedisClient();
  if (!c) return null;
  try {
    // Attempt to connect if not connected
    // ioredis auto-connects on first command
    await c.ping();
    return c;
  } catch {
    return null;
  }
}