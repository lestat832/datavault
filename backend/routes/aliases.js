const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const db = require('../utils/database');
const logger = require('../utils/logger');

const router = express.Router();

// Generate 8-character alphanumeric alias
function generateAlias() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let alias = '';
  
  // Use crypto.getRandomValues for secure random generation
  const array = new Uint8Array(8);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Node.js environment
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }
  
  for (let i = 0; i < 8; i++) {
    alias += chars[array[i] % chars.length];
  }
  
  return alias;
}

// Check if alias contains inappropriate words (basic filter)
function isAliasAppropriate(alias) {
  const inappropriate = ['fuck', 'shit', 'damn', 'porn', 'nazi', 'kill'];
  return !inappropriate.some(word => alias.includes(word));
}

// Create new alias
router.post('/', authenticateToken, async (req, res) => {
  try {
    let attempts = 0;
    const maxAttempts = 10;
    let alias;
    
    // Generate unique alias
    do {
      alias = generateAlias();
      attempts++;
      
      if (attempts > maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique alias' });
      }
      
      // Check if alias is appropriate
      if (!isAliasAppropriate(alias)) {
        continue;
      }
      
      // Check if alias already exists
      const existing = await db.getAliasByName(alias);
      if (!existing) {
        break; // Found unique alias
      }
    } while (true);
    
    // Create alias in database
    const newAlias = await db.createAlias(alias, req.userId);
    
    logger.info('Alias created', { 
      userId: req.userId, 
      alias: alias,
      fullAddress: `${alias}@datavlt.io`
    });
    
    res.status(201).json({
      success: true,
      alias: {
        alias: newAlias.alias,
        full_address: `${newAlias.alias}@datavlt.io`,
        user_id: newAlias.user_id,
        is_active: newAlias.is_active,
        created_at: newAlias.created_at
      }
    });
    
  } catch (error) {
    logger.error('Alias creation error:', error);
    res.status(500).json({ error: 'Failed to create alias' });
  }
});

// Get user's aliases
router.get('/', authenticateToken, async (req, res) => {
  try {
    const aliases = await db.getUserAliases(req.userId);
    
    const formattedAliases = aliases.map(alias => ({
      alias: alias.alias,
      full_address: `${alias.alias}@datavlt.io`,
      is_active: alias.is_active,
      email_count: alias.email_count,
      created_at: alias.created_at,
      last_used: alias.last_used
    }));
    
    res.json({
      success: true,
      aliases: formattedAliases,
      count: formattedAliases.length
    });
    
  } catch (error) {
    logger.error('Get aliases error:', error);
    res.status(500).json({ error: 'Failed to get aliases' });
  }
});

// Get specific alias
router.get('/:alias', authenticateToken, async (req, res) => {
  try {
    const { alias } = req.params;
    
    if (alias.length !== 8) {
      return res.status(400).json({ error: 'Invalid alias format' });
    }
    
    const aliasData = await db.getAliasByName(alias);
    
    if (!aliasData || aliasData.user_id !== req.userId) {
      return res.status(404).json({ error: 'Alias not found' });
    }
    
    res.json({
      success: true,
      alias: {
        alias: aliasData.alias,
        full_address: `${aliasData.alias}@datavlt.io`,
        is_active: aliasData.is_active,
        email_count: aliasData.email_count,
        created_at: aliasData.created_at,
        last_used: aliasData.last_used
      }
    });
    
  } catch (error) {
    logger.error('Get alias error:', error);
    res.status(500).json({ error: 'Failed to get alias' });
  }
});

// Delete alias
router.delete('/:alias', authenticateToken, async (req, res) => {
  try {
    const { alias } = req.params;
    
    if (alias.length !== 8) {
      return res.status(400).json({ error: 'Invalid alias format' });
    }
    
    const deletedAlias = await db.deleteAlias(alias, req.userId);
    
    if (!deletedAlias) {
      return res.status(404).json({ error: 'Alias not found' });
    }
    
    logger.info('Alias deleted', { 
      userId: req.userId, 
      alias: alias 
    });
    
    res.json({
      success: true,
      message: 'Alias deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete alias error:', error);
    res.status(500).json({ error: 'Failed to delete alias' });
  }
});

// Toggle alias active status
router.patch('/:alias/toggle', authenticateToken, async (req, res) => {
  try {
    const { alias } = req.params;
    
    if (alias.length !== 8) {
      return res.status(400).json({ error: 'Invalid alias format' });
    }
    
    // First check if alias belongs to user
    const aliasData = await db.getAliasByName(alias);
    if (!aliasData || aliasData.user_id !== req.userId) {
      return res.status(404).json({ error: 'Alias not found' });
    }
    
    // Toggle active status
    const newStatus = !aliasData.is_active;
    await db.query(
      'UPDATE aliases SET is_active = $1 WHERE alias = $2 AND user_id = $3',
      [newStatus, alias, req.userId]
    );
    
    logger.info('Alias status toggled', { 
      userId: req.userId, 
      alias: alias,
      newStatus
    });
    
    res.json({
      success: true,
      alias: alias,
      is_active: newStatus,
      message: `Alias ${newStatus ? 'enabled' : 'disabled'} successfully`
    });
    
  } catch (error) {
    logger.error('Toggle alias error:', error);
    res.status(500).json({ error: 'Failed to toggle alias' });
  }
});

module.exports = router;