const { Pool } = require('pg');
const logger = require('./logger');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection error handling
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function for queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error: error.message });
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
  end: () => pool.end()
};

module.exports = db;