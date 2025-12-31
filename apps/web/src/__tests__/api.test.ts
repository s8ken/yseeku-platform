import { describe, it, expect, vi } from 'vitest';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, forbiddenResponse } from '../lib/api-response';

vi.mock('../lib/db', () => ({
  getPool: vi.fn(() => null),
}));

describe('API Response Helpers', () => {
  describe('successResponse', () => {
    it('should return success with data', async () => {
      const response = successResponse({ id: '123', name: 'Test' });
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data).toEqual({ id: '123', name: 'Test' });
      expect(response.status).toBe(200);
    });

    it('should include meta when provided', async () => {
      const response = successResponse([1, 2, 3], { source: 'database', total: 100 });
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.meta?.source).toBe('database');
      expect(json.meta?.total).toBe(100);
    });

    it('should handle empty data', async () => {
      const response = successResponse([]);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('should handle null data', async () => {
      const response = successResponse(null);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
    });
  });

  describe('errorResponse', () => {
    it('should return error with message', async () => {
      const response = errorResponse('Something went wrong');
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error).toBe('Something went wrong');
      expect(response.status).toBe(400);
    });

    it('should support custom status codes', async () => {
      const response = errorResponse('Service unavailable', 503);
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error).toBe('Service unavailable');
      expect(response.status).toBe(503);
    });

    it('should support 404 not found', async () => {
      const response = errorResponse('Resource not found', 404);
      expect(response.status).toBe(404);
    });
  });

  describe('validationErrorResponse', () => {
    it('should return validation errors', async () => {
      const errors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' }
      ];
      const response = validationErrorResponse(errors);
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error).toBe('Validation failed');
      expect(json.errors).toHaveLength(2);
      expect(json.errors?.[0].field).toBe('email');
      expect(response.status).toBe(400);
    });

    it('should handle single error', async () => {
      const errors = [{ field: 'name', message: 'Name is required' }];
      const response = validationErrorResponse(errors);
      const json = await response.json();

      expect(json.errors).toHaveLength(1);
    });
  });

  describe('unauthorizedResponse', () => {
    it('should return 401 status', async () => {
      const response = unauthorizedResponse();
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error).toBe('Unauthorized');
      expect(response.status).toBe(401);
    });

    it('should support custom message', async () => {
      const response = unauthorizedResponse('Invalid token');
      const json = await response.json();

      expect(json.error).toBe('Invalid token');
    });
  });

  describe('forbiddenResponse', () => {
    it('should return 403 status', async () => {
      const response = forbiddenResponse();
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error).toBe('Forbidden');
      expect(response.status).toBe(403);
    });

    it('should support custom message', async () => {
      const response = forbiddenResponse('Insufficient permissions');
      const json = await response.json();

      expect(json.error).toBe('Insufficient permissions');
    });
  });
});

describe('API Response Structure', () => {
  it('should maintain consistent structure across response types', async () => {
    const successResp = await successResponse({ test: true }).json();
    const errorResp = await errorResponse('Error').json();
    const validationResp = await validationErrorResponse([{ field: 'test', message: 'error' }]).json();

    expect('success' in successResp).toBe(true);
    expect('success' in errorResp).toBe(true);
    expect('success' in validationResp).toBe(true);

    expect(successResp.success).toBe(true);
    expect(errorResp.success).toBe(false);
    expect(validationResp.success).toBe(false);
  });
});
