/**
 * YSEEKU Platform Backend Server
 * Integrated with MongoDB, SecureAuthService, and Trust Protocol
 */

import dotenv from 'dotenv';
// Load environment variables before any other imports
dotenv.config();

// Validate environment variables early
import { validateEnvironmentOrExit } from './utils/validate-env';
validateEnvironmentOrExit();

// Initialize telemetry before other imports when enabled
import './observability/telemetry';

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from './config/database';
import { initializeRoutes } from './routes';
import authRoutes from './routes/auth-routes';
import metricsRoutes from './routes/metrics-routes';
import agentRoutes from './routes/agent.routes';
import llmRoutes from './routes/llm.routes';
import conversationRoutes from './routes/conversation.routes';
import trustRoutes from './routes/trust.routes';
import emergenceRoutes from './routes/emergence.routes';
import monitoringRoutes from './routes/monitoring.routes';
import alertsRoutes from './routes/alerts.routes';
import dashboardRoutes from './routes/dashboard.routes';
import riskEventsRoutes from './routes/risk-events.routes';
import auditRoutes from './routes/audit.routes';
import labRoutes from './routes/lab.routes';
import vlsRoutes from './routes/vls.routes';
import tenantRoutes from './routes/tenant.routes';
import apiGatewayRoutes from './routes/api-gateway.routes';
import orchestrateRoutes from './routes/orchestrate.routes';
import overseerRoutes from './routes/overseer.routes';
import secretsRoutes from './routes/secrets.routes';
import overrideRoutes from './routes/override.routes';
import demoRoutes from './routes/demo.routes';
import evaluationMethodRoutes from './routes/evaluation-method.routes';
import didRoutes from './routes/did.routes';
import pubkeyRoutes from './routes/pubkey.routes';
import publicDemoRoutes from './routes/public-demo.routes';
import webhookRoutes from './routes/webhook.routes';
import liveRoutes from './routes/live.routes';
import safetyRoutes from './routes/safety.routes';
import reportsRoutes from './routes/reports.routes';
import compareRoutes from './routes/compare.routes';
import consentRoutes from './routes/consent.routes';
import proofRoutes from './routes/proof.routes';
import safeguardsRoutes from './routes/safeguards.routes';
import interactionsRoutes from './routes/interactions.routes';
import semanticCoprocessorRoutes from './routes/semantic-coprocessor.routes';
import phaseShiftRoutes from './routes/phase-shift.routes';
import driftRoutes from './routes/drift.routes';
import insightsRoutes from './routes/insights.routes';
import actionsRoutes from './routes/actions.routes';
import { initializeSocket } from './socket';
import { liveMetricsService } from './services/live-metrics.service';
import { User } from './models/user.model';
import { Agent } from './models/agent.model';
import mongoose, { Types } from 'mongoose';
import { startOverseerScheduler } from './services/brain/scheduler';
import logger from './utils/logger';
import { requestLogger, errorLogger } from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limit';
import { httpMetrics } from './middleware/http-metrics';
import { correlationMiddleware } from './middleware/correlation.middleware';
import { annotateActiveSpan } from './observability/tracing';
import { globalErrorHandler, notFoundHandler } from './middleware/error-handler';
import { securityHeaders } from './middleware/security-headers';
import { createTenantRateLimiter } from './middleware/tenant-rate-limit';
// Note: input-validation.ts provides additional sanitization and security features
// Available for use on sensitive routes requiring extra validation
// import { sanitizeInput } from './middleware/input-validation';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Custom security headers (comprehensive, works with helmet)
app.use(securityHeaders);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : 'http://localhost:5000';

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (all environments)
app.use(correlationMiddleware);
app.use(requestLogger);

// Tenant-aware rate limiting (before global rate limiter for more specific control)
app.use(createTenantRateLimiter());

// Per-user/IP rate limiting
app.use(rateLimiter);

// HTTP metrics
app.use(httpMetrics);

