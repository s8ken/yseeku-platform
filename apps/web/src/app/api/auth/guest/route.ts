import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Generate a simple demo token for backend compatibility
    const demoToken = `demo-token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 'guest-local',
          username: 'Guest',
          email: 'guest@yseeku.com',
          roles: ['user', 'demo'],
          metadata: { tenant: 'default', isDemo: true }
        },
        tenant: 'default',
        tokens: {
          accessToken: demoToken,
          refreshToken: `refresh-${demoToken}`
        }
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Guest login failed' },
      { status: 500 }
    );
  }
}
