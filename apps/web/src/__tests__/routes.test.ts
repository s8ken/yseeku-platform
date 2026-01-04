import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../lib/db', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  })),
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../middleware/rate-limit', () => ({
  withRateLimit: (handler: Function) => handler,
  rateLimiters: {
    auth: { windowMs: 900000, maxRequests: 5 },
    read: { windowMs: 60000, maxRequests: 60 },
    write: { windowMs: 60000, maxRequests: 20 },
  },
}));

describe('API Route Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const { GET } = await import('../app/api/health/route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(json.status);
      expect(json.checks).toBeDefined();
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('Risk Events Endpoint', () => {
    it('should return risk events list', async () => {
      const { GET } = await import('../app/api/risk-events/route');
      const request = new NextRequest('http://localhost:5000/api/risk-events');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should include meta.source field', async () => {
      const { GET } = await import('../app/api/risk-events/route');
      const request = new NextRequest('http://localhost:5000/api/risk-events');
      const response = await GET(request);
      const json = await response.json();

      expect(json.meta).toBeDefined();
      expect(['database', 'mock']).toContain(json.meta.source);
    });
  });

  describe('Trust Receipts Endpoint', () => {
    it('should return trust receipts list', async () => {
      const { GET } = await import('../app/api/trust-receipts/route');
      const request = new NextRequest('http://localhost:5000/api/trust-receipts');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('Tenants Endpoint', () => {
    it('should return tenants list', async () => {
      const { GET } = await import('../app/api/tenants/route');
      const request = new NextRequest('http://localhost:5000/api/tenants');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data.tenants)).toBe(true);
    });
  });

  describe('Agents Endpoint', () => {
    it('should return agents list', async () => {
      const { GET } = await import('../app/api/agents/route');
      const request = new NextRequest('http://localhost:5000/api/agents');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('Dashboard KPIs Endpoint', () => {
    it('should return dashboard KPIs', async () => {
      const { GET } = await import('../app/api/dashboard/kpis/route');
      const request = new NextRequest('http://localhost:5000/api/dashboard/kpis');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});

describe('CSRF Token Generation', () => {
  it('should generate CSRF token with valid structure', async () => {
    const { GET } = await import('../app/api/csrf/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.token).toBeDefined();
    expect(typeof json.data.token).toBe('string');
    expect(json.data.token.length).toBeGreaterThan(50);
  });

  it('should set CSRF cookie', async () => {
    const { GET } = await import('../app/api/csrf/route');
    const response = await GET();

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('csrf_token');
  });
});

describe('Authentication Endpoint', () => {
  it('should reject empty credentials', async () => {
    const { POST } = await import('../app/api/auth/login/route');
    const request = new NextRequest('http://localhost:5000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing credentials');
  });

  it('should reject invalid credentials', async () => {
    const { POST } = await import('../app/api/auth/login/route');
    const request = new NextRequest('http://localhost:5000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'wrong@test.com',
        password: 'wrongpassword'
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Invalid credentials');
  });
});

describe('Input Validation on Routes', () => {
  it('should validate tenant creation', async () => {
    const { POST } = await import('../app/api/tenants/route');
    const request = new NextRequest('http://localhost:5000/api/tenants', {
      method: 'POST',
      body: JSON.stringify({ domain: 'test.com' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should validate risk event severity enum', async () => {
    const { POST } = await import('../app/api/risk-events/route');
    const request = new NextRequest('http://localhost:5000/api/risk-events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Event',
        severity: 'invalid_severity'
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });
});
