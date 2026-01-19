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

// Mock Request, Response, and NextFunction
const mockRequest = (data: { body?: unknown; query?: unknown; params?: unknown } = {}) => ({
  body: data.body || {},
  query: data.query || {},
  params: data.params || {},
}) as Request;

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const mockNext = jest.fn() as NextFunction;

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

  it('should pass validation with valid body', async () => {
    const req = mockRequest({ body: { name: 'John', email: 'john@example.com' } });
    const res = mockResponse();
    const middleware = validateBody(TestBodySchema);

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should fail validation with invalid body', async () => {
    const req = mockRequest({ body: { name: '', email: 'invalid' } });
    const res = mockResponse();
    const middleware = validateBody(TestBodySchema);

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('should transform and coerce values', async () => {
    const req = mockRequest({ body: { name: 'John', email: 'john@example.com', age: '25' } });
    const res = mockResponse();
    
    const SchemaWithCoerce = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.coerce.number().optional(),
    });
    
    const middleware = validateBody(SchemaWithCoerce);

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.body.age).toBe(25);
  });
});

describe('validateQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass validation with valid query', async () => {
    const req = mockRequest({ query: { page: '1', limit: '10' } });
    const res = mockResponse();
    const middleware = validateQuery(TestQuerySchema);

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.query.page).toBe(1);
    expect(req.query.limit).toBe(10);
  });

  it('should apply default values', async () => {
    const req = mockRequest({ query: {} });
    const res = mockResponse();
    const middleware = validateQuery(TestQuerySchema);

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.query.page).toBe(1);
    expect(req.query.limit).toBe(10);
  });

  it('should fail validation with invalid query', async () => {
    const req = mockRequest({ query: { page: '0', limit: '200' } });
    const res = mockResponse();
    const middleware = validateQuery(TestQuerySchema);

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
  });
});

describe('validateParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass validation with valid params', async () => {
    const req = mockRequest({ params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const middleware = validateParams(TestParamsSchema);

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should fail validation with invalid params', async () => {
    const req = mockRequest({ params: { id: 'invalid-id' } });
    const res = mockResponse();
    const middleware = validateParams(TestParamsSchema);

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
  });
});

describe('validateRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate body, query, and params together', async () => {
    const req = mockRequest({
      body: { name: 'John', email: 'john@example.com' },
      query: { page: '2' },
      params: { id: '507f1f77bcf86cd799439011' },
    });
    const res = mockResponse();
    const middleware = validateRequest({
      body: TestBodySchema,
      query: TestQuerySchema,
      params: TestParamsSchema,
    });

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should fail if any validation fails', async () => {
    const req = mockRequest({
      body: { name: 'John', email: 'john@example.com' },
      query: { page: '0' }, // Invalid
      params: { id: '507f1f77bcf86cd799439011' },
    });
    const res = mockResponse();
    const middleware = validateRequest({
      body: TestBodySchema,
      query: TestQuerySchema,
      params: TestParamsSchema,
    });

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
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
});
