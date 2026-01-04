import { NextRequest, NextResponse } from 'next/server';
import { TrustReceipt } from '@sonate/core';
import { saveTrustReceipt, getReceiptsBySession } from '@sonate/persistence';
import { RateLimiter } from '@/middleware/rate-limit';
import { getClientIp } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function createLimiter() {
  return new RateLimiter({
    windowMs: 60_000,
    maxRequests: 30,
    keyGenerator: (req) => `receipts:${getClientIp(req)}`,
  });
}

export async function POST(req: NextRequest) {
  const limiter = createLimiter();
  const { allowed, limit, remaining, reset, retryAfter } = await limiter.checkLimit(req);
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': new Date(reset).toISOString(),
  };
  if (retryAfter !== undefined) headers['Retry-After'] = String(retryAfter);
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

export async function GET(req: NextRequest) {
  try {
    const session = req.nextUrl.searchParams.get('session');
    const tenant = req.nextUrl.searchParams.get('tenant') || undefined;
    if (!session) {
      return NextResponse.json({ error: 'Missing session' }, { status: 400 });
    }
    const rows = await getReceiptsBySession(session, tenant);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: 'Query error', message: (err as Error).message }, { status: 500 });
  }
}
