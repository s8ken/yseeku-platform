"use strict";
/**
 * Authentication Rate Limiting Middleware
 * Protects authentication endpoints from brute force attacks
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.passwordResetRateLimiter = exports.registerRateLimiter = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Rate limiter for login endpoint
 * 5 attempts per 15 minutes per IP
 */
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
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
exports.registerRateLimiter = (0, express_rate_limit_1.default)({
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
exports.passwordResetRateLimiter = (0, express_rate_limit_1.default)({
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
exports.authRateLimiter = (0, express_rate_limit_1.default)({
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
