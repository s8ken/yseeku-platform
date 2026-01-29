"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTenant = exports.tenantMiddleware = void 0;
const core_1 = require("@sonate/core");
/**
 * Express middleware to extract tenant information and set the context
 */
const tenantMiddleware = (req, res, next) => {
    // In a real app, this would come from a verified JWT or a custom header
    // For now, we support 'x-tenant-id' header or 'tenant' query param
    const tenantId = req.headers['x-tenant-id'] || req.query.tenant;
    if (!tenantId) {
        // For public endpoints or non-enterprise routes, we can allow missing tenantId
        // But for production, most routes should require it
        return next();
    }
    // Set the tenant context for the duration of this request
    core_1.tenantContext.run({ tenantId }, () => {
        next();
    });
};
exports.tenantMiddleware = tenantMiddleware;
/**
 * Middleware to require a tenant context
 */
const requireTenant = (req, res, next) => {
    if (!core_1.tenantContext.isActive()) {
        return res.status(400).json({
            error: 'Tenant context required',
            code: 'MISSING_TENANT'
        });
    }
    next();
};
exports.requireTenant = requireTenant;
