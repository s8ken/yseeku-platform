import { NextRequest, NextResponse } from 'next/server';
import { getRBACManager, Role, User } from '@sonate/orchestrate';

export async function POST(request: NextRequest) {
  try {
    // Get tenant from header or query param
    const tenant = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenant') || 'default';

    // Parse request body
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Mock authentication - in real implementation, this would validate against stored credentials
    // For demo purposes, accept any username/password combination
    if (username && password) {
      // Create a mock user with appropriate roles
      const mockUser: User = {
        id: `user-${username}`,
        username,
        email: `${username}@example.com`,
        roles: [Role.ADMIN], // Default to admin for demo
        metadata: { tenant }
      };

      // Get RBAC manager and cache the user
      const rbac = getRBACManager();
      rbac.cacheUser(mockUser);

      // Generate a mock token (in production, use proper JWT)
      const token = `mock-token-${Date.now()}-${username}`;

      return NextResponse.json({
        success: true,
        data: {
          user: mockUser,
          token,
          tenant
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}