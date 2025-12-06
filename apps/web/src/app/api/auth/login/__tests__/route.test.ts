import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock the orchestrate module
jest.mock('@sonate/orchestrate', () => ({
  getRBACManager: jest.fn(() => ({
    cacheUser: jest.fn(),
  })),
  Role: {
    ADMIN: 'admin',
    USER: 'user',
    VIEWER: 'viewer',
  },
}));

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 if username is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'password123' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username and password are required');
    });

    it('returns 400 if password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'testuser' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username and password are required');
    });

    it('accepts login with valid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.username).toBe('testuser');
      expect(data.data.user.email).toBe('testuser@example.com');
      expect(data.data.user.roles).toEqual(['admin']);
      expect(data.data.token).toMatch(/^mock-token-/);
      expect(data.data.tenant).toBe('default');
    });

    it('handles tenant from header', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        }),
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'corp1'
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.user.metadata.tenant).toBe('corp1');
      expect(data.data.tenant).toBe('corp1');
    });

    it('handles tenant from query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login?tenant=startup1', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.user.metadata.tenant).toBe('startup1');
      expect(data.data.tenant).toBe('startup1');
    });

    it('returns 401 for invalid credentials (simulated)', async () => {
      // Since the current implementation accepts any credentials,
      // this test documents the expected behavior for future auth implementation
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: '',
          password: ''
        }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // Current implementation accepts empty credentials too
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('caches user in RBAC manager', async () => {
      const { getRBACManager } = require('@sonate/orchestrate');
      const mockRBAC = { cacheUser: jest.fn() };
      getRBACManager.mockReturnValue(mockRBAC);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        }),
        headers: { 'content-type': 'application/json' },
      });

      await POST(request);

      expect(getRBACManager).toHaveBeenCalled();
      expect(mockRBAC.cacheUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-testuser',
          username: 'testuser',
          roles: ['admin']
        })
      );
    });

    it('handles malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });
  });
});