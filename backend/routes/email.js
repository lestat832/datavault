const express = require('express');
const nodemailer = require('nodemailer');
const db = require('../utils/database');
const logger = require('../utils/logger');

const router = express.Router();

// Configure email transporter
const createTransporter = () => {
  if (process.env.SMTP_HOST) {
    // Custom SMTP (production)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Gmail for testing (development)
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
};

const transporter = createTransporter();

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email transporter configuration error:', error);
  } else {
    logger.info('Email transporter ready');
  }
});

// Cloudflare Email Routing webhook
router.post('/email', async (req, res) => {
  try {
    logger.info('Received email webhook', { body: req.body });
    
    // Extract email data from Cloudflare webhook
    const {
      to,
      from,
      subject,
      'content-plain': textContent,
      'content-html': htmlContent,
      attachments
    } = req.body;
    
    if (!to || !from) {
      logger.error('Missing required email fields', { to, from });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Extract alias from email address
    const aliasName = to.split('@')[0];
    
    // Look up alias in database
    const aliasData = await db.getAliasByName(aliasName);
    
    if (!aliasData) {
      logger.warn('Alias not found', { alias: aliasName, to, from });
      return res.status(404).json({ error: 'Alias not found' });
    }
    
    if (!aliasData.is_active) {
      logger.warn('Alias is disabled', { alias: aliasName, to, from });
      return res.status(403).json({ error: 'Alias disabled' });
    }
    
    // Forward email to user
    await forwardEmail({
      alias: aliasName,
      originalTo: to,
      targetEmail: aliasData.user_email,
      from,
      subject,
      textContent,
      htmlContent,
      attachments
    });
    
    // Update alias usage statistics
    await db.updateAliasUsage(aliasName);
    
    // Log successful forward
    await db.logEmail(aliasName, from, subject, aliasData.user_email, 'delivered');
    
    res.json({ success: true, message: 'Email forwarded successfully' });
    
  } catch (error) {
    logger.error('Email forwarding error:', error);
    
    // Log failed forward if we have enough info
    if (req.body.to && req.body.from) {
      const aliasName = req.body.to.split('@')[0];
      await db.logEmail(aliasName, req.body.from, req.body.subject || '', '', 'failed').catch(() => {});
    }
    
    res.status(500).json({ error: 'Email forwarding failed' });
  }
});

// Forward email function
async function forwardEmail({
  alias,
  originalTo,
  targetEmail,
  from,
  subject,
  textContent,
  htmlContent,
  attachments
}) {
  try {
    const mailOptions = {
      from: `DataVault <noreply@datavlt.io>`,
      to: targetEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      replyTo: from,
      headers: {
        'X-DataVault-Alias': alias,
        'X-DataVault-Original-To': originalTo,
        'X-Original-From': from
      }
    };
    
    // Handle attachments if present
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType
      }));
    }
    
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email forwarded successfully', { 
      alias, 
      targetEmail, 
      messageId: info.messageId 
    });
    
    return info;
    
  } catch (error) {
    logger.error('Failed to forward email', { 
      alias, 
      targetEmail, 
      error: error.message 
    });
    throw error;
  }
}

// Test endpoint for development
router.post('/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const { alias, testEmail } = req.body;
    
    await forwardEmail({
      alias: alias || 'test1234',
      originalTo: `${alias || 'test1234'}@datavlt.io`,
      targetEmail: testEmail || 'marc@marc.com',
      from: 'test@example.com',
      subject: 'DataVault Test Email',
      textContent: 'This is a test email from DataVault forwarding system.',
      htmlContent: '<p>This is a test email from DataVault forwarding system.</p>'
    });
    
    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    logger.error('Test email failed:', error);
    res.status(500).json({ error: 'Test email failed' });
  }
});

module.exports = router;