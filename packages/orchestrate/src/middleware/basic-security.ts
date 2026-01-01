/**
 * Basic Security Middleware for MVP
 * Adds essential security headers without requiring external dependencies
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Apply basic security headers to all responses
 * This is a lightweight alternative to helmet for MVP
 */
export function basicSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy for privacy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Don't expose server information
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * CORS configuration for development/MVP
 * Adjust origins for production
 */
export function corsHeaders(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  
  next();
}

/**
 * Apply all basic security middleware
 * Use this in your Express app setup
 */
export function applyBasicSecurity(app: any): void {
  app.use(basicSecurityHeaders);
  app.use(corsHeaders);
  
  console.log('✅ Basic security middleware applied');
}
