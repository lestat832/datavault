const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const emailRoutes = require('./routes/email');
const { router: authRoutes } = require('./routes/auth');
const aliasRoutes = require('./routes/aliases');
const logger = require('./utils/logger');
const db = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['chrome-extension://*'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Webhook rate limiter (more permissive)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // High limit for email webhooks
  skip: (req) => req.headers['cf-connecting-ip'] // Skip for Cloudflare IPs
});
app.use('/webhook/', webhookLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' })); // Large limit for email content
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Database test endpoint
app.get('/test-db', async (req, res) => {
  try {
    logger.info('Database test endpoint called');
    
    // Test 1: Check if DATABASE_URL exists
    const hasDbUrl = !!process.env.DATABASE_URL;
    const maskedUrl = process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/:([^@]+)@/, ':****@') : 'NOT_SET';
    
    // Test 2: Try a simple query
    let queryResult = null;
    let queryError = null;
    
    try {
      const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
      queryResult = {
        success: true,
        currentTime: result.rows[0]?.current_time,
        pgVersion: result.rows[0]?.pg_version,
        rowCount: result.rowCount
      };
    } catch (error) {
      queryError = {
        message: error.message,
        code: error.code,
        stack: error.stack
      };
    }
    
    const response = {
      status: queryResult ? 'success' : 'error',
      timestamp: new Date().toISOString(),
      tests: {
        environment: {
          hasDbUrl,
          dbUrl: maskedUrl,
          nodeEnv: process.env.NODE_ENV
        },
        query: queryResult,
        queryError
      }
    };
    
    res.json(response);
    
  } catch (error) {
    logger.error('Database test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Routes
app.use('/webhook', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/aliases', aliasRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.id 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  logger.info(`DataVault API server running on port ${PORT}`);
  
  // Test database connection with detailed logging
  try {
    logger.info('Testing database connection...');
    const result = await db.query('SELECT NOW() as server_time, version() as pg_version');
    
    if (result && result.rows && result.rows.length > 0) {
      logger.info('Database connected successfully', {
        serverTime: result.rows[0].server_time,
        pgVersion: result.rows[0].pg_version?.substring(0, 50) + '...',
        rowCount: result.rowCount
      });
    } else {
      logger.error('Database query returned no results', { result });
    }
  } catch (err) {
    logger.error('Database connection failed on startup', {
      error: err.message,
      code: err.code,
      stack: err.stack,
      dbUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
    });
  }
});

module.exports = app;