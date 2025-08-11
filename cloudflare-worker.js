/**
 * DataVault Email Forwarding Worker for Cloudflare
 * 
 * This worker receives emails sent to @datavlt.io addresses and forwards
 * them to the Railway backend webhook for processing.
 * 
 * Deploy this to Cloudflare Workers and connect it to Email Routing.
 */

export default {
  /**
   * Handle incoming email messages
   * @param {EmailMessage} message - The incoming email
   * @param {Object} env - Environment bindings
   * @param {ExecutionContext} ctx - Execution context
   */
  async email(message, env, ctx) {
    console.log(`Received email to: ${message.to}, from: ${message.from}`);
    
    try {
      // Extract the raw email content
      const rawEmail = await new Response(message.raw).text();
      
      // Build the email data object
      const emailData = {
        to: message.to,
        from: message.from,
        subject: message.headers.get('subject') || 'No Subject',
        headers: Object.fromEntries(message.headers),
        size: message.rawSize,
        rawEmail: rawEmail,
        timestamp: new Date().toISOString()
      };
      
      console.log(`Forwarding email from ${message.from} to webhook`);
      
      // Forward to Railway webhook
      const webhookUrl = 'https://datavault-production.up.railway.app/webhook/email';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cloudflare-Email': 'true',
          'X-Worker-Version': '1.0.0'
        },
        body: JSON.stringify(emailData)
      });
      
      const responseText = await response.text();
      console.log(`Webhook response: ${response.status} - ${responseText}`);
      
      if (!response.ok) {
        // Log error but don't reject the email immediately
        console.error(`Webhook failed with status ${response.status}: ${responseText}`);
        
        // For 404 (alias not found), we might want to reject the email
        if (response.status === 404) {
          await message.setReject(`Alias not found: ${message.to}`);
        } else {
          // For other errors, accept the email but log the issue
          // This prevents email bouncing due to temporary issues
          console.error('Email accepted despite webhook error');
        }
      } else {
        console.log('Email successfully forwarded');
      }
      
    } catch (error) {
      console.error('Error processing email:', error);
      // Don't reject on errors to avoid bouncing emails
      // In production, you might want to queue failed emails
    }
  },
  
  /**
   * Optional: Handle HTTP requests to the worker for testing
   * This allows you to check if the worker is deployed correctly
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        message: 'DataVault Email Worker is running',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/test' && request.method === 'POST') {
      // Test endpoint to simulate email webhook
      const body = await request.json();
      
      const webhookUrl = 'https://datavault-production.up.railway.app/webhook/email';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cloudflare-Email': 'true',
          'X-Worker-Version': '1.0.0'
        },
        body: JSON.stringify({
          to: body.to || 'test@datavlt.io',
          from: body.from || 'sender@example.com',
          subject: body.subject || 'Test Email',
          headers: { subject: body.subject || 'Test Email' },
          rawEmail: body.content || 'This is a test email',
          timestamp: new Date().toISOString()
        })
      });
      
      const result = await response.text();
      return new Response(JSON.stringify({
        webhookStatus: response.status,
        webhookResponse: result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('DataVault Email Worker - Use /health or /test endpoints', {
      status: 200
    });
  }
};