const express = require('express');
const nodemailer = require('nodemailer');
// const db = require('../utils/database'); // TEMPORARILY DISABLED for testing
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
    logger.info('Received email webhook', { 
      headers: req.headers,
      bodyKeys: Object.keys(req.body) 
    });
    
    // Handle both Cloudflare Worker format and direct format
    let to, from, subject, textContent, htmlContent, attachments;
    
    if (req.headers['x-cloudflare-email']) {
      // New Cloudflare Worker format
      const { to: toAddr, from: fromAddr, subject: subj, rawEmail, headers } = req.body;
      to = toAddr;
      from = fromAddr;
      subject = subj || headers?.subject || 'No Subject';
      
      // Parse raw email for content if needed
      if (rawEmail) {
        // For now, use rawEmail as text content
        // In production, you'd want to parse MIME properly
        textContent = `Email from ${from}\n\n${rawEmail.substring(0, 1000)}`;
        htmlContent = textContent.replace(/\n/g, '<br>');
      }
    } else {
      // Original format (for backward compatibility)
      to = req.body.to;
      from = req.body.from;
      subject = req.body.subject;
      textContent = req.body['content-plain'] || req.body.textContent;
      htmlContent = req.body['content-html'] || req.body.htmlContent;
      attachments = req.body.attachments;
    }
    
    if (!to || !from) {
      logger.error('Missing required email fields', { to, from });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Extract alias from email address (handle both string and array)
    const toAddress = Array.isArray(to) ? to[0] : to;
    const aliasName = toAddress.split('@')[0].toLowerCase();
    
    // TEMPORARY BYPASS: Skip ALL database operations and forward directly
    logger.info('TEMP BYPASS: Skipping all database operations and forwarding directly', { 
      aliasName, 
      from,
      subject: subject || 'No Subject'
    });
    
    try {
      // Forward email directly to hardcoded address
      await forwardEmail({
        alias: aliasName,
        originalTo: to,
        targetEmail: 'marc.geraldez@gmail.com', // HARDCODED for testing
        from,
        subject,
        textContent,
        htmlContent,
        attachments
      });
      
      logger.info('TEMP: Email forwarded successfully without database', { 
        aliasName,
        targetEmail: 'marc.geraldez@gmail.com' 
      });
      
    } catch (forwardError) {
      logger.error('TEMP: Email forwarding failed', { 
        error: forwardError.message,
        stack: forwardError.stack 
      });
      throw forwardError;
    }
    
    res.json({ success: true, message: 'Email forwarded successfully' });
    
  } catch (error) {
    logger.error('Email forwarding error:', error);
    
    // TEMP: Skip database logging for testing
    logger.info('TEMP: Skipping error logging due to database bypass');
    
    res.status(500).json({ error: 'Email forwarding failed' });
  }
});

// Forward email function with detailed logging
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
    logger.info('DETAILED: Starting forwardEmail function', {
      alias,
      originalTo,
      targetEmail,
      from,
      subject: subject || 'No Subject',
      hasTextContent: !!textContent,
      hasHtmlContent: !!htmlContent,
      hasAttachments: !!(attachments && attachments.length > 0)
    });

    // Check if transporter exists
    if (!transporter) {
      logger.error('DETAILED: Email transporter not initialized!');
      throw new Error('Email transporter not initialized');
    }

    logger.info('DETAILED: Transporter exists, creating mail options');

    const mailOptions = {
      from: `DataVault <noreply@datavlt.io>`,
      to: targetEmail,
      subject: subject || 'No Subject',
      text: textContent || `Email forwarded from ${from}`,
      html: htmlContent || `<p>Email forwarded from ${from}</p>`,
      replyTo: from,
      headers: {
        'X-DataVault-Alias': alias,
        'X-DataVault-Original-To': originalTo,
        'X-Original-From': from
      }
    };
    
    logger.info('DETAILED: Mail options created', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      replyTo: mailOptions.replyTo
    });

    // Handle attachments if present
    if (attachments && attachments.length > 0) {
      logger.info('DETAILED: Processing attachments', { count: attachments.length });
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType
      }));
    }
    
    logger.info('DETAILED: About to send email via transporter');
    const info = await transporter.sendMail(mailOptions);
    
    logger.info('DETAILED: Email sent successfully!', { 
      alias, 
      targetEmail, 
      messageId: info.messageId,
      response: info.response
    });
    
    return info;
    
  } catch (error) {
    logger.error('DETAILED: Failed to forward email', { 
      alias, 
      targetEmail, 
      error: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command
    });
    throw error;
  }
}

// SMTP test endpoint
router.get('/test-smtp', async (req, res) => {
  try {
    logger.info('Testing SMTP connection...');
    
    // Test transporter configuration
    if (!transporter) {
      return res.status(500).json({ error: 'Transporter not initialized' });
    }
    
    // Test basic connection
    logger.info('Verifying SMTP connection...');
    const verified = await transporter.verify();
    
    if (verified) {
      logger.info('SMTP connection successful!');
      res.json({ 
        success: true, 
        message: 'SMTP connection verified',
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('SMTP verification failed');
      res.status(500).json({ 
        success: false, 
        message: 'SMTP verification failed' 
      });
    }
    
  } catch (error) {
    logger.error('SMTP test failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code 
    });
  }
});

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