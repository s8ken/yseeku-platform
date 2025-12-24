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
    window: number; // in seconds
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

export class APIGateway extends EventEmitter {
  private routes = new Map<string, APIRoute>();
  private middleware: APIMiddleware[] = [];
  private metrics: APIMetrics;
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private enterprise: EnterpriseIntegration;

  constructor(enterprise: EnterpriseIntegration) {
    super();
    this.enterprise = enterprise;
    this.metrics = this.initializeMetrics();
    this.setupDefaultMiddleware();
  }

  private initializeMetrics(): APIMetrics {
    return {
      totalRequests: 0,
      requestsByPath: {},
      requestsByStatus: {},
      averageResponseTime: 0,
      errorRate: 0,
      activeConnections: 0,
      rateLimitHits: 0,
      authFailures: 0
    };
  }

  private setupDefaultMiddleware(): void {
    // Request logging middleware
    this.addMiddleware({
      name: 'request-logger',
      execute: async (req, next) => {
        console.log(`📥 ${req.method} ${req.path} - Request ID: ${req.id}`);
        const response = await next();
        console.log(`📤 ${req.method} ${req.path} - ${response.status} - ${response.metadata?.processingTime}ms`);
        return response;
      }
    });

    // Metrics collection middleware
    this.addMiddleware({
      name: 'metrics-collector',
      execute: async (req, next) => {
        const startTime = Date.now();
        const response = await next();
        const processingTime = Date.now() - startTime;
        
        this.updateMetrics(req, response, processingTime);
        return response;
      }
    });

    // CORS middleware
    this.addMiddleware({
      name: 'cors',
      execute: async (req, next) => {
        const response = await next();
        response.headers['Access-Control-Allow-Origin'] = '*';
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key';
        return response;
      }
    });
  }

