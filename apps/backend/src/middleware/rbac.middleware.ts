import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PlatformApiKey } from '../models/platform-api-key.model';
import { Counter } from 'prom-client';

declare global {
  namespace Express {
    interface Request {
      platformKeyScopes?: string[];
    }
  }
}

const rbacDenials = new Counter({ name: 'security_denials_total', help: 'Total RBAC denials', labelNames: ['reason','route'] });

const ROLE_SCOPES: Record<string, string[]> = {
  admin: ['read:all','llm:generate','llm:code-review','gateway:manage','secrets:manage'],
  editor: ['read:all','llm:generate','llm:code-review'],
  viewer: ['read:all','llm:generate'],
};

function hasAllScopes(available: string[], required: string[]): boolean {
  const set = new Set(available);
  return required.every(s => set.has(s));
}

export function requireScopes(required: string[]) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const routeId = req.path || 'unknown';
    const apiKey = req.header('x-api-key');

    // If API key provided, validate and check scopes
    if (apiKey) {
      try {
        const keys = await PlatformApiKey.find({ tenantId: req.userTenant || 'default', status: 'active' }).select('+keyHash');
        for (const k of keys) {
          const match = await bcrypt.compare(apiKey, (k as any).keyHash);
          if (match) {
            req.platformKeyScopes = k.scopes || [];
            if (!hasAllScopes(req.platformKeyScopes, required)) {
              rbacDenials.inc({ reason: 'scope_mismatch', route: routeId });
              res.status(403).json({ success: false, message: 'API key lacks required scopes', required });
              return;
            }
            return next();
          }
        }
        rbacDenials.inc({ reason: 'api_key_invalid', route: routeId });
        res.status(401).json({ success: false, message: 'Invalid API key' });
        return;
      } catch (e: any) {
        rbacDenials.inc({ reason: 'api_key_error', route: routeId });
        res.status(500).json({ success: false, message: 'API key validation error', error: e.message });
        return;
      }
    }

    // Fallback to user role-based scopes
    const role = (req.user && req.user.role) || 'viewer';
    const scopes = ROLE_SCOPES[role] || ROLE_SCOPES.viewer;
    if (!hasAllScopes(scopes, required)) {
      rbacDenials.inc({ reason: 'role_denied', route: routeId });
      res.status(403).json({ success: false, message: 'Insufficient role permissions', required, role });
      return;
    }
    next();
  };
}
