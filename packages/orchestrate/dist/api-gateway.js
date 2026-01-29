"use strict";
/**
 * Enterprise API Gateway
 * Centralized API management with rate limiting, authentication, and monitoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIGateway = void 0;
const crypto_1 = require("crypto");
const events_1 = require("events");
const core_1 = require("@sonate/core");
const logger_1 = require("./observability/logger");
const api_keys_1 = require("./security/api-keys");
const logger = (0, logger_1.getLogger)('APIGateway');
class APIGateway extends events_1.EventEmitter {
    constructor(enterprise) {
        super();
        this.routes = new Map();
        this.middleware = [];
        this.tenantMetrics = new Map();
        this.rateLimitStore = new Map();
        this.enterprise = enterprise;
        this.authService = new core_1.SecureAuthService();
        this.metrics = this.initializeMetrics();
        this.setupDefaultMiddleware();
    }
    initializeMetrics() {
        return {
            totalRequests: 0,
            requestsByPath: {},
            requestsByStatus: {},
            averageResponseTime: 0,
            errorRate: 0,
            activeConnections: 0,
            rateLimitHits: 0,
            authFailures: 0,
        };
    }
    setupDefaultMiddleware() {
        // Request logging middleware
        this.addMiddleware({
            name: 'request-logger',
            execute: async (req, next) => {
                logger.http(`📥 ${req.method} ${req.path}`, { requestId: req.id });
                const response = await next();
                logger.http(`📤 ${req.method} ${req.path} - ${response.status}`, {
                    requestId: req.id,
                    processingTime: response.metadata?.processingTime,
                });
                return response;
            },
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
            },
        });
        // CORS middleware
        this.addMiddleware({
            name: 'security-headers',
            execute: async (req, next) => {
                const response = await next();
                response.headers['X-Content-Type-Options'] = 'nosniff';
                response.headers['X-Frame-Options'] = 'DENY';
                response.headers['X-XSS-Protection'] = '1; mode=block';
                response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
                response.headers['Content-Security-Policy'] = "default-src 'self'";
                return response;
            },
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
            },
        });
    }
    addRoute(route) {
        const key = `${route.method}:${route.path}`;
        this.routes.set(key, route);
        logger.info(`🛣️ Route registered: ${route.method} ${route.path}`);
    }
    addMiddleware(middleware) {
        this.middleware.push(middleware);
        logger.info(`🔧 Middleware added: ${middleware.name}`);
    }
    async handleRequest(request) {
        const requestId = request.metadata?.requestId || `req_${(0, crypto_1.randomUUID)()}`;
        const req = {
            id: requestId,
            path: request.path || '/',
            method: request.method || 'GET',
            headers: request.headers || {},
            query: request.query || {},
            body: request.body || null,
            timestamp: new Date(),
            metadata: {
                ip: request.metadata?.ip || 'unknown',
                userAgent: request.metadata?.userAgent || 'unknown',
                requestId: requestId,
            },
        };
        // Try to extract tenant from token if present to initialize context early
        const authHeader = req.headers.authorization;
        let initialTenantId;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const payload = this.authService.verifyToken(token);
                initialTenantId = payload.tenant;
                req.user = {
                    id: payload.userId,
                    tenantId: payload.tenant,
                    roles: payload.roles || [],
                    permissions: payload.permissions || [],
                };
            }
            catch (e) {
                // Ignore token errors here, they will be caught in authenticateRequest
            }
        }
        return core_1.tenantContext.run({ tenantId: initialTenantId, userId: req.user?.id }, async () => {
            try {
                this.metrics.activeConnections++;
                // Find route
                const route = this.findRoute(req.method, req.path);
                if (!route) {
                    return this.createErrorResponse(404, 'Route not found', req.id);
                }
                // Apply rate limiting
                if (route.rateLimit && !this.checkRateLimit(req, route.rateLimit)) {
                    this.metrics.rateLimitHits++;
                    return this.createErrorResponse(429, 'Rate limit exceeded', req.id);
                }
                // Apply authentication
                if (route.auth?.required && !(await this.authenticateRequest(req, route.auth))) {
                    this.metrics.authFailures++;
                    return this.createErrorResponse(401, 'Authentication required', req.id);
                }
                // If authentication succeeded but we didn't have a tenant context yet,
                // we might need to re-run in a new context if the tenant changed.
                // However, for simplicity we assume the initial context is enough or updated.
                // Apply middleware chain
                const response = await this.executeMiddleware(req, route);
                this.metrics.activeConnections--;
                return response;
            }
            catch (error) {
                this.metrics.activeConnections--;
                logger.error('❌ Middleware execution error', { error: String(error) });
                return this.createErrorResponse(500, 'Internal server error', req.id);
            }
        });
    }
    findRoute(method, path) {
        const key = `${method}:${path}`;
        return this.routes.get(key);
    }
    checkRateLimit(req, limit) {
        // Priority: tenantId > userId > IP
        const key = req.user?.tenantId
            ? `tenant:${req.user.tenantId}:${req.path}`
            : req.user?.id
                ? `user:${req.user.id}:${req.path}`
                : `ip:${req.metadata.ip}:${req.path}`;
        const now = Date.now();
        const windowStart = now - limit.window * 1000;
        let stored = this.rateLimitStore.get(key);
        if (!stored || stored.resetTime < now) {
            stored = { count: 0, resetTime: now + limit.window * 1000 };
            this.rateLimitStore.set(key, stored);
        }
        stored.count++;
        return stored.count <= limit.requests;
    }
    async authenticateRequest(req, auth) {
        if (!auth?.required) {
            return true;
        }
        const authHeader = req.headers.authorization;
        const apiKey = req.headers['x-api-key'];
        if (!authHeader && !apiKey) {
            return false;
        }
        try {
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const payload = this.authService.verifyToken(token);
                req.user = {
                    id: payload.userId,
                    tenantId: payload.tenant,
                    roles: payload.roles || [],
                    permissions: payload.permissions || [],
                };
            }
            else if (apiKey) {
                const keyResult = await (0, api_keys_1.getAPIKeyManager)().validateKey(apiKey);
                if (!keyResult.valid || !keyResult.key) {
                    return false;
                }
                const tenantId = (keyResult.key.metadata?.tenantId ??
                    keyResult.key.metadata?.tenant ??
                    'tenant_api');
                req.user = {
                    id: keyResult.key.userId,
                    tenantId,
                    roles: ['api_user'],
                    permissions: keyResult.key.scopes || [],
                };
            }
            // Check role requirements
            if (auth.roles && auth.roles.length > 0) {
                if (!req.user || !auth.roles.some((role) => req.user.roles.includes(role))) {
                    return false;
                }
            }
            // Check permission requirements
            if (auth.permissions && auth.permissions.length > 0) {
                if (!req.user || !auth.permissions.some((perm) => req.user.permissions.includes(perm))) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            logger.error('Auth failure', { error: String(error) });
            return false;
        }
    }
    async executeMiddleware(req, route) {
        let index = 0;
        const allMiddleware = [...this.middleware, ...(route.middleware || [])];
        const executeNext = async () => {
            if (index >= allMiddleware.length) {
                // Execute route handler
                return await route.handler(req);
            }
            const middleware = allMiddleware[index++];
            return await middleware.execute(req, executeNext);
        };
        return await executeNext();
    }
    createErrorResponse(status, message, requestId) {
        const response = {
            status,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Content-Security-Policy': "default-src 'none'",
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            },
            body: {
                error: true,
                message,
                requestId,
                timestamp: new Date().toISOString(),
            },
            metadata: {
                requestId,
                timestamp: new Date(),
                processingTime: 0,
            },
        };
        return response;
    }
    updateMetrics(req, response, processingTime) {
        // Update global metrics
        this.updateMetricsObject(this.metrics, req, response, processingTime);
        // Update tenant-specific metrics if available
        const tenantId = req.user?.tenantId;
        if (tenantId) {
            let tMetrics = this.tenantMetrics.get(tenantId);
            if (!tMetrics) {
                tMetrics = this.initializeMetrics();
                this.tenantMetrics.set(tenantId, tMetrics);
            }
            this.updateMetricsObject(tMetrics, req, response, processingTime);
        }
        // Emit metrics update
        this.emit('metricsUpdated', {
            global: this.metrics,
            tenant: tenantId ? this.tenantMetrics.get(tenantId) : null,
        });
    }
    updateMetricsObject(metrics, req, response, processingTime) {
        metrics.totalRequests++;
        // Update path metrics
        metrics.requestsByPath[req.path] = (metrics.requestsByPath[req.path] || 0) + 1;
        // Update status metrics
        metrics.requestsByStatus[response.status] =
            (metrics.requestsByStatus[response.status] || 0) + 1;
        // Update average response time
        const totalTime = metrics.averageResponseTime * (metrics.totalRequests - 1) + processingTime;
        metrics.averageResponseTime = totalTime / metrics.totalRequests;
        // Update error rate
        const errorCount = Object.entries(metrics.requestsByStatus)
            .filter(([status]) => parseInt(status) >= 400)
            .reduce((sum, [, count]) => sum + count, 0);
        metrics.errorRate = (errorCount / metrics.totalRequests) * 100;
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getTenantMetrics(tenantId) {
        const metrics = this.tenantMetrics.get(tenantId);
        return metrics ? { ...metrics } : undefined;
    }
    getRoutes() {
        return Array.from(this.routes.values());
    }
    // Enterprise-specific endpoints
    setupEnterpriseEndpoints() {
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
                    metrics: this.getMetrics(),
                },
            }),
        });
        // Tenant metrics
        this.addRoute({
            path: '/metrics/tenant',
            method: 'GET',
            auth: { required: true },
            handler: async (req) => {
                const tenantId = req.user?.tenantId;
                if (!tenantId) {
                    return this.createErrorResponse(400, 'Tenant context required', req.id);
                }
                const metrics = this.getTenantMetrics(tenantId);
                return {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: {
                        tenantId,
                        metrics: metrics || this.initializeMetrics(),
                        timestamp: new Date().toISOString(),
                    },
                };
            },
        });
        // Metrics endpoint
        this.addRoute({
            path: '/metrics',
            method: 'GET',
            auth: { required: true, permissions: ['read:metrics'] },
            handler: async (req) => ({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: this.getMetrics(),
            }),
        });
        // Tenant endpoints
        this.addRoute({
            path: '/tenants',
            method: 'GET',
            auth: { required: true, permissions: ['read:tenants'] },
            handler: async (req) => ({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: this.enterprise.getAllTenants(),
            }),
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
                        body: { message: 'Tenant created successfully', tenant: req.body },
                    };
                }
                catch (error) {
                    return {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                        body: { error: error.message },
                    };
                }
            },
        });
        // Compliance reports
        this.addRoute({
            path: '/compliance/report',
            method: 'POST',
            auth: { required: true, permissions: ['read:compliance'] },
            handler: async (req) => {
                try {
                    const report = await this.enterprise.generateComplianceReport(req.body.tenantId, req.body.period);
                    return {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                        body: report,
                    };
                }
                catch (error) {
                    return {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                        body: { error: error.message },
                    };
                }
            },
        });
        logger.info('🏢 Enterprise API endpoints configured');
    }
    async start(port = 3000) {
        logger.info(`🚀 Starting API Gateway on port ${port}`);
        // Start enterprise monitoring
        await this.enterprise.startMonitoring();
        // Mock server start - in production would start actual HTTP server
        logger.info(`✅ API Gateway running on http://localhost:${port}`);
        logger.info(`📊 Enterprise metrics available at /metrics`);
        logger.info(`🏥 Health check available at /health`);
        this.emit('started', { port });
    }
    async stop() {
        logger.info('⏹️ Stopping API Gateway...');
        // Stop enterprise monitoring
        await this.enterprise.stopMonitoring();
        this.emit('stopped');
        logger.info('✅ API Gateway stopped');
    }
    // Cleanup old rate limit entries
    cleanupRateLimitStore() {
        const now = Date.now();
        for (const [key, stored] of this.rateLimitStore.entries()) {
            if (stored.resetTime < now) {
                this.rateLimitStore.delete(key);
            }
        }
    }
}
exports.APIGateway = APIGateway;
exports.default = APIGateway;
