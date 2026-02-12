/**
 * Lightweight JWT Authentication Middleware
 * 
 * Verifies JWT tokens from Authorization header and attaches decoded user
 * to req.user for downstream routes. This is the LIGHTWEIGHT variant that
 * performs JWT-only verification without database lookups or RBAC.
 *
 * For full auth with DB-backed user resolution, tenant isolation, and
 * role-based access control, use `auth.middleware.ts` (SecureAuthService).
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Omit<Request, 'user'> {
  user?: {
    username: string;
    iat?: number;
    exp?: number;
  };
}

export const authMiddleware: any = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header missing' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const token = parts[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not set');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as { username: string; iat?: number; exp?: number };
      (req as any).user = decoded;
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expired' });
      } else if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
      } else {
        res.status(401).json({ error: 'Token verification failed' });
      }
    }
  } catch (err) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

export const optionalAuthMiddleware: any = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not set');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as { username: string; iat?: number; exp?: number };
      (req as any).user = decoded;
    } catch (err) { }

    next();
  } catch (err) {
    next();
  }
};
