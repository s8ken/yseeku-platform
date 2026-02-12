/**
 * Authentication Routes
 * 
 * POST /api/v2/auth/login - Login with username/password
 * POST /api/v2/auth/refresh - Refresh JWT token
 * POST /api/v2/auth/logout - Logout (client-side)
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SecureAuthService } from '@sonate/core';

const router = Router();

// Use the same auth service config as the middleware
const authService = new SecureAuthService({
  jwtSecret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
});

interface LoginRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

interface TokenResponse {
  token: string;
  expiresIn: number;
  user: {
    username: string;
  };
}

// Simple user store (in production, use database)
const VALID_USERS = new Map<string, string>([
  ['admin', 'changeme'], // Default credentials
  ['demo', 'demo123'],
]);

/**
 * POST /api/v2/auth/login
 * Login with username and password
 */
router.post('/login', (req: LoginRequest, res: Response): void => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    const storedPassword = VALID_USERS.get(username);
    
    // Simple password check (in production, use bcrypt)
    if (!storedPassword || storedPassword !== password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not set');
    }
    const expiresIn = '24h';

    const token = jwt.sign(
      { username },
      jwtSecret,
      { expiresIn }
    );

    const decodedToken = jwt.decode(token) as { exp?: number; iat?: number };
    const expiresInSeconds = decodedToken.exp && decodedToken.iat 
      ? (decodedToken.exp - decodedToken.iat) 
      : 86400; // 24 hours in seconds

    const response: TokenResponse = {
      token,
      expiresIn: expiresInSeconds,
      user: { username },
    };

    res.json(response);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/v2/auth/refresh
 * Refresh JWT token (accepts current token, returns new token)
 */
router.post('/refresh', (req: Request, res: Response): void => {
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
      // Use ignoreExpiration to allow refreshing expired tokens
      const decoded = jwt.verify(token, jwtSecret, { ignoreExpiration: true }) as { username: string };
      
      // Generate new token
      const newToken = jwt.sign(
        { username: decoded.username },
        jwtSecret,
        { expiresIn: '24h' }
      );

      const decodedNewToken = jwt.decode(newToken) as { exp?: number; iat?: number };
      const expiresInSeconds = decodedNewToken.exp && decodedNewToken.iat 
        ? (decodedNewToken.exp - decodedNewToken.iat) 
        : 86400;

      const response: TokenResponse = {
        token: newToken,
        expiresIn: expiresInSeconds,
        user: { username: decoded.username },
      };

      res.json(response);
    } catch (err) {
      res.status(401).json({ error: 'Token refresh failed' });
    }
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

/**
 * POST /api/v2/auth/logout
 * Logout endpoint (for client to clear token)
 */
router.post('/logout', (_req: Request, res: Response): void => {
  // JWT is stateless, so logout is client-side (clear token)
  // This endpoint exists for API completeness
  res.json({ message: 'Logged out. Please clear your token client-side.' });
});

/**
 * POST /api/v2/auth/guest
 * Create a guest session for demo access
 */
router.post('/guest', (_req: Request, res: Response): void => {
  try {
    const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
    const guestEmail = `${guestId}@guest.yseeku.com`;
    
    // Use SecureAuthService to generate tokens (same as auth middleware uses to verify)
    const tokens = authService.generateTokens({
      id: guestId,
      username: 'Guest User',
      email: guestEmail,
      roles: ['guest'],
      tenant: 'demo',
    });

    res.status(201).json({
      success: true,
      message: 'Guest access granted',
      data: {
        user: {
          id: guestId,
          name: 'Guest User',
          email: guestEmail,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 86400,
        },
      },
      token: tokens.accessToken, // For backwards compatibility
    });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during guest login' 
    });
  }
});

/**
 * GET /api/v2/auth/me
 * Get current user info from token
 */
router.get('/me', (req: Request, res: Response): void => {
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
      
      res.json({
        user: {
          username: decoded.username,
          issuedAt: new Date(decoded.iat ? decoded.iat * 1000 : 0).toISOString(),
          expiresAt: new Date(decoded.exp ? decoded.exp * 1000 : 0).toISOString(),
        },
      });
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
