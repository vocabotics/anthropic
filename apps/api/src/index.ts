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

// Routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import healthRoutes from './routes/health.routes';

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

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

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
      // (will be implemented in Sprint 1)
    } catch (error) {
      logger.error('WebSocket message parse error:', error);
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
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
║   - Health:     http://localhost:${PORT}/health${' '.repeat(24)}║
║   - Auth:       http://localhost:${PORT}/api/auth${' '.repeat(21)}║
║   - Projects:   http://localhost:${PORT}/api/projects${' '.repeat(17)}║
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
