/**
 * Security Utility Functions for YSEEKU Web Application
 * Provides client IP detection and other security utilities
 */

import { NextRequest } from 'next/server';

/**
 * Extract client IP address from request
 * Handles various proxy headers and fallback scenarios
 */
export function getClientIp(request: NextRequest): string {
  // Check common proxy headers in order of reliability
  const headers = [
    'x-forwarded-for',      // Most common proxy header
    'x-real-ip',           // Nginx proxy header
    'x-client-ip',         // Custom proxy header
    'cf-connecting-ip',    // Cloudflare
    'x-forwarded',         // Generic forwarded
    'forwarded-for',       // RFC 7239
    'x-cluster-client-ip', // Kubernetes
    'x-proxy-user-ip',     // Custom proxy
    'x-original-source', // Azure Application Gateway
  ];

  // Check headers for IP address
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Handle comma-separated IPs (take the first one)
      const ip = value.split(',')[0].trim();
      if (isValidIp(ip)) {
        return ip;
      }
    }
  }

  // Fallback to socket address (if available in production)
  // Note: This might not work in all environments
  return 'unknown';
}

/**
 * Validate IP address format
 */
function isValidIp(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Validate request origin for CSRF protection
 */
export function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // If no origin or referer, allow (some legitimate requests don't have these)
  if (!origin && !referer) {
    return true;
  }
  
  // In production, validate against allowed origins
  // This is a simplified check - implement proper origin validation
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://yseeku-platform.vercel.app'
  ].filter(Boolean);
  
  if (origin) {
    return allowedOrigins.some(allowed => origin.includes(allowed));
  }
  
  if (referer) {
    return allowedOrigins.some(allowed => referer.includes(allowed));
  }
  
  return false;
}

/**
 * Rate limiting key generation
 */
export function getRateLimitKey(request: NextRequest): string {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a hash of IP + User Agent for rate limiting
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Basic XSS prevention - remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common or weak');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate secure token for password reset, email verification, etc.
 */
export function generateSecureToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Check if request is from a bot (basic detection)
 */
export function isBotRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
    'java/', 'httpclient', 'apache-httpclient', 'okhttp', 'postman'
  ];
  
  return botPatterns.some(pattern => userAgent.includes(pattern));
}

/**
 * Get request fingerprint for tracking
 */
export function getRequestFingerprint(request: NextRequest): string {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const accept = request.headers.get('accept') || 'unknown';
  const acceptLanguage = request.headers.get('accept-language') || 'unknown';
  const acceptEncoding = request.headers.get('accept-encoding') || 'unknown';
  
  // Create a fingerprint hash
  const crypto = require('crypto');
  const fingerprintData = `${ip}:${userAgent}:${accept}:${acceptLanguage}:${acceptEncoding}`;
  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
}