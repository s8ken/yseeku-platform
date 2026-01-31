/**
 * Input Validation & Sanitization Middleware
 * 
 * Provides comprehensive input validation and sanitization for API requests.
 * Protects against common injection attacks and malformed input.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError, ZodIssue } from 'zod';
import logger from '../utils/logger';

/**
 * Common validation schemas
 */
export const schemas = {
  // UUID/ObjectId validation
  objectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId format'),
  uuid: z.string().uuid('Invalid UUID format'),
  
  // String sanitization
  safeString: z.string()
    .max(10000, 'String too long')
    .transform(s => s.trim())
    .transform(s => s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')) // Remove script tags
    .transform(s => s.replace(/javascript:/gi, '')), // Remove javascript: protocol
  
  // Email validation
  email: z.string().email('Invalid email format').max(255),
  
  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, { message: 'Password must contain uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain number' }),
  
  // Tenant ID validation
  tenantId: z.string()
    .max(100)
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid tenant ID format'),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
  
  // Message content
  messageContent: z.string()
    .min(1, 'Message cannot be empty')
    .max(32000, 'Message too long')
    .transform(s => s.trim()),
  
  // Agent configuration
  agentConfig: z.object({
    name: z.string().min(1).max(100).transform(s => s.trim()),
    description: z.string().max(1000).optional(),
    provider: z.enum(['openai', 'anthropic', 'google', 'local']),
    model: z.string().min(1).max(100),
    systemPrompt: z.string().max(10000).optional(),
    temperature: z.number().min(0).max(2).optional().default(0.7),
    maxTokens: z.number().int().min(1).max(128000).optional().default(4096),
  }),
  
  // Trust evaluation request
  trustEvaluation: z.object({
    content: z.string().min(1).max(32000),
    sessionId: z.string().optional(),
    agentId: z.string().optional(),
    context: z.record(z.string(), z.unknown()).optional(),
  }),
  
  // Conversation creation
  conversationCreate: z.object({
    title: z.string().min(1).max(200).transform(s => s.trim()),
    agentId: z.string().optional(),
  }),
  
  // Webhook configuration
  webhookConfig: z.object({
    url: z.string().url('Invalid webhook URL'),
    events: z.array(z.string()).min(1),
    secret: z.string().min(16).max(256).optional(),
    active: z.boolean().optional().default(true),
  }),
};

/**
 * Validation error response
 */
interface ValidationErrorResponse {
  success: false;
  error: 'Validation Error';
  message: string;
  details: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Format Zod errors into a user-friendly response
 */
function formatZodError(error: ZodError<unknown>): ValidationErrorResponse {
  const issues: ZodIssue[] = error.issues || [];
  return {
    success: false,
    error: 'Validation Error',
    message: 'Request validation failed',
    details: issues.map((issue: ZodIssue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

/**
 * Create validation middleware for request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Request body validation failed', {
          path: req.path,
          issues: error.issues,
        });
        res.status(400).json(formatZodError(error));
        return;
      }
      next(error);
    }
  };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Request query validation failed', {
          path: req.path,
          issues: error.issues,
        });
        res.status(400).json(formatZodError(error));
        return;
      }
      next(error);
    }
  };
}

/**
 * Create validation middleware for URL parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Request params validation failed', {
          path: req.path,
          issues: error.issues,
        });
        res.status(400).json(formatZodError(error));
        return;
      }
      next(error);
    }
  };
}

/**
 * Sanitize string input - removes potentially dangerous content
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (except for images)
    .replace(/data:(?!image\/)/gi, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Deep sanitize object - recursively sanitizes all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) :
        item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Global input sanitization middleware
 * Applies basic sanitization to all request bodies
 */
export function globalSanitization(req: Request, res: Response, next: NextFunction): void {
  // Sanitize body if present
  if (req.body && typeof req.body === 'object') {
    // Don't sanitize file uploads or specific content types
    const contentType = req.header('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      req.body = sanitizeObject(req.body);
    }
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query as Record<string, unknown>) as any;
  }
  
  next();
}

/**
 * SQL injection detection (for logging/alerting purposes)
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--)|(\/\*)|(\*\/)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /'\s*(OR|AND)\s+'[^']*'\s*=\s*'[^']*'/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * NoSQL injection detection
 */
export function detectNoSQLInjection(input: string): boolean {
  const nosqlPatterns = [
    /\$where/i,
    /\$gt|\$lt|\$gte|\$lte|\$ne|\$in|\$nin|\$or|\$and|\$not|\$nor/i,
    /\$regex/i,
    /\$exists/i,
  ];
  
  return nosqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Injection detection middleware - logs potential attacks
 */
export function injectionDetection(req: Request, res: Response, next: NextFunction): void {
  const checkValue = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      if (detectSQLInjection(value)) {
        logger.warn('Potential SQL injection detected', {
          path: req.path,
          field: path,
          ip: req.ip,
          userId: (req as any).userId,
        });
      }
      if (detectNoSQLInjection(value)) {
        logger.warn('Potential NoSQL injection detected', {
          path: req.path,
          field: path,
          ip: req.ip,
          userId: (req as any).userId,
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, `${path}.${key}`);
      }
    }
  };
  
  if (req.body) checkValue(req.body, 'body');
  if (req.query) checkValue(req.query, 'query');
  if (req.params) checkValue(req.params, 'params');
  
  next();
}

export default {
  schemas,
  validateBody,
  validateQuery,
  validateParams,
  sanitizeString,
  sanitizeObject,
  globalSanitization,
  injectionDetection,
};