  addRoute(route: APIRoute): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
    console.log(`🛣️ Route registered: ${route.method} ${route.path}`);
  }

  addMiddleware(middleware: APIMiddleware): void {
    this.middleware.push(middleware);
    console.log(`🔧 Middleware added: ${middleware.name}`);
  }

  async handleRequest(request: Partial<APIRequest>): Promise<APIResponse> {
    const req: APIRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path: request.path || '/',
      method: request.method || 'GET',
      headers: request.headers || {},
      query: request.query || {},
      body: request.body || null,
      timestamp: new Date(),
      metadata: {
        ip: request.metadata?.ip || 'unknown',
        userAgent: request.metadata?.userAgent || 'unknown',
        requestId: request.metadata?.requestId || req.id
      }
    };

    try {
      this.metrics.activeConnections++;
      this.metrics.totalRequests++;

      // Find route
      const route = this.findRoute(req.method as any, req.path);
      if (!route) {
        return this.createErrorResponse(404, 'Route not found', req.id);
      }

      // Apply rate limiting
      if (route.rateLimit && !this.checkRateLimit(req, route.rateLimit)) {
        this.metrics.rateLimitHits++;
        return this.createErrorResponse(429, 'Rate limit exceeded', req.id);
      }

      // Apply authentication
      if (route.auth?.required && !await this.authenticateRequest(req, route.auth)) {
        this.metrics.authFailures++;
        return this.createErrorResponse(401, 'Authentication required', req.id);
      }

      // Apply middleware chain
      const response = await this.executeMiddleware(req, route);

      this.metrics.activeConnections--;
      return response;

    } catch (error) {
      this.metrics.activeConnections--;
      console.error(`❌ Request handling error:`, error);
      return this.createErrorResponse(500, 'Internal server error', req.id);
    }
  }

  private findRoute(method: string, path: string): APIRoute | undefined {
    const key = `${method}:${path}`;
    return this.routes.get(key);
  }

  private checkRateLimit(req: APIRequest, limit: { requests: number; window: number }): boolean {
    const key = `${req.metadata.ip}:${req.path}`;
    const now = Date.now();
    const windowStart = now - (limit.window * 1000);

    let stored = this.rateLimitStore.get(key);
    if (!stored || stored.resetTime < now) {
      stored = { count: 0, resetTime: now + (limit.window * 1000) };
      this.rateLimitStore.set(key, stored);
    }

    stored.count++;
    return stored.count <= limit.requests;
  }

  private async authenticateRequest(req: APIRequest, auth: APIRoute['auth']): Promise<boolean> {
    if (!auth?.required) return true;

    // Mock authentication - in production would:
    // - Validate JWT tokens
    // - Check API keys
    // - Verify user roles and permissions
    
    const authHeader = req.headers['authorization'];
    const apiKey = req.headers['x-api-key'];

    if (!authHeader && !apiKey) {
      return false;
    }

    // Mock user validation
    req.user = {
      id: 'user_123',
      tenantId: 'tenant_456',
      roles: ['user'],
      permissions: ['read']
    };

    // Check role requirements
    if (auth.roles && auth.roles.length > 0) {
      if (!auth.roles.some(role => req.user!.roles.includes(role))) {
        return false;
      }
    }

    // Check permission requirements
    if (auth.permissions && auth.permissions.length > 0) {
      if (!auth.permissions.some(perm => req.user!.permissions.includes(perm))) {
        return false;
      }
    }

    return true;
  }

  private async executeMiddleware(req: APIRequest, route: APIRoute): Promise<APIResponse> {
    let index = 0;
    const allMiddleware = [...this.middleware, ...(route.middleware || [])];

    const executeNext = async (): Promise<APIResponse> => {
      if (index >= allMiddleware.length) {
        // Execute route handler
        return await route.handler(req);
      }

      const middleware = allMiddleware[index++];
      return await middleware.execute(req, executeNext);
    };

    return await executeNext();
  }

  private createErrorResponse(status: number, message: string, requestId: string): APIResponse {
    return {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: {
        error: true,
        message,
        requestId,
        timestamp: new Date().toISOString()
      },
      metadata: {
        requestId,
        timestamp: new Date(),
        processingTime: 0
      }
    };
  }

  private updateMetrics(req: APIRequest, response: APIResponse, processingTime: number): void {
    // Update path metrics
    this.metrics.requestsByPath[req.path] = (this.metrics.requestsByPath[req.path] || 0) + 1;

    // Update status metrics
    this.metrics.requestsByStatus[response.status] = (this.metrics.requestsByStatus[response.status] || 0) + 1;

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + processingTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;

    // Update error rate
    const errorCount = Object.entries(this.metrics.requestsByStatus)
      .filter(([status]) => parseInt(status) >= 400)
      .reduce((sum, [, count]) => sum + count, 0);
    this.metrics.errorRate = (errorCount / this.metrics.totalRequests) * 100;

    // Emit metrics update
    this.emit('metricsUpdated', this.metrics);
  }

  getMetrics(): APIMetrics {
    return { ...this.metrics };
  }

  getRoutes(): APIRoute[] {
    return Array.from(this.routes.values());
  }

  // Enterprise-specific endpoints
  setupEnterpriseEndpoints(): void {
    // Health check
    this.addRoute({
      path: '/health',
      method: 'GET',
      handler: async (req) => ({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          metrics: this.getMetrics()
        }
      })
    });

    // Metrics endpoint
    this.addRoute({
      path: '/metrics',
      method: 'GET',
      auth: { required: true, permissions: ['read:metrics'] },
      handler: async (req) => ({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: this.getMetrics()
      })
    });

    // Tenant endpoints
    this.addRoute({
      path: '/tenants',
      method: 'GET',
      auth: { required: true, permissions: ['read:tenants'] },
      handler: async (req) => ({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: this.enterprise.getAllTenants()
      })
    });

    this.addRoute({
      path: '/tenants',
      method: 'POST',
      auth: { required: true, permissions: ['write:tenants'] },
      handler: async (req) => {
        try {
          await this.enterprise.setupTenant(req.body);
          return {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'Tenant created successfully', tenant: req.body }
          };
        } catch (error) {
          return {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: { error: error.message }
          };
        }
      }
    });

    // Compliance reports
    this.addRoute({
      path: '/compliance/report',
      method: 'POST',
      auth: { required: true, permissions: ['read:compliance'] },
      handler: async (req) => {
        try {
          const report = await this.enterprise.generateComplianceReport(
            req.body.tenantId,
            req.body.period
          );
          return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: report
          };
        } catch (error) {
          return {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: { error: error.message }
          };
        }
      }
    });

    console.log('🏢 Enterprise API endpoints configured');
  }

  async start(port: number = 3000): Promise<void> {
    console.log(`🚀 Starting API Gateway on port ${port}`);
    
    // Start enterprise monitoring
    await this.enterprise.startMonitoring();
    
    // Mock server start - in production would start actual HTTP server
    console.log(`✅ API Gateway running on http://localhost:${port}`);
    console.log(`📊 Enterprise metrics available at /metrics`);
    console.log(`🏥 Health check available at /health`);
    
    this.emit('started', { port });
  }

  async stop(): Promise<void> {
    console.log('⏹️ Stopping API Gateway...');
    
    // Stop enterprise monitoring
    await this.enterprise.stopMonitoring();
    
    this.emit('stopped');
    console.log('✅ API Gateway stopped');
  }

  // Cleanup old rate limit entries
  private cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, stored] of this.rateLimitStore.entries()) {
      if (stored.resetTime < now) {
        this.rateLimitStore.delete(key);
      }
    }
  }
}

export default APIGateway;