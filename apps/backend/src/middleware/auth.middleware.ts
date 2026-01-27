/**
 * Authentication Middleware
 * Integrates SecureAuthService from @sonate/core with Express
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { SecureAuthService } from '@sonate/core';
import { User, IUser } from '../models/user.model';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      tenant?: string;
      userTenant?: string;
      userEmail?: string;
      sessionId?: string;
    }
  }
}

// Initialize SecureAuthService
if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET is not set. A random secret will be generated, which may cause session invalidation on restart.');
}

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
  const requestId = Math.random().toString(36).substring(7);
  logger.debug('Processing auth request', { requestId, path: req.path });

  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.debug('No token provided', { requestId, path: req.path });
      res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
      return;
    }

    // Verify token using SecureAuthService
    let payload: any;
    try {
      payload = authService.verifyToken(token);
      logger.debug('Token verified', { requestId, username: payload.username || 'unknown' });
    } catch (verifyError: any) {
      logger.warn('Token verification failed', {
        requestId,
        error: verifyError.message
      });
      res.status(401).json({
        success: false,
        message: `Token verification failed: ${verifyError.message}`,
        code: 'INVALID_TOKEN'
      });
      return;
    }

    const userId = payload.userId || payload.sub;
    const email = payload.email;

    if (!userId) {
      logger.error('Invalid token payload: missing userId', { requestId });
      res.status(401).json({
        success: false,
        message: 'Invalid token payload: missing user identifier'
      });
      return;
    }

    // Get user from database (exclude password)
    // First try by ID (if it's a valid MongoDB ObjectId)
    let user;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      try {
        user = await User.findById(userId).select('-password');
      } catch (dbError: any) {
        logger.error('DB error finding user by ID', { requestId, userId, error: dbError });
        // Don't fail yet, try by email
      }
    }

    // If not found by ID, try by email (handle users coming from Next.js/Postgres)
    if (!user && email) {
      logger.debug('User not found by ID, trying email', { requestId, email });
      try {
        user = await User.findOne({ email }).select('-password');
      } catch (dbError: any) {
        logger.error('DB error finding user by email', { requestId, email, error: dbError });
      }

      // If still not found, create a shadow user in MongoDB so they can store API keys
      if (!user) {
        logger.info('Creating shadow MongoDB user', { requestId, email, userId });
        try {
          user = await User.create({
            name: payload.username || payload.name || email.split('@')[0],
            email: email,
            password: 'external-auth-no-password-' + Math.random().toString(36),
            apiKeys: [],
          });
          logger.info('Shadow user created', { requestId, userId: user._id });
        } catch (createError: any) {
          logger.error('Failed to create shadow user', { requestId, error: createError });
          // Check if user was created by another concurrent request
          try {
            user = await User.findOne({ email }).select('-password');
          } catch (retryError) {
             logger.error('Retry find failed', { requestId, error: retryError });
          }
          
          if (!user) {
             // Return 500 here but with JSON
             res.status(500).json({
               success: false,
               message: 'Failed to provision user account',
               details: createError.message
             });
             return;
          }
        }
      }
    }

    if (!user) {
      logger.error('User not found and could not be provisioned', { requestId });
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
    req.userTenant = req.tenant; // Alias for compatibility
    req.userEmail = user.email;
    req.sessionId = payload.session_id || payload.sessionId;

    logger.debug('Auth successful', { requestId, email: user.email, tenant: req.tenant });
    next();
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('CRITICAL AUTH ERROR', {
      requestId,
      message: getErrorMessage(error),
      stack: err?.stack,
      name: err?.name
    });

    // Ensure we always return JSON even for 500s
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: `Authentication middleware error: ${getErrorMessage(error)}`,
        error: getErrorMessage(error),
        details: err?.stack,
        requestId
      });
    }
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

  // Check if user has admin role
  const isAdmin = req.user.role === 'admin' || req.user.email.endsWith('@yseeku.com');

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
