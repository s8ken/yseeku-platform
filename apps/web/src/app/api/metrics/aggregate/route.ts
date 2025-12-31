import { NextRequest, NextResponse } from 'next/server';
import { getAggregateMetrics } from '@sonate/persistence';
import { AuthMiddleware } from '@/middleware/auth-middleware';

const auth = new AuthMiddleware();

export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize
    const authenticatedReq = await auth.authenticate(req);
    auth.requirePermission('read:metrics')(authenticatedReq);

    // Use user's tenant ID for security
    const tenant = authenticatedReq.user?.tenant;

    const metrics = await getAggregateMetrics(tenant);
    return NextResponse.json({ metrics });
  } catch (error: any) {
    if (error.code === 'MISSING_TOKEN' || error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED') {
      return NextResponse.json({ error: 'Unauthorized', message: error.message }, { status: 401 });
    }
    if (error.code === 'INSUFFICIENT_PERMISSION') {
      return NextResponse.json({ error: 'Forbidden', message: error.message }, { status: 403 });
    }

    console.error('Error collecting aggregate metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect aggregate metrics' },
      { status: 500 }
    );
  }
}
