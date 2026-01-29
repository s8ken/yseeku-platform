/**
 * Helper to get the current tenant ID from context or provided value
 */
export declare function resolveTenantId(providedId?: string): string | null;
export declare function getDatabaseUrl(): string | undefined;
export declare function getPool(): any | null;
export declare function ensureSchema(): Promise<void>;
export declare function healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
}>;
export declare function initializeDatabase(): Promise<void>;
