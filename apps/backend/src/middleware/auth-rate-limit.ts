/**
 * Authentication Rate Limiting Middleware
 * Protects authentication endpoints from brute force attacks
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login endpoint
 * 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per window (increased for initial setup)
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: false, // Count failed requests
});

/**
 * Rate limiter for registration endpoint
 * 3 registrations per hour per IP
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: {
    success: false,
    message: 'Too many registration attempts from this IP. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset endpoint
 * 3 attempts per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General auth endpoint rate limiter
 * 20 requests per 5 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});