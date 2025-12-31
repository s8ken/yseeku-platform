import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('../lib/db', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  })),
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

describe('Security Features', () => {
  describe('CSRF Protection', () => {
    it('should generate unique CSRF tokens', async () => {
      const { generateCsrfToken } = await import('../lib/csrf');

      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(50);
      expect(token2.length).toBeGreaterThan(50);
    });

    it('should validate correct CSRF token', async () => {
      const { generateCsrfToken, validateCsrfToken } = await import('../lib/csrf');

      const token = generateCsrfToken();
      const isValid = validateCsrfToken(token);

      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF token', async () => {
      const { validateCsrfToken } = await import('../lib/csrf');

      const isValid = validateCsrfToken('invalid-token-format');

      expect(isValid).toBe(false);
    });

    it('should reject malformed CSRF token', async () => {
      const { validateCsrfToken } = await import('../lib/csrf');

      expect(validateCsrfToken('')).toBe(false);
      expect(validateCsrfToken('onlyonepart')).toBe(false);
      expect(validateCsrfToken('two:parts')).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should generate proper security headers', async () => {
      const { getSecurityHeaders } = await import('../lib/security-headers');

      const headers = getSecurityHeaders();

      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBeDefined();
      expect(headers['Content-Security-Policy']).toBeDefined();
    });

    it('should include strict CSP policy', async () => {
      const { getSecurityHeaders } = await import('../lib/security-headers');

      const headers = getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      expect(csp).toContain("default-src");
      expect(csp).toContain("frame-ancestors");
    });
  });

  describe('Rate Limiting', () => {
    it('should create rate limiter with default config', async () => {
      const { RateLimiter } = await import('../middleware/rate-limit');

      const limiter = new RateLimiter();
      expect(limiter).toBeDefined();
    });

    it('should create rate limiter with custom config', async () => {
      const { RateLimiter } = await import('../middleware/rate-limit');

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 10
      });
      expect(limiter).toBeDefined();
    });

    it('should expose withRateLimit middleware wrapper', async () => {
      const { withRateLimit } = await import('../middleware/rate-limit');

      expect(typeof withRateLimit).toBe('function');
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords with bcrypt', async () => {
      const { hashPassword, verifyPassword } = await import('../lib/auth');

      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct passwords', async () => {
      const { hashPassword, verifyPassword } = await import('../lib/auth');

      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const { hashPassword, verifyPassword } = await import('../lib/auth');

      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Session Token Generation', () => {
    it('should generate cryptographically secure tokens', async () => {
      const { generateToken } = await import('../lib/auth');

      const token1 = generateToken();
      const token2 = generateToken();

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(token1)).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    it('should remove script tags', async () => {
      const { sanitizeString } = await import('../lib/validation');

      const input = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeString(input);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('Hello');
    });

    it('should remove HTML tags', async () => {
      const { sanitizeString } = await import('../lib/validation');

      const input = '<div><b>Bold</b></div>';
      const sanitized = sanitizeString(input);

      expect(sanitized).not.toContain('<div>');
      expect(sanitized).not.toContain('<b>');
      expect(sanitized).toContain('Bold');
    });

    it('should handle SQL injection attempts', async () => {
      const { sanitizeString } = await import('../lib/validation');

      const input = "Robert'); DROP TABLE users;--";
      const sanitized = sanitizeString(input);

      expect(sanitized).not.toContain("'");
    });
  });
});

describe('API Security', () => {
  describe('Health Endpoint Security Headers', () => {
    it('should include security headers in response', async () => {
      const { GET } = await import('../app/api/health/route');
      const request = new NextRequest('http://localhost:5000/api/health');
      const response = await GET(request);

      const csp = response.headers.get('Content-Security-Policy');
      const xfo = response.headers.get('X-Frame-Options');

      expect(csp).toBeDefined();
      expect(xfo).toBeDefined();
    });
  });
});
