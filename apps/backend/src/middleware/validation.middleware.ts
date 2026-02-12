/**
 * Request Validation Middleware
 * 
 * Uses Zod schemas to validate request bodies, query params, and route params.
 * Provides consistent validation error responses.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import logger from '../utils/logger';

/**
 * Validation error response format
 */
interface ValidationErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: Array<{
      path: string;
      message: string;
      code: string;
    }>;
  };
}

/**
 * Format Zod errors into a consistent structure
 */
function formatZodError(error: ZodError): ValidationErrorResponse {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.issues.map((err: z.ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    },
  };
}

/**
 * Middleware factory for validating request body
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        logger.warn('Request body validation failed', {
          path: req.path,
          method: req.method,
          errors: result.error.issues,
        });

        res.status(400).json(formatZodError(result.error));
        return;
      }

      // Replace body with parsed/transformed data
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error', { error });
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Validation failed unexpectedly' },
      });
    }
  };
}

/**
 * Middleware factory for validating query parameters
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        logger.warn('Query params validation failed', {
          path: req.path,
          method: req.method,
          errors: result.error.issues,
        });

        res.status(400).json(formatZodError(result.error));
        return;
      }

      // Replace query with parsed/transformed data
      req.query = result.data as typeof req.query;
      next();
    } catch (error) {
      logger.error('Query validation middleware error', { error });
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Validation failed unexpectedly' },
      });
    }
  };
}

/**
 * Middleware factory for validating route parameters
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        logger.warn('Route params validation failed', {
          path: req.path,
          method: req.method,
          errors: result.error.issues,
        });

        res.status(400).json(formatZodError(result.error));
        return;
      }

      req.params = result.data as typeof req.params;
      next();
    } catch (error) {
      logger.error('Params validation middleware error', { error });
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Validation failed unexpectedly' },
      });
    }
  };
}

/**
 * Combined validation for body, query, and params
 */
export function validate<
  TBody extends ZodSchema = z.ZodAny,
  TQuery extends ZodSchema = z.ZodAny,
  TParams extends ZodSchema = z.ZodAny
>(schemas: {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ location: string; issues: z.ZodIssue[] }> = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push({ location: 'params', issues: result.error.issues });
      } else {
        req.params = result.data as typeof req.params;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push({ location: 'query', issues: result.error.issues });
      } else {
        req.query = result.data as typeof req.query;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push({ location: 'body', issues: result.error.issues });
      } else {
        req.body = result.data;
      }
    }

    if (errors.length > 0) {
      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors.flatMap((e) =>
            e.issues.map((issue) => ({
              location: e.location,
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            }))
          ),
        },
      });
      return;
    }

    next();
  };
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details?: Array<{ path: string; message: string }>;

  constructor(message = 'Request validation failed', details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export const validateRequest = validate;

export default { validateBody, validateQuery, validateParams, validate };
