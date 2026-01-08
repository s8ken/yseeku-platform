/**
 * YSEEKU Platform Backend Server
 * Integrated with MongoDB, SecureAuthService, and Trust Protocol
 */

import dotenv from 'dotenv';
// Load environment variables before any other imports
dotenv.config();

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
import { initializeSocket } from './socket';
import logger from './utils/logger';
import { requestLogger, errorLogger } from './middleware/request-logger';

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
app.use(requestLogger);

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
app.use('/api', monitoringRoutes); // Mount at /api for /api/metrics and /api/health

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map((e: any) => e.message),
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      field: Object.keys(err.keyPattern)[0],
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    details: err.stack,
    error: JSON.stringify(err, Object.getOwnPropertyNames(err))
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully', {
      host: 'MongoDB',
      status: 'connected',
    });

    // Initialize Socket.IO
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      },
    });
    initializeSocket(io);
    logger.info('Socket.IO server initialized', {
      realtime: 'enabled',
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
    });
  } catch (error: any) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();