// Annotate tracing span with user/tenant (no-op when OTEL disabled)
app.use((req, res, next) => {
  annotateActiveSpan({
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
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };
  
  // Always return 200 status code for health checks
  res.status(200).json(health);
});

// API Routes

// Metrics (Prometheus) - Available at standard paths
app.use('/metrics', metricsRoutes);

// Authentication (both v2 and legacy paths)
app.use('/api/v2/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Phase 1-2 Routes (Policy Engine, WebSocket Alerts, Overrides, Audit)
app.use('', initializeRoutes(server));
app.use('/api/agents', agentRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/emergence', emergenceRoutes); // Consciousness emergence detection
app.use('/api/dashboard', dashboardRoutes); // Dashboard KPIs and risk
app.use('/api/dashboard/alerts', alertsRoutes);
app.use('/api/risk-events', riskEventsRoutes); // Risk events management
app.use('/api/audit', auditRoutes); // Audit trails and logs
app.use('/api/lab', labRoutes); // Lab experiments and A/B testing
app.use('/api/lab/vls', vlsRoutes); // Linguistic Vector Space (Research Preview)
app.use('/api/tenants', tenantRoutes); // Tenant management
app.use('/api/gateway', apiGatewayRoutes); // API Gateway and Platform Keys
app.use('/api/orchestrate', orchestrateRoutes); // Multi-Agent Orchestration
app.use('/api/overseer', overseerRoutes); // System Brain / Overseer
app.use('/api/overrides', overrideRoutes); // Override management
app.use('/api/webhooks', webhookRoutes); // Webhook configuration and delivery
app.use('/api/live', liveRoutes); // Live dashboard metrics
app.use('/api/safety', safetyRoutes); // Prompt safety scanning
app.use('/api/reports', reportsRoutes); // Compliance reports
app.use('/api/compare', compareRoutes); // Multi-model comparison
app.use('/api/consent', consentRoutes); // Consent configuration and escalation
app.use('/api/proof', proofRoutes); // Public /proof demo widget (no auth required)
app.use('/api/safeguards', safeguardsRoutes); // Relational safeguards and transmission log
app.use('/api/interactions', interactionsRoutes); // Interactions derived from conversations
app.use('/api/semantic-coprocessor', semanticCoprocessorRoutes); // Semantic coprocessor status and stats
app.use('/api/phase-shift', phaseShiftRoutes); // Phase-shift velocity metrics
app.use('/api/drift', driftRoutes); // Statistical drift detection metrics
app.use('/api/insights', insightsRoutes); // Actionable insights and recommendations
app.use('/api/actions', actionsRoutes); // Action effectiveness and recommendations
app.use('/api', monitoringRoutes); // Mount at /api for /api/metrics and /api/health
app.use('/api/secrets', secretsRoutes);
app.use('/api/evaluation-method', evaluationMethodRoutes);
const enableDemo = process.env.ENABLE_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
if (enableDemo) {
  app.use('/api/demo', demoRoutes);
}
app.use('/.well-known', didRoutes); // DID resolution at standard .well-known path (no auth required)
app.use('/.well-known', pubkeyRoutes); // Public key for receipt verification (no auth required)
app.use('/api/public-demo', publicDemoRoutes); // Public demo endpoints (no auth required)
app.use('/api/did', didRoutes); // DID API endpoints

// 404 handler - catch unmatched routes
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Global error handler - must be last
app.use(globalErrorHandler);

// Start server
async function startServer() {
  // Start listening FIRST so health checks pass immediately
  server.listen(PORT, () => {
    logger.info('YSEEKU Platform Backend Server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      version: '1.12.0',
    });
  });

  try {
    // Connect to database (non-blocking for health checks)
    await connectDatabase();
    logger.info('Database connected successfully', {
      host: 'MongoDB',
      status: 'connected',
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      try {
        let existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
          existingAdmin = await User.create({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
          logger.info('Admin user provisioned', { email: adminEmail });
        } else {
          logger.info('Admin user exists', { email: adminEmail });
        }

        const existingAnthropicAgent = await Agent.findOne({ user: existingAdmin._id, provider: 'anthropic' });
        if (!existingAnthropicAgent) {
          await Agent.create({
            name: 'Nova - Creative Writer',
            description: 'Anthropic agent for trustworthy creative assistance',
            user: existingAdmin._id,
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            apiKeyId: new Types.ObjectId(),
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
          logger.info('Default Anthropic agent provisioned for admin');
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.warn('Admin provisioning failed', { error: msg });
      }
    }

    // Ensure demo user has a default Anthropic agent
    try {
      const demoUser = await User.findOne({ email: 'demo@yseeku.com' });
      if (demoUser) {
        const demoAnthropic = await Agent.findOne({ user: demoUser._id, provider: 'anthropic' });
        if (!demoAnthropic) {
          await Agent.create({
            name: 'Nova - Creative Writer',
            description: 'Anthropic agent for trustworthy creative assistance',
            user: demoUser._id,
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            apiKeyId: new Types.ObjectId(),
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
          logger.info('Default Anthropic agent provisioned for demo user');
        }
      } else {
        logger.warn('Demo user not found during agent provisioning');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn('Demo agent provisioning failed', { error: msg });
    }

    // Initialize Socket.IO
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      },
    });
    initializeSocket(io);
    liveMetricsService.initialize(io); // Initialize live metrics broadcasting
    logger.info('Socket.IO server initialized', {
      realtime: 'enabled',
      liveMetrics: 'enabled',
    });

    // Start background scheduler
    startOverseerScheduler().catch(() => {});

    logger.info('Backend fully initialized', {
      database: 'MongoDB Connected',
      security: 'SecureAuthService Enabled',
      trust: 'SONATE Protocol Active',
      realtime: 'Socket.IO Enabled',
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Backend initialization error (server still running)', {
      error: err.message,
      stack: err.stack,
    });
    // Don't exit - let health checks still work, just log the error
  }
}

startServer();

// Global error handlers
process.on('unhandledRejection', (reason: unknown) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('Unhandled promise rejection', {
    error: err.message,
    stack: err.stack,
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  // In production, exit to allow a supervisor to restart
  if ((process.env.NODE_ENV || 'development') === 'production') {
    process.exit(1);
  }
});
// Build trigger: 1769606975
