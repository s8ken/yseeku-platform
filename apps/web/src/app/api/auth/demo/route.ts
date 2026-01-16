import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Public demo access - no credentials required
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 'demo-public',
          username: 'Demo User',
          email: 'demo@yseeku.com',
          roles: ['user', 'demo'],
          metadata: { 
            tenant: 'demo',
            isPublicDemo: true,
            accessLevel: 'readonly'
          }
        },
        tenant: 'demo',
        demoMode: true
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Demo access failed' },
      { status: 500 }
    );
  }
}

// Also support GET for direct access via URL
export async function GET() {
  return POST();
}
