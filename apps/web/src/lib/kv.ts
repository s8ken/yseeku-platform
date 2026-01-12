import Redis from 'ioredis'

let client: Redis | null = null

export function getRedis(): Redis | null {
  if (client) return client
  const url = process.env.REDIS_URL
  const host = process.env.REDIS_HOST
  const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined
  if (url) {
    client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 })
    return client
  }
  if (host && port) {
    client = new Redis({ host, port, lazyConnect: true, maxRetriesPerRequest: 1 })
    return client
  }
  return null
}

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    const r = getRedis()
    if (r) {
      const v = await r.get(key)
      return v ? JSON.parse(v) as T : null
    }
    return null
  },
  async set(key: string, value: any, options: { ex: number }) {
    const r = getRedis()
    if (r) {
      await r.set(key, JSON.stringify(value), 'EX', options.ex)
      return
    }
  }
}

