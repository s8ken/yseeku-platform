import { describe, it, expect, vi } from 'vitest';
import {
  validateRequired,
  validateString,
  validateNumber,
  validateEmail,
  validateEnum,
  validateSonateDimensions,
  validateBedauIndex,
  sanitizeInput
} from '../lib/validation';

vi.mock('../lib/db', () => ({
  getPool: vi.fn(() => null),
}));

describe('Input Validation', () => {
  describe('validateRequired', () => {
    it('should pass for non-empty values', () => {
      expect(validateRequired('hello', 'field')).toBeNull();
      expect(validateRequired(123, 'field')).toBeNull();
      expect(validateRequired({ a: 1 }, 'field')).toBeNull();
    });

    it('should fail for empty values', () => {
      const error = validateRequired('', 'name');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('name');
    });

    it('should fail for null/undefined', () => {
      expect(validateRequired(null, 'field')).not.toBeNull();
      expect(validateRequired(undefined, 'field')).not.toBeNull();
    });

    it('should pass for zero and false', () => {
      expect(validateRequired(0, 'field')).toBeNull();
      expect(validateRequired(false, 'field')).toBeNull();
    });
  });

  describe('validateString', () => {
    it('should pass for valid strings', () => {
      expect(validateString('hello', 'field')).toBeNull();
    });

    it('should fail for non-strings', () => {
      expect(validateString(123, 'field')).not.toBeNull();
      expect(validateString({}, 'field')).not.toBeNull();
    });

    it('should validate minLength', () => {
      expect(validateString('ab', 'field', { minLength: 3 })).not.toBeNull();
      expect(validateString('abc', 'field', { minLength: 3 })).toBeNull();
    });

    it('should validate maxLength', () => {
      expect(validateString('abcd', 'field', { maxLength: 3 })).not.toBeNull();
      expect(validateString('abc', 'field', { maxLength: 3 })).toBeNull();
    });
  });

  describe('validateNumber', () => {
    it('should pass for valid numbers', () => {
      expect(validateNumber(123, 'field')).toBeNull();
      expect(validateNumber(0, 'field')).toBeNull();
      expect(validateNumber(-5.5, 'field')).toBeNull();
    });

    it('should fail for non-numbers', () => {
      expect(validateNumber('abc', 'field')).not.toBeNull();
      expect(validateNumber(NaN, 'field')).not.toBeNull();
    });

    it('should validate min/max', () => {
      expect(validateNumber(5, 'field', { min: 10 })).not.toBeNull();
      expect(validateNumber(15, 'field', { max: 10 })).not.toBeNull();
      expect(validateNumber(10, 'field', { min: 0, max: 100 })).toBeNull();
    });
  });

  describe('validateEmail', () => {
    it('should pass valid emails', () => {
      expect(validateEmail('test@example.com', 'email')).toBeNull();
      expect(validateEmail('user.name@domain.co.uk', 'email')).toBeNull();
    });

    it('should fail invalid emails', () => {
      expect(validateEmail('notanemail', 'email')).not.toBeNull();
      expect(validateEmail('missing@domain', 'email')).not.toBeNull();
      expect(validateEmail('@nodomain.com', 'email')).not.toBeNull();
    });
  });

  describe('validateEnum', () => {
    const validValues = ['info', 'warning', 'error', 'critical'];

    it('should pass valid enum values', () => {
      expect(validateEnum('info', 'severity', validValues)).toBeNull();
      expect(validateEnum('critical', 'severity', validValues)).toBeNull();
    });

    it('should fail invalid enum values', () => {
      const error = validateEnum('invalid', 'severity', validValues);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('info');
    });
  });

  describe('validateSonateDimensions', () => {
    it('should pass valid SONATE dimensions', () => {
      const dims = {
        reality_index: 8.5,
        ethical_alignment: 4.0,
        canvas_parity: 85
      };
      const result = validateSonateDimensions(dims);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail reality_index out of range', () => {
      const dims = { reality_index: 15 };
      const result = validateSonateDimensions(dims);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail ethical_alignment out of range', () => {
      const dims = { ethical_alignment: 6 };
      const result = validateSonateDimensions(dims);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail canvas_parity out of range', () => {
      const dims = { canvas_parity: 150 };
      const result = validateSonateDimensions(dims);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail for non-object input', () => {
      const result = validateSonateDimensions(null);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateBedauIndex', () => {
    it('should pass valid Bedau Index', () => {
      const bedau = {
        nominal_emergence: 0.5,
        weak_emergence: 0.6,
        strong_emergence: 0.7,
        downward_causation: 0.8
      };
      const result = validateBedauIndex(bedau);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail values out of 0-1 range', () => {
      const bedau = { nominal_emergence: 1.5 };
      const result = validateBedauIndex(bedau);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail negative values', () => {
      const bedau = { weak_emergence: -0.1 };
      const result = validateBedauIndex(bedau);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should pass boundary values', () => {
      const bedau = { nominal_emergence: 0, weak_emergence: 1 };
      const result = validateBedauIndex(bedau);
      expect(result.valid).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML in specified fields', () => {
      const input = {
        title: '<script>alert("xss")</script>Hello',
        description: '<b>Bold</b> text'
      };
      const sanitized = sanitizeInput(input, ['title', 'description']);

      expect(sanitized.title).not.toContain('<script>');
      expect(sanitized.description).not.toContain('<b>');
    });

    it('should preserve non-sanitized fields', () => {
      const input = {
        id: 123,
        title: '<script>test</script>'
      };
      const sanitized = sanitizeInput(input, ['title']);

      expect(sanitized.id).toBe(123);
    });

    it('should handle empty input', () => {
      const sanitized = sanitizeInput({}, ['title']);
      expect(sanitized).toEqual({});
    });

    it('should handle missing fields', () => {
      const input = { name: 'Test' };
      const sanitized = sanitizeInput(input, ['title', 'description']);
      expect(sanitized.name).toBe('Test');
    });
  });
});
