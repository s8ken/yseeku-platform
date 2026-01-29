/**
 * Tenant context information
 */
export interface TenantContext {
    tenantId?: string;
    userId?: string;
    roles?: string[];
    metadata?: Record<string, any>;
}
/**
 * Manager for asynchronous tenant context propagation
 */
declare class TenantContextManager {
    private storage;
    /**
     * Run a function within a tenant context
     */
    run<T>(context: TenantContext, fn: () => T): T;
    /**
     * Get the current tenant context
     */
    get(): TenantContext | undefined;
    /**
     * Get the current tenant ID, throwing if not set in an enterprise context
     */
    getTenantId(required?: boolean): string | undefined;
    /**
     * Check if a tenant context is currently active
     */
    isActive(): boolean;
}
export declare const tenantContext: TenantContextManager;
export {};
