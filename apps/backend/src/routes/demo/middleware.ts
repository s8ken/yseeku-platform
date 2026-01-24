/**
 * Demo Routes Middleware
 * Security middleware for demo/showcase endpoints
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';

/**
 * Defense-in-depth middleware: Block demo routes in production
 * unless explicitly enabled via ENABLE_DEMO_MODE environment variable.
 *
 * NOTE: For demo/showcase platforms, ENABLE_DEMO_MODE should be set to 'true'
 * in the deployment environment. This is safe because demo routes only
 * read from the demo tenant and don't modify production data.
 */
export const demoGuard = (req: Request, res: Response, next: NextFunction): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const demoExplicitlyEnabled = process.env.ENABLE_DEMO_MODE === 'true';

  // Allow demo routes in non-production environments
  if (!isProduction) {
    next();
    return;
  }

  // In production, require explicit enablement
  if (!demoExplicitlyEnabled) {
    logger.warn('Demo route blocked in production - set ENABLE_DEMO_MODE=true to enable', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(404).json({
      success: false,
      message: 'Demo routes are not enabled. Set ENABLE_DEMO_MODE=true in environment.',
    });
    return;
  }

  next();
};

export const DEMO_TENANT_ID = 'demo-tenant';
