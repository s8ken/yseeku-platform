/**
 * Enterprise API Gateway
 * Centralized API management with rate limiting, authentication, and monitoring
 */
import { EventEmitter } from 'events';
import { EnterpriseIntegration } from './enterprise-integration';
export interface APIRoute {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    handler: (req: APIRequest) => Promise<APIResponse>;
    middleware?: APIMiddleware[];
    rateLimit?: {
        requests: number;
        window: number;
    };
    auth?: {
        required: boolean;
        roles?: string[];
        permissions?: string[];
    };
}
export interface APIRequest {
    id: string;
    path: string;
    method: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: any;
    user?: {
        id: string;
        tenantId: string;
        roles: string[];
        permissions: string[];
    };
    timestamp: Date;
    metadata: {
        ip: string;
        userAgent: string;
        requestId: string;
    };
}
export interface APIResponse {
    status: number;
    headers: Record<string, string>;
    body: any;
    metadata?: {
        requestId: string;
        timestamp: Date;
        processingTime: number;
    };
}
export interface APIMiddleware {
    name: string;
    execute: (req: APIRequest, next: () => Promise<APIResponse>) => Promise<APIResponse>;
}
export interface APIMetrics {
    totalRequests: number;
    requestsByPath: Record<string, number>;
    requestsByStatus: Record<number, number>;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
    rateLimitHits: number;
    authFailures: number;
}
export declare class APIGateway extends EventEmitter {
    private routes;
    private middleware;
    private metrics;
    private tenantMetrics;
    private rateLimitStore;
    private enterprise;
    private authService;
    constructor(enterprise: EnterpriseIntegration);
    private initializeMetrics;
    private setupDefaultMiddleware;
    addRoute(route: APIRoute): void;
    addMiddleware(middleware: APIMiddleware): void;
    handleRequest(request: Partial<APIRequest>): Promise<APIResponse>;
    private findRoute;
    private checkRateLimit;
    private authenticateRequest;
    private executeMiddleware;
    private createErrorResponse;
    private updateMetrics;
    private updateMetricsObject;
    getMetrics(): APIMetrics;
    getTenantMetrics(tenantId: string): APIMetrics | undefined;
    getRoutes(): APIRoute[];
    setupEnterpriseEndpoints(): void;
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
    private cleanupRateLimitStore;
}
export default APIGateway;
//# sourceMappingURL=api-gateway.d.ts.map