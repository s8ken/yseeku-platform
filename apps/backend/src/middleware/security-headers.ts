/**
 * Security Headers Middleware
 * 
 * Adds comprehensive security headers beyond what Helmet provides.
 * Implements CSP, permissions policy, and other security best practices.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Content Security Policy configuration
 * Restricts sources for scripts, styles, images, etc.
 */
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for some frontend frameworks
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': ["'self'", 'wss:', 'ws:', 'https://api.anthropic.com', 'https://api.openai.com'],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Permissions Policy configuration
 * Controls browser features available to the page
 */
const PERMISSIONS_POLICY = {
  'accelerometer': [],
  'camera': [],
  'geolocation': [],
  'gyroscope': [],
  'magnetometer': [],
  'microphone': [],
  'payment': [],
  'usb': [],
  'interest-cohort': [], // Disable FLoC
};

/**
 * Build CSP header string from directives
 */
function buildCSP(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Build Permissions-Policy header string
 */
function buildPermissionsPolicy(policies: Record<string, string[]>): string {
  return Object.entries(policies)
    .map(([key, values]) => {
      if (values.length === 0) return `${key}=()`;
      return `${key}=(${values.join(' ')})`;
    })
    .join(', ');
}

/**
 * Security headers middleware
 * Adds comprehensive security headers to all responses
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', buildCSP(CSP_DIRECTIVES));
  
  // Permissions Policy (formerly Feature-Policy)
  res.setHeader('Permissions-Policy', buildPermissionsPolicy(PERMISSIONS_POLICY));
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection (legacy, but still useful for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cross-Origin policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Cache control for sensitive endpoints
  if (req.path.includes('/api/auth') || req.path.includes('/api/secrets')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * API-specific security headers
 * Less restrictive CSP for API endpoints
 */
export function apiSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent caching of API responses by default
  res.setHeader('Cache-Control', 'no-store');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
}

export default securityHeaders;