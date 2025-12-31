import { Request, Response, NextFunction } from 'express';
import { tenantContext } from '@sonate/core';

/**
 * Express middleware to extract tenant information and set the context
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // In a real app, this would come from a verified JWT or a custom header
  // For now, we support 'x-tenant-id' header or 'tenant' query param
  const tenantId = (req.headers['x-tenant-id'] as string) || (req.query.tenant as string);

  if (!tenantId) {
    // For public endpoints or non-enterprise routes, we can allow missing tenantId
    // But for production, most routes should require it
    return next();
  }

  // Set the tenant context for the duration of this request
  tenantContext.run({ tenantId }, () => {
    next();
  });
};

/**
 * Middleware to require a tenant context
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!tenantContext.isActive()) {
    return res.status(400).json({
      error: 'Tenant context required',
      code: 'MISSING_TENANT'
    });
  }
  next();
};
