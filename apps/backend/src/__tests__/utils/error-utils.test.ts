/**
 * Tests for error-utils.ts
 */

import { 
  getErrorMessage, 
  getErrorStack, 
  isError,
  isErrorLike,
  normalizeError,
  handleError
} from '../../utils/error-utils';

describe('getErrorMessage', () => {
  it('should extract message from Error object', () => {
    const error = new Error('Test error message');
    expect(getErrorMessage(error)).toBe('Test error message');
  });

  it('should return string as-is', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should extract message property from object', () => {
    expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
  });

  it('should return default message for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
  });

  it('should return default message for null', () => {
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
  });

  it('should return default message for numbers', () => {
    expect(getErrorMessage(123)).toBe('An unknown error occurred');
  });
});

describe('getErrorStack', () => {
  it('should extract stack from Error object', () => {
    const error = new Error('Test error');
    expect(getErrorStack(error)).toContain('Error: Test error');
  });

  it('should return undefined for non-Error objects', () => {
    expect(getErrorStack('string error')).toBeUndefined();
    expect(getErrorStack({ message: 'object error' })).toBeUndefined();
  });
});

describe('isError', () => {
  it('should return true for Error instances', () => {
    expect(isError(new Error('test'))).toBe(true);
    expect(isError(new TypeError('test'))).toBe(true);
  });

  it('should return false for non-Error objects', () => {
    expect(isError('string')).toBe(false);
    expect(isError({ message: 'test' })).toBe(false);
    expect(isError(null)).toBe(false);
  });
});

describe('isErrorLike', () => {
  it('should return true for objects with message property', () => {
    expect(isErrorLike({ message: 'test' })).toBe(true);
    expect(isErrorLike({ message: 'test', code: 'ERR' })).toBe(true);
  });

  it('should return false for objects without message', () => {
    expect(isErrorLike({ code: 'ERR' })).toBe(false);
    expect(isErrorLike(null)).toBe(false);
    expect(isErrorLike('string')).toBe(false);
  });
});

describe('normalizeError', () => {
  it('should normalize Error to consistent structure', () => {
    const error = new Error('Test error');
    const normalized = normalizeError(error);
    
    expect(normalized).toEqual({
      message: 'Test error',
      name: 'Error',
      stack: expect.stringContaining('Error: Test error'),
    });
  });

  it('should handle error-like objects', () => {
    const normalized = normalizeError({ message: 'Object error' });
    expect(normalized).toEqual({
      message: 'Object error',
      name: 'Error',
      details: { message: 'Object error' },
    });
  });

  it('should preserve error properties', () => {
    const customError = Object.assign(new Error('Custom error'), {
      code: 'CUSTOM_CODE',
      statusCode: 400,
    });
    const normalized = normalizeError(customError);
    
    expect(normalized.code).toBe('CUSTOM_CODE');
    expect(normalized.status).toBe(400);
  });

  it('should handle unknown error types', () => {
    const normalized = normalizeError(undefined);
    expect(normalized).toEqual({
      message: 'An unknown error occurred',
      name: 'UnknownError',
      details: undefined,
    });
  });
});

describe('handleError', () => {
  it('should return normalized error', () => {
    const error = new Error('Test error');
    const result = handleError(error);
    
    expect(result.message).toBe('Test error');
    expect(result.name).toBe('Error');
  });
});
