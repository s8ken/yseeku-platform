import { NextRequest, NextResponse } from 'next/server';
import { 
  AuthMiddleware, 
  AuthenticatedRequest, 
  handleAuthError,
  createAuthMiddleware 
} from './auth-middleware';
import { AuthenticationError, SecurityError } from '@yseeku/core/security/errors';

export interface RouteProtectionOptions {
  requireAuth?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  allowedTenants?: string[];
  auditLogger?: (event: any) => Promise<void>;
}

/**
 * Creates a protected API route handler that automatically handles authentication and authorization
 */
export function createProtectedRoute(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: RouteProtectionOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  const {
    requireAuth = true,
    requiredRoles = [],
    requiredPermissions = [],
    allowedTenants = [],
    auditLogger
  } = options;

  const authMiddleware = createAuthMiddleware({}, auditLogger);

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      let authenticatedRequest: AuthenticatedRequest = request as AuthenticatedRequest;

      // Handle authentication if required
      if (requireAuth) {
        authenticatedRequest = await authMiddleware.authenticate(request);
      }

      // Check role requirements
      if (requiredRoles.length > 0) {
        const roleChecker = authMiddleware.requireRole(requiredRoles);
        roleChecker(authenticatedRequest);
      }

      // Check permission requirements
      if (requiredPermissions.length > 0) {
        const permissionChecker = authMiddleware.requirePermission(requiredPermissions);
        permissionChecker(authenticatedRequest);
      }

      // Check tenant access
      if (allowedTenants.length > 0 || requireAuth) {
        const tenantChecker = authMiddleware.requireTenantAccess(allowedTenants.length > 0 ? allowedTenants : undefined);
        tenantChecker(authenticatedRequest);
      }

      // Call the actual handler
      return await handler(authenticatedRequest);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof SecurityError) {
        return handleAuthError(error);
      }

      // Handle other errors
      console.error('Route handler error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
          }
        },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  };
}

/**
 * Creates a simple authentication wrapper for API routes
 */
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return createProtectedRoute(handler, { requireAuth: true });
}

/**
 * Creates a role-based authorization wrapper for API routes
 */
export function withRole(
  requiredRoles: string | string[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return createProtectedRoute(handler, { 
    requireAuth: true, 
    requiredRoles: Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles] 
  });
}

/**
 * Creates a permission-based authorization wrapper for API routes
 */
export function withPermission(
  requiredPermissions: string | string[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return createProtectedRoute(handler, { 
    requireAuth: true, 
    requiredPermissions: Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions] 
  });
}

/**
 * Creates a tenant-scoped authorization wrapper for API routes
 */
export function withTenantAccess(
  allowedTenants: string[] = [],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return createProtectedRoute(handler, { 
    requireAuth: true, 
    allowedTenants 
  });
}

/**
 * Helper to extract user information from authenticated request
 */
export function getUserFromRequest(request: AuthenticatedRequest) {
  return request.user;
}

/**
 * Helper to check if user has specific role
 */
export function hasRole(request: AuthenticatedRequest, role: string): boolean {
  return request.user?.roles.includes(role) || false;
}

/**
 * Helper to check if user has specific permission
 */
export function hasPermission(request: AuthenticatedRequest, permission: string): boolean {
  return request.user?.permissions.includes(permission) || false;
}

/**
 * Helper to get user's tenant
 */
export function getUserTenant(request: AuthenticatedRequest): string | null {
  return request.user?.tenant || null;
}

// Security headers for all responses
function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  };
}