import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${randomBytes(8).toString('hex')}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const ROLES = {
  admin: {
    permissions: [
      'read',
      'write',
      'delete',
      'manage_users',
      'manage_tenants',
      'view_audit',
      'manage_experiments'
    ]
  },
  analyst: {
    permissions: ['read', 'write', 'view_audit', 'manage_experiments']
  },
  viewer: {
    permissions: ['read']
  }
} as const;

export function hasPermission(user: { role: string }, perm: string): boolean {
  return hasPermissionByRole(user.role as keyof typeof ROLES, perm);
}

export function hasPermissionByRole(role: string, perm: string): boolean {
  const r = (ROLES as any)[role];
  if (!r || !Array.isArray(r.permissions)) return false;
  return r.permissions.includes(perm);
}
