import { AsyncLocalStorage } from 'async_hooks';

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
class TenantContextManager {
  private storage = new AsyncLocalStorage<TenantContext>();

  /**
   * Run a function within a tenant context
   */
  run<T>(context: TenantContext, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  /**
   * Get the current tenant context
   */
  get(): TenantContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Get the current tenant ID, throwing if not set in an enterprise context
   */
  getTenantId(required = true): string | undefined {
    const context = this.get();
    if (!context?.tenantId && required) {
      throw new Error('Tenant context is required but not found');
    }
    return context?.tenantId;
  }

  /**
   * Check if a tenant context is currently active
   */
  isActive(): boolean {
    return Boolean(this.get());
  }
}

export const tenantContext = new TenantContextManager();
