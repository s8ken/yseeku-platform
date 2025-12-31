import { NextRequest, NextResponse } from 'next/server';
import { TrustReceipt } from '@sonate/core';
import { saveTrustReceipt, getReceiptsBySession, deleteTrustReceipt } from '@sonate/persistence';
import { Env } from '@sonate/orchestrate';
import { RedisRateLimitStore, InMemoryRateLimitStore, RateLimiter } from '@sonate/orchestrate/src/security/rate-limiter';
import { AuthMiddleware } from '@/middleware/auth-middleware';

const auth = new AuthMiddleware();

function getClientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for') || '';
  const xr = req.headers.get('x-real-ip') || '';
  const ip = xf.split(',')[0].trim() || xr || 'unknown';
  return ip;
}

function createLimiter(): RateLimiter {
  const redisUrl = Env.REDIS_URL();
  if (redisUrl) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    const client = new Redis(redisUrl);
    const store = new RedisRateLimitStore(client);
    return new RateLimiter(store);
  }
  const store = new InMemoryRateLimitStore();
  return new RateLimiter(store);
}

const limiter = createLimiter();

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const result = await limiter.checkLimit({
    windowMs: 60_000,
    maxRequests: 30,
    identifier: ip,
    identifierType: 'ip',
    endpoint: '/api/receipts'
  });

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': '30',
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };

  if (!result.allowed) {
    return NextResponse.json({ error: 'Rate Limit Exceeded' }, { status: 429, headers });
  }

  try {
    // Authenticate and authorize
    const authenticatedReq = await auth.authenticate(req);
    auth.requirePermission('write:receipts')(authenticatedReq);

    const body = await req.json();
    const receipt = TrustReceipt.fromJSON(body);
    
    // Ensure user can only save receipts for their own tenant
    const tenantId = authenticatedReq.user?.tenant;
    const ok = await saveTrustReceipt(receipt, tenantId);
    
    if (!ok) {
      return NextResponse.json({ saved: false, reason: 'Database unavailable' }, { status: 503, headers });
    }
    return NextResponse.json({ saved: true }, { headers });
  } catch (error: any) {
    if (error.code === 'MISSING_TOKEN' || error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED') {
      return NextResponse.json({ error: 'Unauthorized', message: error.message }, { status: 401, headers });
    }
    if (error.code === 'INSUFFICIENT_PERMISSION') {
      return NextResponse.json({ error: 'Forbidden', message: error.message }, { status: 403, headers });
    }
    return NextResponse.json({ error: 'Invalid payload', message: (error as Error).message }, { status: 400, headers });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize
    const authenticatedReq = await auth.authenticate(req);
    auth.requirePermission('read:receipts')(authenticatedReq);

    const url = new URL(req.url);
    const session = url.searchParams.get('session');
    
    // Use user's tenant ID by default for security
    const tenant = authenticatedReq.user?.tenant;
    
    if (!session) {
      return NextResponse.json({ error: 'Missing session' }, { status: 400 });
    }
    const rows = await getReceiptsBySession(session, tenant);
    return NextResponse.json({ rows });
  } catch (error: any) {
    if (error.code === 'MISSING_TOKEN' || error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED') {
      return NextResponse.json({ error: 'Unauthorized', message: error.message }, { status: 401 });
    }
    if (error.code === 'INSUFFICIENT_PERMISSION') {
      return NextResponse.json({ error: 'Forbidden', message: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Query error', message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Authenticate and authorize
    const authenticatedReq = await auth.authenticate(req);
    auth.requirePermission('delete:receipts')(authenticatedReq);

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    // Use user's tenant ID for security (prevent deleting other tenant's receipts)
    const tenant = authenticatedReq.user?.tenant;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing receipt ID' }, { status: 400 });
    }

    const success = await deleteTrustReceipt(id, tenant);
    
    if (!success) {
      return NextResponse.json({ error: 'Receipt not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    if (error.code === 'MISSING_TOKEN' || error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED') {
      return NextResponse.json({ error: 'Unauthorized', message: error.message }, { status: 401 });
    }
    if (error.code === 'INSUFFICIENT_PERMISSION') {
      return NextResponse.json({ error: 'Forbidden', message: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Delete error', message: (error as Error).message }, { status: 500 });
  }
}
