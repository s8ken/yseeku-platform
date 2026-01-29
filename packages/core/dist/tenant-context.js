"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantContext = void 0;
const async_hooks_1 = require("async_hooks");
/**
 * Manager for asynchronous tenant context propagation
 */
class TenantContextManager {
    constructor() {
        this.storage = new async_hooks_1.AsyncLocalStorage();
    }
    /**
     * Run a function within a tenant context
     */
    run(context, fn) {
        return this.storage.run(context, fn);
    }
    /**
     * Get the current tenant context
     */
    get() {
        return this.storage.getStore();
    }
    /**
     * Get the current tenant ID, throwing if not set in an enterprise context
     */
    getTenantId(required = true) {
        const context = this.get();
        if (!context?.tenantId && required) {
            throw new Error('Tenant context is required but not found');
        }
        return context?.tenantId;
    }
    /**
     * Check if a tenant context is currently active
     */
    isActive() {
        return Boolean(this.get());
    }
}
exports.tenantContext = new TenantContextManager();
