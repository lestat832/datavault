# DataVault Email Forwarding Testing Checklist

## Prerequisites
- [x] Railway backend deployed
- [x] Database connected (Supabase)
- [x] Cloudflare Email Routing enabled
- [x] Email Worker deployed and connected
- [ ] Test data created in database

## Step 1: Create Test Data
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `/database/quick-test-setup.sql`
3. **IMPORTANT**: Replace `YOUR-EMAIL@gmail.com` with your actual email
4. Run the SQL script
5. Verify you see 5 aliases in the results

## Step 2: Test Worker Health
1. Find your Worker URL:
   - Go to Cloudflare → Workers & Pages → datavault-email-forwarder
   - Copy the URL (e.g., `https://datavault-email-forwarder.username.workers.dev`)
2. Test health endpoint:
   ```
   https://datavault-email-forwarder.username.workers.dev/health
   ```
3. You should see: `{"status":"healthy","message":"DataVault Email Worker is running"...}`

## Step 3: Send Test Emails
Send test emails to these addresses:
- [ ] `test1234@datavlt.io`
- [ ] `demo5678@datavlt.io`
- [ ] `hello123@datavlt.io`

For each email:
1. **Subject**: "Test [alias name]"
2. **Body**: "Testing DataVault forwarding for [alias]"

## Step 4: Monitor Logs

### Railway Logs
1. Go to Railway dashboard
2. Check deployment logs
3. Look for:
   - `Received email webhook`
   - `Email forwarded successfully`
   - Any error messages

### Cloudflare Worker Logs
1. Go to Cloudflare → Workers & Pages → datavault-email-forwarder → Logs
2. Look for:
   - `Received email to: [alias]@datavlt.io`
   - `Forwarding email from [sender] to webhook`
   - `Email successfully forwarded`

## Step 5: Verify Email Delivery
Check your inbox for:
- [ ] Email arrives from `DataVault <noreply@datavlt.io>`
- [ ] Original sender in Reply-To header
- [ ] Subject and content preserved
- [ ] Arrives within 1-2 minutes

## Step 6: Database Verification
Run this SQL in Supabase to check email logs:
```sql
SELECT 
  el.id,
  a.alias || '@datavlt.io' as alias_email,
  el.from_email,
  el.subject,
  el.received_at,
  el.forwarded_at,
  el.status
FROM email_logs el
JOIN aliases a ON el.alias_id = a.id
ORDER BY el.received_at DESC
LIMIT 10;
```

## Troubleshooting

### Email Not Arriving?
1. **Check DNS propagation** (can take up to 30 minutes)
   - Use https://mxtoolbox.com to verify MX records for datavlt.io
2. **Verify alias exists and is active**:
   ```sql
   SELECT * FROM aliases WHERE alias = 'test1234';
   ```
3. **Check Railway webhook is accessible**:
   ```bash
   curl https://datavault-production.up.railway.app/health
   ```

### Worker Not Receiving Emails?
1. Verify Email Worker route is active in Cloudflare
2. Check Worker is deployed and running
3. Ensure MX records point to Cloudflare

### Database Connection Issues?
1. Verify DATABASE_URL in Railway environment variables
2. Check Supabase is not paused (free tier pauses after inactivity)
3. Test database connection:
   ```
   https://datavault-production.up.railway.app/test-db
   ```

## Success Criteria
- [x] Email routing configured
- [x] Worker deployed and connected
- [ ] Test emails sent
- [ ] Emails forwarded to target inbox
- [ ] Database logs created
- [ ] No errors in logs

## Next Steps
Once email forwarding is verified:
1. Update Chrome extension to use backend API
2. Implement user authentication
3. Add reply handling
4. Set up monitoring and alerts