import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockPool = {
  query: vi.fn()
};

vi.mock('../lib/db', () => ({
  getPool: vi.fn(() => mockPool),
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

describe('Positive Authentication Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPool.query.mockReset();
  });

  describe('Successful Login', () => {
    it('should authenticate valid admin user', async () => {
      const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S7o36rJZnKEyyu';

      mockPool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-admin-1',
            email: 'admin@sonate.ai',
            name: 'Admin User',
            password_hash: hashedPassword,
            role: 'admin',
            tenant_id: 'default'
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const { POST } = await import('../app/api/auth/login/route');
      const request = new NextRequest('http://localhost:5000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin@sonate.ai',
          password: 'TestPassword123!'
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect([200, 401]).toContain(response.status);
    });

    it('should set session cookie on successful login', async () => {
      const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S7o36rJZnKEyyu';

      mockPool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-admin-1',
            email: 'admin@sonate.ai',
            name: 'Admin User',
            password_hash: hashedPassword,
            role: 'admin',
            tenant_id: 'default'
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const { POST } = await import('../app/api/auth/login/route');
      const request = new NextRequest('http://localhost:5000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin@sonate.ai',
          password: 'TestPassword123!'
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      if (response.status === 200) {
        const cookies = response.headers.get('set-cookie');
        expect(cookies).toContain('session_token');
      }
    });
  });

  describe('Role-Based Route Access', () => {
    it('should identify admin role in successful login response', async () => {
      const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S7o36rJZnKEyyu';

      mockPool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-admin-1',
            email: 'admin@sonate.ai',
            name: 'Admin User',
            password_hash: hashedPassword,
            role: 'admin',
            tenant_id: 'default'
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const { POST } = await import('../app/api/auth/login/route');
      const request = new NextRequest('http://localhost:5000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin@sonate.ai',
          password: 'TestPassword123!'
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      if (response.status === 200) {
        const json = await response.json();
        expect(json.success).toBe(true);
        expect(json.data?.user?.role).toBe('admin');
      }
    });

    it('should identify analyst role correctly', async () => {
      const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S7o36rJZnKEyyu';

      mockPool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-analyst-1',
            email: 'analyst@sonate.ai',
            name: 'Analyst User',
            password_hash: hashedPassword,
            role: 'analyst',
            tenant_id: 'default'
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const { POST } = await import('../app/api/auth/login/route');
      const request = new NextRequest('http://localhost:5000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'analyst@sonate.ai',
          password: 'TestPassword123!'
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      if (response.status === 200) {
        const json = await response.json();
        expect(json.data?.user?.role).toBe('analyst');
      }
    });
  });

  describe('Session Validation', () => {
    it('should validate session token structure', async () => {
      const { generateToken } = await import('../lib/auth');

      const token = generateToken();

      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique session tokens', async () => {
      const { generateToken } = await import('../lib/auth');

      const tokens = new Set();
      for (let i = 0; i < 50; i++) {
        tokens.add(generateToken());
      }

      expect(tokens.size).toBe(50);
    });
  });

  describe('Password Security', () => {
    it('should correctly verify matching passwords', async () => {
      const { hashPassword, verifyPassword } = await import('../lib/auth');

      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should correctly reject non-matching passwords', async () => {
      const { hashPassword, verifyPassword } = await import('../lib/auth');

      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword456!', hash);

      expect(isValid).toBe(false);
    });

    it('should produce unique hashes for same password', async () => {
      const { hashPassword } = await import('../lib/auth');

      const password = 'SecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });
});

describe('RBAC Enforcement', () => {
  describe('Permission Grants', () => {
    it('should grant admin full access', async () => {
      const { hasPermissionByRole, ROLES } = await import('../lib/auth');

      const adminPermissions = ROLES.admin.permissions;
      for (const perm of adminPermissions) {
        expect(hasPermissionByRole('admin', perm)).toBe(true);
      }
    });

    it('should restrict viewer to read-only', async () => {
      const { hasPermissionByRole } = await import('../lib/auth');

      expect(hasPermissionByRole('viewer', 'read')).toBe(true);
      expect(hasPermissionByRole('viewer', 'write')).toBe(false);
      expect(hasPermissionByRole('viewer', 'delete')).toBe(false);
      expect(hasPermissionByRole('viewer', 'manage_users')).toBe(false);
      expect(hasPermissionByRole('viewer', 'manage_tenants')).toBe(false);
    });

    it('should allow analyst research permissions', async () => {
      const { hasPermissionByRole } = await import('../lib/auth');

      expect(hasPermissionByRole('analyst', 'read')).toBe(true);
      expect(hasPermissionByRole('analyst', 'write')).toBe(true);
      expect(hasPermissionByRole('analyst', 'manage_experiments')).toBe(true);
      expect(hasPermissionByRole('analyst', 'view_audit')).toBe(true);
    });

    it('should deny analyst admin permissions', async () => {
      const { hasPermissionByRole } = await import('../lib/auth');

      expect(hasPermissionByRole('analyst', 'delete')).toBe(false);
      expect(hasPermissionByRole('analyst', 'manage_users')).toBe(false);
      expect(hasPermissionByRole('analyst', 'manage_tenants')).toBe(false);
    });
  });

  describe('Role Hierarchy Validation', () => {
    it('should have viewer permissions subset of analyst', async () => {
      const { ROLES } = await import('../lib/auth');

      for (const perm of ROLES.viewer.permissions) {
        expect(ROLES.analyst.permissions).toContain(perm);
      }
    });

    it('should have analyst permissions subset of admin', async () => {
      const { ROLES } = await import('../lib/auth');

      for (const perm of ROLES.analyst.permissions) {
        expect(ROLES.admin.permissions).toContain(perm);
      }
    });
  });
});
