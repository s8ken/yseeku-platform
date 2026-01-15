import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant') || 'default';
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  try {
    const demo = process.env.DEMO_MODE === 'true';
    let token: string | undefined;
    if (demo) {
      const guestRes = await fetch(`${base}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (guestRes.ok) {
        const data = await guestRes.json();
        token = data?.data?.tokens?.accessToken;
      }
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!headers['Authorization'] && !demo) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const res = await fetch(`${base}/api/dashboard/alerts?tenant=${tenant}`, { headers });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: res.status });
    }
    const body = await res.json();
    const alertData = body?.data || body;
    return NextResponse.json({ success: true, data: alertData });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
