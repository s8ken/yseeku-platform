import { NextRequest, NextResponse } from 'next/server';
import { SecureAuthService } from '@sonate/core/security';
import { AuthenticationError, SecurityUtils } from '@sonate/core/security';
import { getClientIp } from '@/lib/utils';
import { withRateLimit, rateLimiters } from '@/middleware/rate-limit';

// Initialize secure authentication service
const authService = new SecureAuthService({
  jwtSecret: process.env.JWT_SECRET || SecurityUtils.generateSecureSecret(),
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || SecurityUtils.generateSecureSecret(),
  saltRounds: 12,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000 // 15 minutes
});

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // Get tenant from header or query param with validation
    const tenant = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenant') || 'default';
    
    // Validate tenant format
    if (!isValidTenant(tenant)) {
      return NextResponse.json(
        { 
          error: 'Invalid tenant format',
          code: 'INVALID_TENANT',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { 
          error: 'Username and password are required',
          code: 'MISSING_CREDENTIALS',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Get client context
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Attempt authentication with secure service
    const result = await authService.authenticate(
      { username, password, tenant },
      { ipAddress, userAgent }
    );

    // Set secure HTTP headers
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          roles: result.user.roles,
          tenant: result.user.tenant
        },
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
          tokenType: result.tokens.tokenType
        },
        sessionId: result.sessionId
      }
    });

    // Add security headers
    addSecurityHeaders(response);

    return response;

  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      const errorResponse = {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        context: {
          component: error.context.component,
          operation: error.context.operation
        }
      };

      // Add remediation for specific errors
      if (error.remediation) {
        (errorResponse as any).remediation = error.remediation;
      }

      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Handle other errors
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}, rateLimiters.auth); // Use strict auth rate limiting

/**
 * Validate tenant identifier format
 */
function isValidTenant(tenant: string): boolean {
  const tenantRegex = /^[a-zA-Z0-9_-]{1,50}$/;
  return tenantRegex.test(tenant);
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Set strict transport security
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Set referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  response.headers.delete('X-Powered-By');
}