import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateToken, generateId, ROLES, hasPermission, hasPermissionByRole } from '../lib/auth';

vi.mock('../lib/db', () => ({
  getPool: vi.fn(() => null),
}));

describe('Authentication Utilities', () => {
  describe('generateToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = generateToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('generateId', () => {
    it('should generate ID with correct prefix', () => {
      const id = generateId('user');
      expect(id.startsWith('user-')).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');
      expect(id1).not.toBe(id2);
    });
  });

  describe('ROLES Configuration', () => {
    it('should define admin role with full permissions', () => {
      expect(ROLES.admin).toBeDefined();
      expect(ROLES.admin.permissions).toContain('read');
      expect(ROLES.admin.permissions).toContain('write');
      expect(ROLES.admin.permissions).toContain('delete');
      expect(ROLES.admin.permissions).toContain('manage_users');
      expect(ROLES.admin.permissions).toContain('manage_tenants');
      expect(ROLES.admin.permissions).toContain('view_audit');
      expect(ROLES.admin.permissions).toContain('manage_experiments');
    });

    it('should define analyst role with limited permissions', () => {
      expect(ROLES.analyst).toBeDefined();
      expect(ROLES.analyst.permissions).toContain('read');
      expect(ROLES.analyst.permissions).toContain('write');
      expect(ROLES.analyst.permissions).toContain('view_audit');
      expect(ROLES.analyst.permissions).toContain('manage_experiments');
      expect(ROLES.analyst.permissions).not.toContain('delete');
      expect(ROLES.analyst.permissions).not.toContain('manage_users');
      expect(ROLES.analyst.permissions).not.toContain('manage_tenants');
    });

    it('should define viewer role with read-only access', () => {
      expect(ROLES.viewer).toBeDefined();
      expect(ROLES.viewer.permissions).toContain('read');
      expect(ROLES.viewer.permissions).toHaveLength(1);
    });
  });

  describe('hasPermission', () => {
    const adminUser = { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' as const, tenant_id: 'default' };
    const analystUser = { id: '2', email: 'analyst@test.com', name: 'Analyst', role: 'analyst' as const, tenant_id: 'default' };
    const viewerUser = { id: '3', email: 'viewer@test.com', name: 'Viewer', role: 'viewer' as const, tenant_id: 'default' };

    it('should grant admin all permissions', () => {
      expect(hasPermission(adminUser, 'read')).toBe(true);
      expect(hasPermission(adminUser, 'write')).toBe(true);
      expect(hasPermission(adminUser, 'delete')).toBe(true);
      expect(hasPermission(adminUser, 'manage_users')).toBe(true);
    });

    it('should restrict analyst from admin functions', () => {
      expect(hasPermission(analystUser, 'read')).toBe(true);
      expect(hasPermission(analystUser, 'write')).toBe(true);
      expect(hasPermission(analystUser, 'delete')).toBe(false);
      expect(hasPermission(analystUser, 'manage_users')).toBe(false);
    });

    it('should restrict viewer to read-only', () => {
      expect(hasPermission(viewerUser, 'read')).toBe(true);
      expect(hasPermission(viewerUser, 'write')).toBe(false);
      expect(hasPermission(viewerUser, 'delete')).toBe(false);
    });
  });

  describe('hasPermissionByRole', () => {
    it('should grant admin all permissions', () => {
      expect(hasPermissionByRole('admin', 'read')).toBe(true);
      expect(hasPermissionByRole('admin', 'write')).toBe(true);
      expect(hasPermissionByRole('admin', 'delete')).toBe(true);
      expect(hasPermissionByRole('admin', 'manage_users')).toBe(true);
      expect(hasPermissionByRole('admin', 'manage_tenants')).toBe(true);
    });

    it('should restrict analyst from admin functions', () => {
      expect(hasPermissionByRole('analyst', 'read')).toBe(true);
      expect(hasPermissionByRole('analyst', 'write')).toBe(true);
      expect(hasPermissionByRole('analyst', 'delete')).toBe(false);
      expect(hasPermissionByRole('analyst', 'manage_users')).toBe(false);
    });

    it('should restrict viewer to read-only', () => {
      expect(hasPermissionByRole('viewer', 'read')).toBe(true);
      expect(hasPermissionByRole('viewer', 'write')).toBe(false);
      expect(hasPermissionByRole('viewer', 'delete')).toBe(false);
    });

    it('should reject unknown roles', () => {
      expect(hasPermissionByRole('unknown_role', 'read')).toBe(false);
    });

    it('should reject unknown permissions', () => {
      expect(hasPermissionByRole('admin', 'unknown_permission')).toBe(false);
    });
  });

  describe('Role Hierarchy', () => {
    it('should have proper permission hierarchy', () => {
      const viewerPerms = ROLES.viewer.permissions.length;
      const analystPerms = ROLES.analyst.permissions.length;
      const adminPerms = ROLES.admin.permissions.length;

      expect(viewerPerms).toBeLessThan(analystPerms);
      expect(analystPerms).toBeLessThan(adminPerms);
    });
  });
});
