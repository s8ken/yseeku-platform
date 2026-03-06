import { getAuthToken } from '@/lib/api/client';

export type AppRole = 'admin' | 'user' | 'viewer';

export interface CurrentUser {
  id?: string;
  username?: string;
  email?: string;
  tenant?: string;
  role: AppRole;
  roles: string[];
}

interface TokenPayload {
  userId?: string;
  username?: string;
  name?: string;
  email?: string;
  tenant?: string;
  role?: string;
  roles?: string[];
}

function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
}

function normalizeRole(payload: TokenPayload): AppRole {
  const roleValues = [
    ...(Array.isArray(payload.roles) ? payload.roles : []),
    ...(payload.role ? [payload.role] : []),
  ].map((r) => String(r).toLowerCase());

  if (roleValues.includes('admin')) return 'admin';
  if (roleValues.some((r) => ['user', 'editor', 'analyst', 'guest'].includes(r))) return 'user';
  return 'viewer';
}

export function getCurrentUserFromToken(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  const token = getAuthToken();
  if (!token) return null;

  const payload = decodeTokenPayload(token);
  if (!payload) return null;

  const roles = Array.isArray(payload.roles)
    ? payload.roles.map((r) => String(r))
    : payload.role
      ? [String(payload.role)]
      : [];

  return {
    id: payload.userId,
    username: payload.username || payload.name,
    email: payload.email,
    tenant: payload.tenant,
    role: normalizeRole(payload),
    roles,
  };
}

export function getCurrentUserRole(): AppRole {
  return getCurrentUserFromToken()?.role || 'viewer';
}

