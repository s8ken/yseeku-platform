import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_API_URL ?? process.env.BACKEND_URL ?? 'http://localhost:3001';

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/auth/guest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await backendResponse.json();
    const response = NextResponse.json(data, { status: backendResponse.status });

    // Set session_token cookie so middleware can authenticate the request
    const token = data.data?.tokens?.accessToken || data.token;
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
  } catch (error: any) {
    console.error('Guest auth error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create guest session' },
      { status: 500 }
    );
  }
}
