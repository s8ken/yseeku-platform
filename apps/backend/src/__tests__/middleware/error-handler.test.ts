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

const mockRequest = () => ({ method: 'GET', path: '/test' }) as Request;

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
        error: 'Validation Error',
        details: expect.any(Array),
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
        error: 'Custom error',
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
        error: 'Resource not found',
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
        error: expect.stringContaining('Invalid'),
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
        error: 'Validation Error',
        details: expect.any(Array),
      })
    );
  });

  it('should handle duplicate key error (11000) with 400 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = { code: 11000, keyValue: { email: 'test@example.com' } };

    errorHandler(error as unknown as Error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('already exists'),
      })
    );
  });

  it('should handle JWT errors with 401 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = { name: 'JsonWebTokenError', message: 'invalid token' };

    errorHandler(error as Error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid token',
      })
    );
  });

  it('should handle TokenExpiredError with 401 status', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = { name: 'TokenExpiredError', message: 'jwt expired' };

    errorHandler(error as Error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Token expired',
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
        error: 'Internal Server Error',
      })
    );
  });

  it('should not send response if headers already sent', () => {
    const req = mockRequest();
    const res = mockResponse();
    res.headersSent = true;
    const error = new Error('Test error');

    errorHandler(error, req, res, mockNext);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(error);
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
    expect(error.message).toBe('Resource not found');
  });
});
