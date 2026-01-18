type Entry<T> = { value: T; expiresAt: number };
const store = new Map<string, Entry<any>>();

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { store.delete(key); return null; }
  return e.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlSeconds = 60): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
