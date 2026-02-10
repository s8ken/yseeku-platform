/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT tokens from Authorization header
 * Attaches decoded user to req.user for downstream routes
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    username: string;
    iat?: number;
    exp?: number;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
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
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

    try {
      const decoded = jwt.verify(token, jwtSecret) as { username: string; iat?: number; exp?: number };
      req.user = decoded;
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

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
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
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

    try {
      const decoded = jwt.verify(token, jwtSecret) as { username: string; iat?: number; exp?: number };
      req.user = decoded;
    } catch (err) {
      // Skip auth if token is invalid, don't block request
      console.log('Optional auth: Invalid token, continuing without auth');
    }
    
    next();
  } catch (err) {
    next();
  }
};
