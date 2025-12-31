import { NextResponse } from 'next/server';
import { TrustReceipt } from '@sonate/core';
import { saveTrustReceipt, getReceiptsBySession } from '@sonate/persistence';
import { Env } from '@sonate/orchestrate';
import { RedisRateLimitStore, InMemoryRateLimitStore, RateLimiter } from '@sonate/orchestrate/src/security/rate-limiter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getClientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for') || '';
  const xr = req.headers.get('x-real-ip') || '';
  const ip = xf.split(',')[0].trim() || xr || 'unknown';
  return ip;
}

function createLimiter(): RateLimiter {
  const config = { windowMs: 60_000, maxRequests: 30, keyGenerator: (req: any) => `receipts:${req.ip}` } as any;
  const redisUrl = Env.REDIS_URL();
  if (redisUrl) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    const client = new Redis(redisUrl);
    const store = new RedisRateLimitStore(client, config);
    return new RateLimiter(store, config);
  }
  const store = new InMemoryRateLimitStore(config);
  return new RateLimiter(store, config);
}

export async function POST(req: Request) {
  const limiter = createLimiter();
  const ip = getClientIp(req);
  const { allowed, info } = await limiter.checkLimit(`ip:${ip}`);
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(info.limit),
    'X-RateLimit-Remaining': String(info.remaining),
    'X-RateLimit-Reset': info.resetTime.toISOString(),
  };
  if (!allowed) {
    return NextResponse.json({ error: 'Rate Limit Exceeded' }, { status: 429, headers });
  }

  try {
    const body = await req.json();
    const receipt = TrustReceipt.fromJSON(body);
    const ok = await saveTrustReceipt(receipt);
    if (!ok) {
      return NextResponse.json({ saved: false, reason: 'Database unavailable' }, { status: 503, headers });
    }
    return NextResponse.json({ saved: true }, { headers });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload', message: (err as Error).message }, { status: 400, headers });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const session = url.searchParams.get('session');
    const tenant = url.searchParams.get('tenant') || undefined;
    if (!session) {
      return NextResponse.json({ error: 'Missing session' }, { status: 400 });
    }
    const rows = await getReceiptsBySession(session, tenant);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: 'Query error', message: (err as Error).message }, { status: 500 });
  }
}
