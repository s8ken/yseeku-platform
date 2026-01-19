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
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: any) {
    console.error('Guest auth error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create guest session' },
      { status: 500 }
    );
  }
}
