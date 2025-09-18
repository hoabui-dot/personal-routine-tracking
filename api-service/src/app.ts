import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection } from './db';
import goalsRouter from './routes/goals';
import subGoalsRouter from './routes/subGoals';
import sessionsRouter from './routes/sessions';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 4000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: [
    process.env['FRONTEND_URL'] || 'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Personal Tracker API',
  });
});

// API routes
app.use('/goals', goalsRouter);
app.use('/sub-goals', subGoalsRouter);
app.use('/sessions', sessionsRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env['NODE_ENV'] === 'development' && { details: err.message }),
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Personal Tracker API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🎯 Goals API: http://localhost:${PORT}/goals`);
      console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
