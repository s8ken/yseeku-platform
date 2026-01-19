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
import authRoutes from './routes/auth.routes';
import agentRoutes from './routes/agent.routes';
import llmRoutes from './routes/llm.routes';
import conversationRoutes from './routes/conversation.routes';
import trustRoutes from './routes/trust.routes';
import monitoringRoutes from './routes/monitoring.routes';
import alertsRoutes from './routes/alerts.routes';
import dashboardRoutes from './routes/dashboard.routes';
import riskEventsRoutes from './routes/risk-events.routes';
import auditRoutes from './routes/audit.routes';
import labRoutes from './routes/lab.routes';
import tenantRoutes from './routes/tenant.routes';
import apiGatewayRoutes from './routes/api-gateway.routes';
import orchestrateRoutes from './routes/orchestrate.routes';
import overseerRoutes from './routes/overseer.routes';
import secretsRoutes from './routes/secrets.routes';
import overrideRoutes from './routes/override.routes';
import demoRoutes from './routes/demo.routes';
import didRoutes from './routes/did.routes';
import webhookRoutes from './routes/webhook.routes';
import liveRoutes from './routes/live.routes';
import safetyRoutes from './routes/safety.routes';
import reportsRoutes from './routes/reports.routes';
import compareRoutes from './routes/compare.routes';
import consentRoutes from './routes/consent.routes';
import { initializeSocket } from './socket';
import { liveMetricsService } from './services/live-metrics.service';
import { User } from './models/user.model';
import { Agent } from './models/agent.model';
import { Types } from 'mongoose';
import { startOverseerScheduler } from './services/brain/scheduler';
import logger from './utils/logger';
import { requestLogger, errorLogger } from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limit';
import { httpMetrics } from './middleware/http-metrics';
import { correlationMiddleware } from './middleware/correlation.middleware';
import { annotateActiveSpan } from './observability/tracing';
import { globalErrorHandler, notFoundHandler } from './middleware/error-handler';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

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

// Per-user/IP rate limiting
app.use(rateLimiter);

// HTTP metrics
app.use(httpMetrics);

// Annotate tracing span with user/tenant and expose trace id
app.use((req, res, next) => {
  annotateActiveSpan({
    'user.id': req.userId || 'anonymous',
    'tenant.id': req.tenant || 'default',
    'http.client_ip': req.ip || req.socket.remoteAddress || 'unknown',
  });
  const span = require('@opentelemetry/api').trace.getActiveSpan();
  const traceId = span?.spanContext().traceId;
  if (traceId) res.setHeader('x-trace-id', traceId);
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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/dashboard', dashboardRoutes); // Dashboard KPIs and risk
app.use('/api/dashboard/alerts', alertsRoutes);
app.use('/api/risk-events', riskEventsRoutes); // Risk events management
app.use('/api/audit', auditRoutes); // Audit trails and logs
app.use('/api/lab', labRoutes); // Lab experiments and A/B testing
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
app.use('/api', monitoringRoutes); // Mount at /api for /api/metrics and /api/health
app.use('/api/secrets', secretsRoutes);
const enableDemo = process.env.DEMO_ROUTES_ENABLED === 'true' || (process.env.NODE_ENV !== 'production');
if (enableDemo) {
  app.use('/api/demo', demoRoutes);
}
app.use('/.well-known', didRoutes); // DID resolution at standard .well-known path (no auth required)
app.use('/api/did', didRoutes); // DID API endpoints

// 404 handler - catch unmatched routes
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Global error handler - must be last
app.use(globalErrorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
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
            ciModel: 'symbi-core',
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
            ciModel: 'symbi-core',
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

    // Start listening
    server.listen(PORT, () => {
      logger.info('YSEEKU Platform Backend Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        database: 'MongoDB Connected',
        security: 'SecureAuthService Enabled',
        trust: 'SYMBI Protocol Active',
        realtime: 'Socket.IO Enabled',
        version: '1.12.0',
      });

      // Pretty console output for development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 YSEEKU Platform Backend Server               ║
║                                                   ║
║   Port:        ${PORT.toString().padEnd(36)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(36)}║
║   Database:    MongoDB Connected                  ║
║   Security:    SecureAuthService Enabled          ║
║   Trust:       SYMBI Protocol Active              ║
║   Real-time:   Socket.IO Enabled                  ║
║   Logging:     Winston Structured Logging         ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
        `);
      }

      startOverseerScheduler().catch(() => {});
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to start server', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
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
