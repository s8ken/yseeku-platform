import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.INTERNAL_API_URL ??
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'http://localhost:3001';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    // Proxy the login request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // Extract the JWT from the backend response
    const token = data.token || data.data?.tokens?.accessToken;

    const response = NextResponse.json(data, { status: 200 });

    // Set the session_token HttpOnly cookie so the middleware can find it
    if (token) {
      response.cookies.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }

    return response;
  } catch (err: any) {
    console.error('Login proxy error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Login failed' },
      { status: 500 }
    );
  }
}
