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
app.listen(PORT, () => {
  logger.info(`DataVault API server running on port ${PORT}`);
  
  // Test database connection
  db.query('SELECT NOW()', (err, result) => {
    if (err) {
      logger.error('Database connection failed:', err);
    } else {
      logger.info('Database connected successfully');
    }
  });
});

module.exports = app;