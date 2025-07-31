const { Pool } = require('pg');
const logger = require('./logger');

// Log database configuration (with masked password)
const dbUrl = process.env.DATABASE_URL || '';
const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
logger.info('Database configuration', {
  url: maskedUrl,
  nodeEnv: process.env.NODE_ENV,
  hasUrl: !!process.env.DATABASE_URL
});

// Create connection pool with error handling
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Increased timeout
    // Additional debugging options
    log: (msg) => logger.debug('PG Pool:', msg),
  });
  
  logger.info('Database pool created successfully');
} catch (error) {
  logger.error('Failed to create database pool', { error: error.message, stack: error.stack });
  // Don't exit immediately, let the app try to handle it
}

// Connection event handlers
if (pool) {
  pool.on('connect', (client) => {
    logger.info('New database client connected');
  });
  
  pool.on('acquire', (client) => {
    logger.debug('Database client acquired from pool');
  });
  
  pool.on('error', (err, client) => {
    logger.error('Unexpected error on database client', { 
      error: err.message, 
      stack: err.stack,
      code: err.code 
    });
    // Don't exit on connection errors in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(-1);
    }
  });
  
  pool.on('remove', (client) => {
    logger.warn('Database client removed from pool');
  });
}

// Helper function for queries
const query = async (text, params) => {
  if (!pool) {
    const error = new Error('Database pool not initialized');
    logger.error('Query attempted with no pool', { text, error: error.message });
    throw error;
  }
  
  const start = Date.now();
  try {
    logger.debug('Executing query', { text: text.substring(0, 50) + '...', paramsCount: params?.length || 0 });
    
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (!res) {
      logger.error('Query returned undefined result', { text, duration });
      throw new Error('Database query returned undefined');
    }
    
    logger.debug('Query executed successfully', { 
      text: text.substring(0, 50) + '...', 
      duration, 
      rows: res.rowCount || 0,
      hasRows: !!(res.rows && res.rows.length > 0)
    });
    
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query failed', { 
      text: text.substring(0, 50) + '...', 
      error: error.message, 
      code: error.code,
      duration,
      stack: error.stack
    });
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Database helper functions
const db = {
  query,
  transaction,
  
  // User operations
  async createUser(email) {
    const result = await query(
      'INSERT INTO users (email) VALUES ($1) RETURNING *',
      [email]
    );
    return result.rows[0];
  },
  
  async getUserByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },
  
  async getUserById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },
  
  // Alias operations
  async createAlias(alias, userId) {
    const result = await query(
      'INSERT INTO aliases (alias, user_id) VALUES ($1, $2) RETURNING *',
      [alias, userId]
    );
    return result.rows[0];
  },
  
  async getAliasByName(alias) {
    const result = await query(`
      SELECT a.*, u.email as user_email 
      FROM aliases a 
      JOIN users u ON a.user_id = u.id 
      WHERE a.alias = $1 AND a.is_active = true
    `, [alias]);
    return result.rows[0];
  },
  
  async getUserAliases(userId) {
    const result = await query(
      'SELECT * FROM aliases WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },
  
  async updateAliasUsage(alias) {
    await query(`
      UPDATE aliases 
      SET email_count = email_count + 1, last_used = NOW() 
      WHERE alias = $1
    `, [alias]);
  },
  
  async deleteAlias(alias, userId) {
    const result = await query(
      'DELETE FROM aliases WHERE alias = $1 AND user_id = $2 RETURNING *',
      [alias, userId]
    );
    return result.rows[0];
  },
  
  // Email logging
  async logEmail(alias, senderEmail, subject, forwardedTo, status = 'delivered') {
    await query(`
      INSERT INTO email_logs (alias, sender_email, subject, forwarded_to, status)
      VALUES ($1, $2, $3, $4, $5)
    `, [alias, senderEmail, subject, forwardedTo, status]);
  },
  
  // Cleanup
  end: () => pool ? pool.end() : Promise.resolve(),
  
  // Expose pool for diagnostics
  get pool() {
    return pool;
  }
};

module.exports = db;