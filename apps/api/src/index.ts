/**
 * Vocabotics API
 * Express + TypeScript Backend
 *
 * Dogfooding: This is the SAME stack we generate for users
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { setupSwagger } from './swagger';
import {
  requestTiming,
  requestId,
  etagMiddleware,
  queryOptimizationHints,
} from './middleware/performance.middleware';
import {
  secureHeaders,
  sanitizeInput,
  preventSqlInjection,
  preventParameterPollution,
  auditLog,
} from './middleware/security.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import healthRoutes from './routes/health.routes';
import keysRoutes from './routes/keys.routes';
import githubRoutes from './routes/github.routes';
import executeRoutes from './routes/execute.routes';
import workflowRoutes from './routes/workflow.routes';
import stripeRoutes from './routes/stripe.routes';
import adminRoutes from './routes/admin.routes';
import integrationMapRoutes from './routes/integration-map.routes';
import qualityRoutes from './routes/quality.routes';
import visualTestingRoutes from './routes/visual-testing.routes';
import traceabilityRoutes from './routes/traceability.routes';
import complianceRoutes from './routes/compliance.routes';

// Environment
const PORT = parseInt(process.env.API_PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

// Create Express app
const app = express();

// Create HTTP server (for WebSocket support)
const server = createServer(app);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Performance middleware
app.use(requestId);
app.use(requestTiming);
app.use(queryOptimizationHints);
app.use(etagMiddleware);

// Security middleware
app.use(secureHeaders);
app.use(sanitizeInput);
app.use(preventSqlInjection);
app.use(preventParameterPollution);
app.use(auditLog);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// ============================================================================
// API DOCUMENTATION
// ============================================================================

setupSwagger(app);

// ============================================================================
// ROUTES
// ============================================================================

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/keys', keysRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integration-map', integrationMapRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/visual-testing', visualTestingRoutes);
app.use('/api/traceability', traceabilityRoutes);
app.use('/api/compliance', complianceRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// ============================================================================
// WEBSOCKET SERVER (for real-time updates)
// ============================================================================

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  logger.info('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      logger.info('WebSocket message:', data);

      // Handle different message types
      if (data.type === 'subscribe' && data.projectId) {
        // Subscribe to project workflow events
        const { workflowService } = require('./services/workflow.service');
        workflowService.addWebSocketConnection(data.projectId, ws);
        ws.send(JSON.stringify({
          type: 'subscribed',
          projectId: data.projectId,
          timestamp: new Date(),
        }));
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
      }
    } catch (error) {
      logger.error('WebSocket message parse error:', error);
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket client disconnected');

    // Clean up workflow subscriptions
    const { workflowService } = require('./services/workflow.service');
    // Remove from all project subscriptions
    // (workflowService tracks which projects this ws is subscribed to)
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

// ============================================================================
// SERVER LIFECYCLE
// ============================================================================

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✓ Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('✓ Redis connected');

    // Start server
    server.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 Vocabotics API Server                                     ║
║                                                                ║
║   Environment:  ${NODE_ENV.padEnd(48)}║
║   Port:         ${PORT.toString().padEnd(48)}║
║   Database:     Connected ✓${' '.repeat(38)}║
║   Redis:        Connected ✓${' '.repeat(38)}║
║   WebSocket:    Enabled ✓${' '.repeat(40)}║
║                                                                ║
║   Endpoints:                                                   ║
║   - Docs:       http://localhost:${PORT}/api-docs${' '.repeat(21)}║
║   - Health:     http://localhost:${PORT}/health${' '.repeat(24)}║
║   - Auth:       http://localhost:${PORT}/api/auth${' '.repeat(21)}║
║   - Projects:   http://localhost:${PORT}/api/projects${' '.repeat(17)}║
║   - Keys:       http://localhost:${PORT}/api/keys${' '.repeat(22)}║
║   - GitHub:     http://localhost:${PORT}/api/github${' '.repeat(20)}║
║   - Execute:    http://localhost:${PORT}/api/execute${' '.repeat(19)}║
║   - Workflow:   http://localhost:${PORT}/api/workflow${' '.repeat(18)}║
║   - Stripe:     http://localhost:${PORT}/api/stripe${' '.repeat(20)}║
║   - Admin:      http://localhost:${PORT}/api/admin${' '.repeat(22)}║
║   - Integration:http://localhost:${PORT}/api/integration-map${' '.repeat(9)}║
║   - Quality:    http://localhost:${PORT}/api/quality${' '.repeat(19)}║
║   - Visual:     http://localhost:${PORT}/api/visual-testing${' '.repeat(12)}║
║   - Traceability:http://localhost:${PORT}/api/traceability${' '.repeat(11)}║
║   - Compliance: http://localhost:${PORT}/api/compliance${' '.repeat(15)}║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down gracefully...');

  try {
    // Close WebSocket server
    wss.close();

    // Close server
    server.close();

    // Disconnect database
    await prisma.$disconnect();

    // Disconnect Redis
    await redis.quit();

    logger.info('✓ Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});
