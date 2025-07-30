# DataVault Backend API

The backend API for DataVault email forwarding service.

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set up Database
Create a PostgreSQL database and run the schema:
```bash
psql -d your_database -f ../database/schema.sql
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Development Server
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Aliases
- `POST /api/aliases` - Create new alias
- `GET /api/aliases` - Get user's aliases
- `GET /api/aliases/:alias` - Get specific alias
- `DELETE /api/aliases/:alias` - Delete alias
- `PATCH /api/aliases/:alias/toggle` - Enable/disable alias

### Email Webhooks
- `POST /webhook/email` - Cloudflare email webhook
- `POST /webhook/test` - Test email forwarding (dev only)

## Database Setup Options

### Option 1: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb datavault`
3. Run schema: `psql -d datavault -f ../database/schema.sql`

### Option 2: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor and paste schema.sql content
4. Copy connection string to .env

### Option 3: Railway
1. Go to [railway.app](https://railway.app)
2. Deploy PostgreSQL service
3. Connect to database and run schema
4. Copy connection string to .env

## Email Configuration

### Development (Gmail)
1. Enable 2FA on your Gmail account
2. Generate App Password
3. Add to .env:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

### Production (SMTP)
Configure with your email provider:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## Cloudflare Email Routing Setup

1. Add datavlt.io to Cloudflare
2. Go to Email > Email Routing
3. Enable Email Routing
4. Add catch-all route:
   - Pattern: `*@datavlt.io`
   - Action: Send to worker
   - Worker: Point to `https://your-api.com/webhook/email`

## Testing

### Test Email Forwarding
```bash
curl -X POST http://localhost:3000/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"alias": "test1234", "testEmail": "your-email@gmail.com"}'
```

### Test API
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Create alias
curl -X POST http://localhost:3000/api/aliases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment

### Quick Deploy (Railway)
1. Connect GitHub repo to Railway
2. Add environment variables
3. Deploy automatically

### Manual Deploy
1. Set NODE_ENV=production
2. Configure production database
3. Set up proper SMTP credentials
4. Use PM2 or similar for process management

## Security Notes

- Change JWT_SECRET in production
- Use HTTPS only in production
- Set up proper CORS origins
- Enable rate limiting
- Monitor logs for suspicious activity