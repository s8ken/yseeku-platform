type Bucket = { tokens: number; last: number };
const buckets: Record<string, Bucket> = {};

export function allow(userId: string, maxPerSec = Number(process.env.SOCKET_RPS_MAX) || 5): boolean {
  const now = Date.now();
  const b = buckets[userId] || { tokens: maxPerSec, last: now };
  const refill = ((now - b.last) / 1000) * maxPerSec;
  b.tokens = Math.min(maxPerSec, b.tokens + refill);
  b.last = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    buckets[userId] = b;
    return true;
  }
  buckets[userId] = b;
  return false;
}

