/**
 * Tests for error-handler.ts middleware
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, NotFoundError, AppError } from '../../middleware/error-handler';
import { ValidationError } from '../../middleware/validation.middleware';
import mongoose from 'mongoose';

// Mock logger to prevent console output during tests
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

// Mock the error-utils module
jest.mock('../../utils/error-utils', () => ({
  getErrorMessage: (err: any) => err.message || 'An error occurred',
}));

const mockRequest = () =>
({
  method: 'GET',
  path: '/test',
  requestId: 'test-req-id',
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('test-agent'),
} as unknown as Request);

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    headersSent: false,
  };
  return res as Response;
};

const mockNext = jest.fn() as NextFunction;

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle ValidationError with 400 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new ValidationError('Validation failed', [
      { path: 'email', message: 'Invalid email format' },
    ]);

    errorHandler(error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Validation failed',
        }),
      })
    );
  });

  it('should handle AppError with custom status code', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new AppError('Custom error', 403);

    errorHandler(error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Custom error',
        }),
      })
    );
  });

  it('should handle NotFoundError with 404 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new NotFoundError('Resource not found');

    errorHandler(error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Resource not found',
        }),
      })
    );
  });

  it('should handle Mongoose CastError with 400 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new mongoose.Error.CastError('ObjectId', 'invalid-id', '_id');

    errorHandler(error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it('should handle Mongoose ValidationError with 400 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new mongoose.Error.ValidationError();
    error.errors = {
      email: new mongoose.Error.ValidatorError({
        path: 'email',
        message: 'Invalid email',
        type: 'required',
        value: '',
      }),
    };

    errorHandler(error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it('should handle duplicate key error (11000) with 400 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    // MongoDB duplicate key errors have .code = 11000 but are not standard Error instances
    const error = Object.assign(new Error('duplicate key'), {
      code: 11000,
      keyValue: { email: 'test@example.com' },
      statusCode: 400,
    });

    errorHandler(error as unknown as Error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it('should handle JWT errors with 401 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = Object.assign(new Error('invalid token'), {
      name: 'JsonWebTokenError',
    });

    errorHandler(error as Error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.any(String),
        }),
      })
    );
  });

  it('should handle TokenExpiredError with 401 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = Object.assign(new Error('jwt expired'), {
      name: 'TokenExpiredError',
    });

    errorHandler(error as Error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.any(String),
        }),
      })
    );
  });

  it('should handle generic errors with 500 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error('Something went wrong');

    errorHandler(error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it('should include requestId in response', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error('Test error');

    errorHandler(error, req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          requestId: 'test-req-id',
        }),
      })
    );
  });
});

describe('AppError', () => {
  it('should create error with default values', () => {
    const error = new AppError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('should create error with custom status code', () => {
    const error = new AppError('Not found', 404);
    expect(error.statusCode).toBe(404);
  });
});

describe('NotFoundError', () => {
  it('should create 404 error', () => {
    const error = new NotFoundError('User not found');
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
  });

  it('should have default message', () => {
    const error = new NotFoundError();
    expect(error.message).toBe('Route not found');
  });
});
