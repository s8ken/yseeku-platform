"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindTenantContext = bindTenantContext;
exports.getTenantContext = getTenantContext;
const async_hooks_1 = require("async_hooks");
const storage = new async_hooks_1.AsyncLocalStorage();
function bindTenantContext(req, res, next) {
    const tenantId = req.userTenant || req.tenant || 'default';
    const userId = req.userId || 'system';
    const correlationId = req.correlationId;
    storage.run({ tenantId, userId, correlationId }, () => next());
}
function getTenantContext() {
    return storage.getStore();
}
