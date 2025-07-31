// Add crash diagnostics at the very beginning
console.log('🚀 DataVault API starting up...');
console.log('📍 Current working directory:', process.cwd());
console.log('🔧 Node.js version:', process.version);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION - App will exit:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  console.error('Stack trace:', reason.stack);
  process.exit(1);
});

// Load modules and create app
let express, cors, helmet, rateLimit, emailRoutes, authRoutes, aliasRoutes, logger, db, app;

try {
  console.log('📦 Loading express...');
  express = require('express');
  
  console.log('📦 Loading middleware...');
  cors = require('cors');
  helmet = require('helmet');
  rateLimit = require('express-rate-limit');
  
  console.log('📦 Loading dotenv...');
  require('dotenv').config();
  
  console.log('📦 Loading routes...');
  emailRoutes = require('./routes/email');
  ({ router: authRoutes } = require('./routes/auth'));
  aliasRoutes = require('./routes/aliases');
  
  console.log('📦 Loading logger...');
  logger = require('./utils/logger');
  
  console.log('📦 Loading database...');
  db = require('./utils/database');
  
  console.log('✅ All modules loaded successfully');
  
  console.log('🏗️  Creating Express app...');
  app = express();
  
} catch (error) {
  console.error('💥 FATAL ERROR during module loading:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

console.log('🔧 Setting up middleware...');
try {
  // Security middleware
  console.log('🛡️  Adding helmet...');
  app.use(helmet());
  
  console.log('🌐 Adding CORS...');
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['chrome-extension://*'],
    credentials: true
  }));
  
  console.log('✅ Security middleware configured');
} catch (error) {
  console.error('💥 Error setting up security middleware:', error);
  process.exit(1);
}

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

// Start server with comprehensive error handling
console.log(`🚀 Starting server on port ${PORT}...`);

try {
  const server = app.listen(PORT, async () => {
    console.log(`✅ Server listening on port ${PORT}`);
    console.log(`🌐 Server should be accessible at http://localhost:${PORT}`);
    
    try {
      logger.info(`DataVault API server running on port ${PORT}`);
      
      // Test database connection with detailed logging
      console.log('🔍 Testing database connection...');
      logger.info('Testing database connection...');
      
      const result = await db.query('SELECT NOW() as server_time, version() as pg_version');
      
      if (result && result.rows && result.rows.length > 0) {
        console.log('✅ Database connected successfully!');
        logger.info('Database connected successfully', {
          serverTime: result.rows[0].server_time,
          pgVersion: result.rows[0].pg_version?.substring(0, 50) + '...',
          rowCount: result.rowCount
        });
      } else {
        console.error('❌ Database query returned no results');
        logger.error('Database query returned no results', { result });
      }
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
      logger.error('Database connection failed on startup', {
        error: err.message,
        code: err.code,
        stack: err.stack,
        dbUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
      });
    }
  });
  
  // Handle server errors
  server.on('error', (error) => {
    console.error('💥 Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    }
    process.exit(1);
  });
  
} catch (error) {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
}

module.exports = app;