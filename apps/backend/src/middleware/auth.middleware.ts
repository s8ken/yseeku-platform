/**
 * Authentication Middleware
 * Integrates SecureAuthService from @sonate/core with Express
 */

import { Request, Response, NextFunction } from 'express';
import { SecureAuthService } from '@sonate/core';
import { User, IUser } from '../models/user.model';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      tenant?: string;
    }
  }
}

// Initialize SecureAuthService (in production, inject via dependency injection)
const authService = new SecureAuthService({
  jwtSecret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  saltRounds: 12,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
});

/**
 * Protect routes - verify JWT token
 */
export async function protect(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
      return;
    }

    // Verify token using SecureAuthService
    const payload = authService.verifyToken(token) as any;
    const userId = payload.userId || payload.sub;
    const email = payload.email;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid token payload: missing user identifier'
      });
      return;
    }

    // Get user from database (exclude password)
    // First try by ID
    let user = await User.findById(userId).select('-password');

    // If not found by ID, try by email (handle users coming from Next.js/Postgres)
    if (!user && email) {
      user = await User.findOne({ email }).select('-password');
      
      // If still not found, create a shadow user in MongoDB so they can store API keys
      if (!user) {
        console.log(`Creating shadow MongoDB user for ${email} (${userId})`);
        try {
          user = await User.create({
            name: payload.username || payload.name || email.split('@')[0],
            email: email,
            password: 'external-auth-no-password-' + Math.random().toString(36),
            apiKeys: [],
          });
        } catch (createError: any) {
          console.error('Failed to create shadow user:', createError);
          // Check if user was created by another concurrent request
          user = await User.findOne({ email }).select('-password');
          if (!user) throw createError;
        }
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found and could not be provisioned'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    req.tenant = payload.tenant || payload.tenant_id || 'default';

    next();
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
      error: error.message
    });
  }
}

/**
 * Admin middleware - check if user has admin role
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
    return;
  }

  // Check if user has admin role (you'll need to add roles to User model)
  // For now, check if email ends with @yseeku.com (temporary solution)
  const isAdmin = req.user.email.endsWith('@yseeku.com');

  if (!isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
    return;
  }

  next();
}

/**
 * Optional auth - doesn't fail if no token
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const payload = authService.verifyToken(token);
      const user = await User.findById(payload.userId).select('-password');

      if (user) {
        req.user = user;
        req.userId = payload.userId;
        req.tenant = payload.tenant;
      }
    }
  } catch (error) {
    // Token is invalid, but we continue without user
    req.user = undefined;
  }

  next();
}

/**
 * Tenant isolation middleware
 */
export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.tenant) {
    res.status(400).json({
      success: false,
      message: 'Tenant context required'
    });
    return;
  }
  next();
}

// Export the auth service instance for use in controllers
export { authService };
