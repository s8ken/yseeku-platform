import { NextRequest } from 'next/server';

/**
 * Extract client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  // Check for forwarded headers first (when behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  // Check for other common headers
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Check for Cloudflare headers
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to socket address (may not be accurate behind proxy)
  // Note: In Next.js, we can't directly access the socket, so we'll use a placeholder
  return request.headers.get('x-forwarded-for') || 'unknown';
}

/**
 * Generate a secure random string
 */
export function generateSecureRandomString(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use Web Crypto API in browser
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
  } else if (typeof require !== 'undefined') {
    // Use Node.js crypto in server environment
    try {
      const crypto = require('crypto');
      const bytes = crypto.randomBytes(length);
      
      for (let i = 0; i < length; i++) {
        result += charset[bytes[i] % charset.length];
      }
    } catch (error) {
      // Fallback to Math.random (less secure)
      for (let i = 0; i < length; i++) {
        result += charset[Math.floor(Math.random() * charset.length)];
      }
    }
  } else {
    // Fallback to Math.random (least secure)
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  
  return result;
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters and patterns
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[\"'&]/g, '') // Remove quotes and ampersands
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a secure hash of sensitive data (for logging, not passwords)
 */
export function createSecureHash(data: string, salt: string = ''): string {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Use Web Crypto API in browser
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + salt);
    
    return crypto.subtle.digest('SHA-256', dataBuffer).then(hash => {
      const hashArray = new Uint8Array(hash);
      return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    }).toString();
  } else if (typeof require !== 'undefined') {
    // Use Node.js crypto in server environment
    try {
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(data + salt).digest('hex');
    } catch (error) {
      // Fallback to simple hash (not cryptographically secure)
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
    }
  } else {
    // Fallback to simple hash (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Security headers that should be added to all responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none'
  };
}

/**
 * Add security headers to a NextResponse
 */
export function addSecurityHeaders(response: Response): void {
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Remove potentially sensitive headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
}