import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getClientIp } from '@/lib/security-utils';

class SecurityError extends Error {
  code: string;
  context?: Record<string, any>;
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message);
    this.code = code;
    this.context = context;
  }
}

class AuthenticationError extends SecurityError {}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    username: string;
    tenant: string;
    roles: string[];
    permissions: string[];
    sessionId: string;
  };
}

export interface AuthConfig {
  secret: string;
  algorithms?: jwt.Algorithm[];
  issuer?: string;
  audience?: string;
  clockTolerance?: number;
  maxAge?: string;
}

const DEFAULT_CONFIG: AuthConfig = {
  secret: process.env.JWT_SECRET || '',
  algorithms: ['HS256'],
  issuer: 'yseeku-platform',
  audience: 'yseeku-api',
  clockTolerance: 30,
  maxAge: '15m'
};

export class AuthMiddleware {
  private config: AuthConfig;
  private auditLogger?: (event: any) => Promise<void>;

  constructor(config: Partial<AuthConfig> = {}, auditLogger?: (event: any) => Promise<void>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.auditLogger = auditLogger;
  }

  async authenticate(request: NextRequest): Promise<AuthenticatedRequest> {
    try {
      const token = this.extractToken(request);
      if (!token) {
        throw new AuthenticationError('No authentication token provided', 'MISSING_TOKEN', {
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: request.url,
          method: request.method
        });
      }

      const decoded = this.verifyToken(token);
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: decoded.sub || '',
        username: decoded.username || '',
        tenant: decoded.tenant || '',
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        sessionId: decoded.sessionId || ''
      };

      // Log successful authentication for audit trail
      if (this.auditLogger) {
        await this.auditLogger({
          type: 'AUTH_SUCCESS',
          userId: authenticatedRequest.user.id,
          tenant: authenticatedRequest.user.tenant,
          sessionId: authenticatedRequest.user.sessionId,
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: request.url,
          method: request.method,
          timestamp: new Date().toISOString()
        });
      }

      return authenticatedRequest;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Log authentication failure for audit trail
      if (this.auditLogger) {
        await this.auditLogger({
          type: 'AUTH_FAILURE',
          error: error instanceof Error ? error.message : 'Unknown authentication error',
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: request.url,
          method: request.method,
          timestamp: new Date().toISOString()
        });
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Authentication token has expired', 'TOKEN_EXPIRED', {
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          expiredAt: error.expiredAt
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid authentication token', 'INVALID_TOKEN', {
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      }

      throw new SecurityError('Authentication failed', 'AUTHENTICATION_FAILED', {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    }
  }

  requireRole(requiredRoles: string | string[]): (request: AuthenticatedRequest) => void {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return (request: AuthenticatedRequest) => {
      if (!request.user) {
        throw new AuthenticationError('User not authenticated', 'UNAUTHORIZED', {
          ipAddress: getClientIp(request as NextRequest),
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      }

      const hasRole = roles.some(role => request.user!.roles.includes(role));
      if (!hasRole) {
        throw new SecurityError(`Insufficient permissions. Required roles: ${roles.join(', ')}`, 'INSUFFICIENT_ROLE', {
          userId: request.user.id,
          tenant: request.user.tenant,
          requiredRoles: roles,
          userRoles: request.user.roles,
          ipAddress: getClientIp(request as NextRequest),
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      }
    };
  }

  requirePermission(requiredPermissions: string | string[]): (request: AuthenticatedRequest) => void {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    return (request: AuthenticatedRequest) => {
      if (!request.user) {
        throw new AuthenticationError('User not authenticated', 'UNAUTHORIZED', {
          ipAddress: getClientIp(request as NextRequest),
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      }

      const hasPermission = permissions.some(permission => request.user!.permissions.includes(permission));
      if (!hasPermission) {
        throw new SecurityError(`Insufficient permissions. Required permissions: ${permissions.join(', ')}`, 'INSUFFICIENT_PERMISSION', {
          userId: request.user.id,
          tenant: request.user.tenant,
          requiredPermissions: permissions,
          userPermissions: request.user.permissions,
          ipAddress: getClientIp(request as NextRequest),
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      }
    };
  }

  requireTenantAccess(allowedTenants?: string[]): (request: AuthenticatedRequest) => void {
    return (request: AuthenticatedRequest) => {
      if (!request.user) {
        throw new AuthenticationError('User not authenticated', 'UNAUTHORIZED', {
          ipAddress: getClientIp(request as NextRequest),
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      }

      // If no specific tenants are required, just ensure user has a tenant
      if (!allowedTenants || allowedTenants.length === 0) {
        if (!request.user.tenant) {
          throw new SecurityError('User does not belong to any tenant', 'NO_TENANT_ACCESS', {
            userId: request.user.id,
            ipAddress: getClientIp(request as NextRequest),
            userAgent: request.headers.get('user-agent') || 'unknown'
          });
        }
        return;
      }

      // Check if user belongs to one of the allowed tenants
      const hasTenantAccess = allowedTenants.includes(request.user.tenant);
      if (!hasTenantAccess) {
        throw new SecurityError(`Insufficient tenant access. User tenant: ${request.user.tenant}`, 'INSUFFICIENT_TENANT_ACCESS', {
          userId: request.user.id,
          userTenant: request.user.tenant,
          allowedTenants,
          ipAddress: getClientIp(request as NextRequest),
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      }
    };
  }

  private extractToken(request: NextRequest): string | null {
    // Check Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const [scheme, token] = authHeader.split(' ');
      if (scheme.toLowerCase() === 'bearer' && token) {
        return token;
      }
    }

    // Check for token in query parameters (for WebSocket connections)
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) {
      return tokenParam;
    }

    // Check for token in cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(cookie => {
          const [name, ...rest] = cookie.trim().split('=');
          return [name, rest.join('=')];
        })
      );
      return cookies.auth_token || null;
    }

    return null;
  }

  private verifyToken(token: string): any {
    return jwt.verify(token, this.config.secret, {
      algorithms: this.config.algorithms,
      issuer: this.config.issuer,
      audience: this.config.audience,
      clockTolerance: this.config.clockTolerance,
      maxAge: this.config.maxAge
    });
  }
}

// Convenience function to create middleware instance
export function createAuthMiddleware(config?: Partial<AuthConfig>, auditLogger?: (event: any) => Promise<void>): AuthMiddleware {
  return new AuthMiddleware(config, auditLogger);
}

// Helper function to handle authentication errors consistently
export function handleAuthError(error: Error): NextResponse {
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { 
        success: false, 
        error: {
          message: error.message,
          code: error.code,
          context: error.context
        }
      },
      { status: 401, headers: getSecurityHeaders() }
    );
  }

  if (error instanceof SecurityError) {
    return NextResponse.json(
      { 
        success: false, 
        error: {
          message: error.message,
          code: error.code,
          context: error.context
        }
      },
      { status: 403, headers: getSecurityHeaders() }
    );
  }

  // Generic authentication error
  return NextResponse.json(
    { 
      success: false, 
      error: {
        message: 'Authentication failed',
        code: 'AUTHENTICATION_FAILED'
      }
    },
    { status: 401, headers: getSecurityHeaders() }
  );
}

// Security headers for all auth responses
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  };
}
