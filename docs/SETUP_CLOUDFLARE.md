# Setting Up Cloudflare Email Routing for DataVault

This guide walks you through setting up Cloudflare Email Routing to forward emails from @datavlt.io addresses to your Railway backend.

## Prerequisites
- Domain (datavlt.io) added to Cloudflare
- Railway backend deployed and running
- Cloudflare account with Workers enabled

## Step 1: Enable Email Routing

1. **Log into Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select your `datavlt.io` domain

2. **Enable Email Routing**
   - Navigate to **Email** → **Email Routing** in the left sidebar
   - Click **"Get started"** or **"Enable Email Routing"**
   - Cloudflare will add these MX records automatically:
     ```
     MX  datavlt.io  route1.mx.cloudflare.net  (Priority: 1)
     MX  datavlt.io  route2.mx.cloudflare.net  (Priority: 10)
     MX  datavlt.io  route3.mx.cloudflare.net  (Priority: 20)
     ```
   - Click **"Add records and enable"**
   - Wait 5-15 minutes for DNS propagation

## Step 2: Create the Worker

1. **Navigate to Workers**
   - In Cloudflare Dashboard, go to **"Workers & Pages"**
   - Click **"Create application"**
   - Select **"Create Worker"**
   - Name it: `datavault-email-forwarder`
   - Click **"Deploy"**

2. **Add the Worker Code**
   - Click **"Edit code"** on your new worker
   - Copy the entire contents of `/cloudflare-worker.js`
   - Paste it into the worker editor
   - Click **"Save and deploy"**

3. **Test the Worker (Optional)**
   - Visit: `https://datavault-email-forwarder.YOUR-SUBDOMAIN.workers.dev/health`
   - You should see a JSON response confirming the worker is running

## Step 3: Connect Email Routing to Worker

1. **Go back to Email Routing**
   - Return to your domain → **Email** → **Email Routing**
   - Click on the **"Email Workers"** tab

2. **Create Email Worker Route**
   - Click **"Create"**
   - Configure the route:
     - **Name**: DataVault Email Handler
     - **Custom email addresses**: Select **"Catch-all"** (this catches all @datavlt.io emails)
     - **Destination Worker**: Select `datavault-email-forwarder`
   - Click **"Save"**

## Step 4: Create a Test User and Alias

Before testing email forwarding, you need to create a test alias in your database.

### Option A: Using SQL directly in Supabase

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run these queries:

```sql
-- Create a test user (replace with your email)
INSERT INTO users (email, password_hash, email_verified)
VALUES ('your-email@gmail.com', 'temp_password_hash', true)
RETURNING id;

-- Note the user ID from above, then create an alias
-- Replace USER_ID with the actual ID from the previous query
INSERT INTO aliases (alias, user_id, is_active)
VALUES ('test1234', 'USER_ID', true);
```

### Option B: Using the API (if you have a way to get auth token)

```bash
# First register a user
curl -X POST https://datavault-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"your-password"}'

# Login to get token
curl -X POST https://datavault-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"your-password"}'

# Create alias (use token from login response)
curl -X POST https://datavault-production.up.railway.app/api/aliases \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.com"}'
```

## Step 5: Test Email Forwarding

1. **Send a Test Email**
   - Send an email to `test1234@datavlt.io` (or whatever alias you created)
   - Use any email client or service

2. **Monitor Railway Logs**
   - Go to your Railway dashboard
   - Check the deployment logs
   - You should see:
     ```
     Received email webhook
     Email forwarded successfully
     ```

3. **Check Your Inbox**
   - The email should arrive at the target email you configured
   - It will come from `DataVault <noreply@datavlt.io>`
   - The original sender will be in the Reply-To header

## Step 6: Troubleshooting

### Email Not Arriving?

1. **Check Worker Logs**
   - Go to Workers & Pages → your worker → "Logs"
   - Look for any error messages

2. **Check Railway Logs**
   - Ensure the webhook is being called
   - Look for database connection errors

3. **Verify DNS Records**
   - Go to DNS settings in Cloudflare
   - Ensure MX records are present and active

4. **Test Worker Directly**
   ```bash
   curl -X POST https://datavault-email-forwarder.YOUR-SUBDOMAIN.workers.dev/test \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test1234@datavlt.io",
       "from": "sender@example.com",
       "subject": "Direct Worker Test",
       "content": "Testing worker directly"
     }'
   ```

### Common Issues

1. **"Alias not found" error**
   - Ensure the alias exists in the database
   - Check that it's marked as `is_active = true`
   - Verify the user exists and has a valid email

2. **Worker not receiving emails**
   - Ensure Email Workers route is configured correctly
   - Check that it's set to "Catch-all"
   - Verify the worker is selected as destination

3. **Emails bouncing back**
   - Check that Email Routing is fully enabled
   - Ensure DNS records have propagated (wait 15+ minutes)
   - Verify no conflicting email rules exist

## Step 7: Production Considerations

1. **Rate Limiting**
   - Cloudflare Workers have limits (100,000 requests/day on free plan)
   - Consider upgrading for higher volume

2. **Error Handling**
   - The worker currently accepts emails even if webhook fails
   - Consider implementing a queue system for retries

3. **Security**
   - Add authentication to the webhook endpoint
   - Implement webhook signature verification
   - Rate limit by sender to prevent spam

4. **Monitoring**
   - Set up alerts for webhook failures
   - Monitor email delivery rates
   - Track alias usage statistics

## Next Steps

Once email forwarding is working:

1. Update Chrome extension to use the new backend API
2. Implement user authentication in the extension
3. Add reply handling for two-way communication
4. Set up monitoring and analytics

---

## Quick Reference

- **Railway Backend**: https://datavault-production.up.railway.app
- **Health Check**: https://datavault-production.up.railway.app/health
- **Worker Health**: https://datavault-email-forwarder.YOUR-SUBDOMAIN.workers.dev/health
- **Test Webhook**: POST to `/webhook/email`

## Support

If you encounter issues:
1. Check Railway logs for backend errors
2. Check Cloudflare Worker logs for forwarding issues
3. Verify all DNS records are correct
4. Ensure database has test data