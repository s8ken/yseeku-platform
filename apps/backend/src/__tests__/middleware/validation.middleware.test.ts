/**
 * Tests for validation.middleware.ts
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
  ValidationError
} from '../../middleware/validation.middleware';

// Mock logger
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Request, Response, and NextFunction
const mockRequest = (data: { body?: unknown; query?: unknown; params?: unknown } = {}) => ({
  body: data.body || {},
  query: data.query || {},
  params: data.params || {},
  path: '/test',
  method: 'POST',
}) as Request;

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

// Test schemas
const TestBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional(),
});

const TestQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

const TestParamsSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid MongoDB ObjectId'),
});

describe('validateBody', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass validation with valid body', () => {
    const req = mockRequest({ body: { name: 'John', email: 'john@example.com' } });
    const res = mockResponse();
    const next = jest.fn();
    const middleware = validateBody(TestBodySchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should fail validation with invalid body and send 400 response', () => {
    const req = mockRequest({ body: { name: '', email: 'invalid' } });
    const res = mockResponse();
    const next = jest.fn();
    const middleware = validateBody(TestBodySchema);

    middleware(req, res, next);

    // Middleware sends res.status(400).json() directly, does NOT call next
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.any(Array),
        }),
      })
    );
  });

  it('should transform and coerce values', () => {
    const req = mockRequest({ body: { name: 'John', email: 'john@example.com', age: '25' } });
    const res = mockResponse();
    const next = jest.fn();

    const SchemaWithCoerce = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.coerce.number().optional(),
    });

    const middleware = validateBody(SchemaWithCoerce);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.age).toBe(25);
  });
});

describe('validateQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass validation with valid query', () => {
    const req = mockRequest({ query: { page: '1', limit: '10' } });
    const res = mockResponse();
    const next = jest.fn();
    const middleware = validateQuery(TestQuerySchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query.page).toBe(1);
    expect(req.query.limit).toBe(10);
  });

  it('should apply default values', () => {
    const req = mockRequest({ query: {} });
    const res = mockResponse();
    const next = jest.fn();
    const middleware = validateQuery(TestQuerySchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query.page).toBe(1);
    expect(req.query.limit).toBe(10);
  });

  it('should fail validation with invalid query and send 400 response', () => {
    const req = mockRequest({ query: { page: '0', limit: '200' } });
    const res = mockResponse();
    const next = jest.fn();
    const middleware = validateQuery(TestQuerySchema);

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
  });
});

describe('validateParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass validation with valid params', () => {
    const req = mockRequest({ params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = jest.fn();
    const middleware = validateParams(TestParamsSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should fail validation with invalid params and send 400 response', () => {
    const req = mockRequest({ params: { id: 'invalid-id' } });
    const res = mockResponse();
    const next = jest.fn();
    const middleware = validateParams(TestParamsSchema);

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate body, query, and params together', () => {
    const req = mockRequest({
      body: { name: 'John', email: 'john@example.com' },
      query: { page: '2' },
      params: { id: '507f1f77bcf86cd799439011' },
    });
    const res = mockResponse();
    const next = jest.fn();
    const middleware = validateRequest({
      body: TestBodySchema,
      query: TestQuerySchema,
      params: TestParamsSchema,
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should fail if any validation fails and send 400 response', () => {
    const req = mockRequest({
      body: { name: 'John', email: 'john@example.com' },
      query: { page: '0' }, // Invalid
      params: { id: '507f1f77bcf86cd799439011' },
    });
    const res = mockResponse();
    const next = jest.fn();
    const middleware = validateRequest({
      body: TestBodySchema,
      query: TestQuerySchema,
      params: TestParamsSchema,
    });

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.any(Array),
        }),
      })
    );
  });
});

describe('ValidationError', () => {
  it('should create error with correct properties', () => {
    const details = [{ path: 'email', message: 'Invalid email format' }];
    const error = new ValidationError('Validation failed', details);

    expect(error.message).toBe('Validation failed');
    expect(error.details).toEqual(details);
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('ValidationError');
  });

  it('should have default message', () => {
    const error = new ValidationError();
    expect(error.message).toBe('Request validation failed');
    expect(error.details).toBeUndefined();
  });
});
