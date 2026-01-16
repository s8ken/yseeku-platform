import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Simple guest login for demo/fallback purposes
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 'guest-local',
          username: 'Guest',
          email: 'guest@yseeku.com',
          roles: ['user'],
          metadata: { tenant: 'default' }
        },
        tenant: 'default'
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Guest login failed' },
      { status: 500 }
    );
  }
}
