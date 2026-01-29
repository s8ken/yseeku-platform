"use strict";
/**
 * YSEEKU Platform Backend Server
 * Integrated with MongoDB, SecureAuthService, and Trust Protocol
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before any other imports
dotenv_1.default.config();
// Validate environment variables early
const validate_env_1 = require("./utils/validate-env");
(0, validate_env_1.validateEnvironmentOrExit)();
// Initialize telemetry before other imports when enabled
require("./observability/telemetry");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const socket_io_1 = require("socket.io");
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const agent_routes_1 = __importDefault(require("./routes/agent.routes"));
const llm_routes_1 = __importDefault(require("./routes/llm.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const trust_routes_1 = __importDefault(require("./routes/trust.routes"));
const emergence_routes_1 = __importDefault(require("./routes/emergence.routes"));
const monitoring_routes_1 = __importDefault(require("./routes/monitoring.routes"));
const alerts_routes_1 = __importDefault(require("./routes/alerts.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const risk_events_routes_1 = __importDefault(require("./routes/risk-events.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const lab_routes_1 = __importDefault(require("./routes/lab.routes"));
const vls_routes_1 = __importDefault(require("./routes/vls.routes"));
const tenant_routes_1 = __importDefault(require("./routes/tenant.routes"));
const api_gateway_routes_1 = __importDefault(require("./routes/api-gateway.routes"));
const orchestrate_routes_1 = __importDefault(require("./routes/orchestrate.routes"));
const overseer_routes_1 = __importDefault(require("./routes/overseer.routes"));
const secrets_routes_1 = __importDefault(require("./routes/secrets.routes"));
const override_routes_1 = __importDefault(require("./routes/override.routes"));
const demo_routes_1 = __importDefault(require("./routes/demo.routes"));
const did_routes_1 = __importDefault(require("./routes/did.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const live_routes_1 = __importDefault(require("./routes/live.routes"));
const safety_routes_1 = __importDefault(require("./routes/safety.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const compare_routes_1 = __importDefault(require("./routes/compare.routes"));
const consent_routes_1 = __importDefault(require("./routes/consent.routes"));
const proof_routes_1 = __importDefault(require("./routes/proof.routes"));
const safeguards_routes_1 = __importDefault(require("./routes/safeguards.routes"));
const interactions_routes_1 = __importDefault(require("./routes/interactions.routes"));
const socket_1 = require("./socket");
const live_metrics_service_1 = require("./services/live-metrics.service");
const user_model_1 = require("./models/user.model");
const agent_model_1 = require("./models/agent.model");
const mongoose_1 = __importStar(require("mongoose"));
const scheduler_1 = require("./services/brain/scheduler");
const logger_1 = __importDefault(require("./utils/logger"));
const request_logger_1 = require("./middleware/request-logger");
const rate_limit_1 = require("./middleware/rate-limit");
const http_metrics_1 = require("./middleware/http-metrics");
const correlation_middleware_1 = require("./middleware/correlation.middleware");
const tracing_1 = require("./observability/tracing");
const error_handler_1 = require("./middleware/error-handler");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : 'http://localhost:5000';
app.use((0, cors_1.default)({
    origin: corsOrigin,
    credentials: true,
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging middleware (all environments)
app.use(correlation_middleware_1.correlationMiddleware);
app.use(request_logger_1.requestLogger);
// Per-user/IP rate limiting
app.use(rate_limit_1.rateLimiter);
// HTTP metrics
app.use(http_metrics_1.httpMetrics);
// Annotate tracing span with user/tenant (no-op when OTEL disabled)
app.use((req, res, next) => {
    (0, tracing_1.annotateActiveSpan)({
        'user.id': req.userId || 'anonymous',
        'tenant.id': req.tenant || 'default',
        'http.client_ip': req.ip || req.socket.remoteAddress || 'unknown',
    });
    // Trace ID header disabled - OTEL not in use
    next();
});
// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'YSEEKU Platform Backend API is running',
        version: '1.11.1',
        documentation: '/api/docs',
        health: '/api/health',
        metrics: '/api/metrics'
    });
});
// Basic health check (simple version)
app.get('/health', (req, res) => {
    // Always return 200 - let the app handle MongoDB reconnection gracefully
    // Railway health checks should not fail if MongoDB is temporarily down
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        mongodb: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
    };
    // Always return 200 status code for health checks
    res.status(200).json(health);
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/agents', agent_routes_1.default);
app.use('/api/llm', llm_routes_1.default);
app.use('/api/conversations', conversation_routes_1.default);
app.use('/api/trust', trust_routes_1.default);
app.use('/api/emergence', emergence_routes_1.default); // Consciousness emergence detection
app.use('/api/dashboard', dashboard_routes_1.default); // Dashboard KPIs and risk
app.use('/api/dashboard/alerts', alerts_routes_1.default);
app.use('/api/risk-events', risk_events_routes_1.default); // Risk events management
app.use('/api/audit', audit_routes_1.default); // Audit trails and logs
app.use('/api/lab', lab_routes_1.default); // Lab experiments and A/B testing
app.use('/api/lab/vls', vls_routes_1.default); // Linguistic Vector Space (Research Preview)
app.use('/api/tenants', tenant_routes_1.default); // Tenant management
app.use('/api/gateway', api_gateway_routes_1.default); // API Gateway and Platform Keys
app.use('/api/orchestrate', orchestrate_routes_1.default); // Multi-Agent Orchestration
app.use('/api/overseer', overseer_routes_1.default); // System Brain / Overseer
app.use('/api/overrides', override_routes_1.default); // Override management
app.use('/api/webhooks', webhook_routes_1.default); // Webhook configuration and delivery
app.use('/api/live', live_routes_1.default); // Live dashboard metrics
app.use('/api/safety', safety_routes_1.default); // Prompt safety scanning
app.use('/api/reports', reports_routes_1.default); // Compliance reports
app.use('/api/compare', compare_routes_1.default); // Multi-model comparison
app.use('/api/consent', consent_routes_1.default); // Consent configuration and escalation
app.use('/api/proof', proof_routes_1.default); // Public /proof demo widget (no auth required)
app.use('/api/safeguards', safeguards_routes_1.default); // Relational safeguards and transmission log
app.use('/api/interactions', interactions_routes_1.default); // Interactions derived from conversations
app.use('/api', monitoring_routes_1.default); // Mount at /api for /api/metrics and /api/health
app.use('/api/secrets', secrets_routes_1.default);
const enableDemo = process.env.DEMO_ROUTES_ENABLED === 'true' || (process.env.NODE_ENV !== 'production');
if (enableDemo) {
    app.use('/api/demo', demo_routes_1.default);
}
app.use('/.well-known', did_routes_1.default); // DID resolution at standard .well-known path (no auth required)
app.use('/api/did', did_routes_1.default); // DID API endpoints
// 404 handler - catch unmatched routes
app.use(error_handler_1.notFoundHandler);
// Error logging middleware
app.use(request_logger_1.errorLogger);
// Global error handler - must be last
app.use(error_handler_1.globalErrorHandler);
// Start server
async function startServer() {
    // Start listening FIRST so health checks pass immediately
    server.listen(PORT, () => {
        logger_1.default.info('YSEEKU Platform Backend Server started', {
            port: PORT,
            environment: process.env.NODE_ENV || 'development',
            version: '1.12.0',
        });
        console.log(`Server listening on port ${PORT}`);
    });
    try {
        // Connect to database (non-blocking for health checks)
        await (0, database_1.connectDatabase)();
        logger_1.default.info('Database connected successfully', {
            host: 'MongoDB',
            status: 'connected',
        });
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (adminEmail && adminPassword) {
            try {
                let existingAdmin = await user_model_1.User.findOne({ email: adminEmail });
                if (!existingAdmin) {
                    existingAdmin = await user_model_1.User.create({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
                    logger_1.default.info('Admin user provisioned', { email: adminEmail });
                }
                else {
                    logger_1.default.info('Admin user exists', { email: adminEmail });
                }
                const existingAnthropicAgent = await agent_model_1.Agent.findOne({ user: existingAdmin._id, provider: 'anthropic' });
                if (!existingAnthropicAgent) {
                    await agent_model_1.Agent.create({
                        name: 'Nova - Creative Writer',
                        description: 'Anthropic agent for trustworthy creative assistance',
                        user: existingAdmin._id,
                        provider: 'anthropic',
                        model: 'claude-sonnet-4-20250514',
                        apiKeyId: new mongoose_1.Types.ObjectId(),
                        systemPrompt: 'You are Nova, a helpful assistant. Be concise, accurate, and ethically aligned.',
                        temperature: 0.7,
                        maxTokens: 2000,
                        isPublic: true,
                        traits: new Map([
                            ['ethical_alignment', 4.8],
                            ['creativity', 4.5],
                            ['precision', 4.6],
                            ['adaptability', 4.2],
                        ]),
                        ciModel: 'sonate-core',
                        lastActive: new Date(),
                    });
                    logger_1.default.info('Default Anthropic agent provisioned for admin');
                }
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                logger_1.default.warn('Admin provisioning failed', { error: msg });
            }
        }
        // Ensure demo user has a default Anthropic agent
        try {
            const demoUser = await user_model_1.User.findOne({ email: 'demo@yseeku.com' });
            if (demoUser) {
                const demoAnthropic = await agent_model_1.Agent.findOne({ user: demoUser._id, provider: 'anthropic' });
                if (!demoAnthropic) {
                    await agent_model_1.Agent.create({
                        name: 'Nova - Creative Writer',
                        description: 'Anthropic agent for trustworthy creative assistance',
                        user: demoUser._id,
                        provider: 'anthropic',
                        model: 'claude-sonnet-4-20250514',
                        apiKeyId: new mongoose_1.Types.ObjectId(),
                        systemPrompt: 'You are Nova, a helpful assistant. Be concise, accurate, and ethically aligned.',
                        temperature: 0.7,
                        maxTokens: 2000,
                        isPublic: true,
                        traits: new Map([
                            ['ethical_alignment', 4.8],
                            ['creativity', 4.5],
                            ['precision', 4.6],
                            ['adaptability', 4.2],
                        ]),
                        ciModel: 'sonate-core',
                        lastActive: new Date(),
                    });
                    logger_1.default.info('Default Anthropic agent provisioned for demo user');
                }
            }
            else {
                logger_1.default.warn('Demo user not found during agent provisioning');
            }
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            logger_1.default.warn('Demo agent provisioning failed', { error: msg });
        }
        // Initialize Socket.IO
        const io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
                credentials: true,
            },
        });
        (0, socket_1.initializeSocket)(io);
        live_metrics_service_1.liveMetricsService.initialize(io); // Initialize live metrics broadcasting
        logger_1.default.info('Socket.IO server initialized', {
            realtime: 'enabled',
            liveMetrics: 'enabled',
        });
        // Start background scheduler
        (0, scheduler_1.startOverseerScheduler)().catch(() => { });
        logger_1.default.info('Backend fully initialized', {
            database: 'MongoDB Connected',
            security: 'SecureAuthService Enabled',
            trust: 'SONATE Protocol Active',
            realtime: 'Socket.IO Enabled',
        });
    }
    catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger_1.default.error('Backend initialization error (server still running)', {
            error: err.message,
            stack: err.stack,
        });
        // Don't exit - let health checks still work, just log the error
    }
}
startServer();
// Global error handlers
process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger_1.default.error('Unhandled promise rejection', {
        error: err.message,
        stack: err.stack,
    });
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
    });
    // In production, exit to allow a supervisor to restart
    if ((process.env.NODE_ENV || 'development') === 'production') {
        process.exit(1);
    }
});
// Build trigger: 1769606975
