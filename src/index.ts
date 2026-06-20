/**
 * Updated Main Application Entry Point
 * Integrates ProcessingService and all routes
 */

import express, { Express } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { VideoGenerator } from './core/videoGenerator';
import { ProcessingService } from './core/processingService';
import { configureRoutes } from './routes';
import { processingRoutes } from './routes/processingRoutes';
import { validateConfig, config } from './config/config';
import { Logger, LogLevel } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = new Logger(10000, LogLevel.INFO);

// Validate configuration
if (!validateConfig()) {
  logger.error('Configuration validation failed');
  process.exit(1);
}

// Create Express app
const app: Express = express();
const PORT = config.server.port;
const HOST = config.server.host;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    query: req.query
  });
  next();
});

// Initialize services
const videoGenerator = new VideoGenerator();
const processingService = new ProcessingService();

// Configure routes
configureRoutes(app, videoGenerator);

// Processing routes
app.use('/api/processing', processingRoutes(processingService));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Mehram Video Generator is running',
    environment: config.server.env,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'Mehram Video Generator API',
    version: '1.0.0',
    description: 'Powerful video generation and processing platform',
    endpoints: {
      'GET /health': 'Health check',
      'GET /api': 'API documentation',
      'POST /api/videos/generate': 'Generate a new video',
      'GET /api/videos/config': 'Get video generator configuration',
      'POST /api/videos/config': 'Update video generator configuration',
      'POST /api/processing/process': 'Submit video processing job',
      'GET /api/processing/status': 'Get processing queue status',
      'GET /api/processing/templates': 'List available templates',
      'GET /api/processing/storage': 'Get storage usage information',
      'GET /api/processing/statistics': 'Get database statistics'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err, err instanceof Error ? err : undefined);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Graceful shutdown handler
let server: any;

process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    logger.info('Server closed');
    await processingService.cleanup();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    logger.info('Server closed');
    await processingService.cleanup();
    process.exit(0);
  });
});

// Start server
server = app.listen(PORT, HOST, () => {
  console.log(`
${'='.repeat(50)}`);
  console.log('✨ Mehram Video Generator Started');
  console.log(`${'='.repeat(50)}`);
  console.log(`
🚀 Server is running at http://${HOST}:${PORT}`);
  console.log(`📍 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`📚 API Docs: http://${HOST}:${PORT}/api`);
  console.log(`⚙️  Environment: ${config.server.env}`);
  console.log(`
📁 Output Directory: ${config.video.outputDir}`);
  console.log(`📊 Max Concurrent Jobs: ${config.queue.maxConcurrent}`);
  console.log(`💾 Database: ${config.database.path}`);
  console.log(`
${'='.repeat(50)}\n`);
  logger.info('Mehram Video Generator started successfully');
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  } else {
    logger.error('Server error', err, err);
  }
  process.exit(1);
});

export default app;