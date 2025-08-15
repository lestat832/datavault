# Changelog

All notable changes to DataVault will be documented in this file.

## [0.4.0] - 2025-08-15

### 🔗 Database Integration & Railway IPv6 Troubleshooting

#### Added
- Complete database integration for email forwarding
- Real-time alias lookups from Supabase database
- Email activity logging and usage statistics
- Database connection testing and diagnostics
- IPv4 compatibility layer for Railway deployment

#### Fixed
- Re-enabled database module in server.js (was disabled for testing)
- Fixed duplicate variable declaration causing deployment crashes
- Added comprehensive database error handling
- Implemented IPv4-only connection strategy for Railway/Supabase compatibility

#### Database Features
- User and alias management with PostgreSQL/Supabase
- Email forwarding now uses real database lookups instead of hardcoded addresses
- Proper 404/403 responses for non-existent or disabled aliases
- Email activity tracking with sender, subject, and delivery status

#### Current Status
- ✅ Email forwarding infrastructure complete
- ✅ Database schema and test data created
- 🔄 **IN PROGRESS**: Resolving Railway IPv6 connectivity to Supabase
- 📧 Test aliases available: test1234@, demo5678@, mail9012@, hello123@, info4567@datavlt.io

#### Known Issues
- Railway platform has IPv6 connectivity issues with Supabase
- Implemented workaround switching from pooler (port 6543) to direct connection (port 5432)
- Database connection testing shows ENETUNREACH errors on IPv6 addresses

## [0.3.1] - 2025-01-12

### ✨ Email Content Parsing & Complete System Verification

#### Added
- Mailparser library for proper MIME email parsing
- Clean email content extraction from raw email data
- Attachment handling support in email forwarding

#### Fixed
- Email content now displays properly formatted text instead of raw headers
- Original email subjects preserved in forwarded emails
- HTML and plain text content correctly extracted

#### Verified Working
- **End-to-end email forwarding fully operational and tested**
- Emails to any alias @datavlt.io are successfully:
  - Received by Cloudflare Email Routing
  - Processed by Cloudflare Worker
  - Forwarded to Railway webhook
  - Parsed for clean content display
  - Delivered via Gmail SMTP with proper formatting
- Reply-To headers correctly set to original sender

## [0.3.0] - 2025-01-12

### 📧 Email Forwarding Infrastructure Complete

#### Added
- Complete Cloudflare Email Routing setup for datavlt.io domain
- Cloudflare Worker for email processing and forwarding to Railway webhook
- Email webhook endpoint with comprehensive error handling and logging
- SMTP test endpoint for Gmail authentication verification
- Database isolation capabilities for testing pure email forwarding
- Test alias creation scripts and database diagnostics

#### Fixed
- Gmail SMTP authentication configured with correct service account
- IPv6 connectivity issues between Railway and Supabase resolved
- Email bouncing issues fixed with proper catch-all routing
- Database reference errors in error handlers
- Variable scope issues in server.js for production deployment

#### Changed
- Updated hardcoded test email to datavault.service@gmail.com
- Enhanced email forwarding with detailed logging at every step
- Implemented database bypass mode for isolated email testing
- Improved error handling with comprehensive stack traces

#### Email Flow Working
1. Email sent to *@datavlt.io → Cloudflare Email Routing
2. Cloudflare Worker processes email → Posts to Railway webhook
3. Railway backend receives email → Forwards via Gmail SMTP
4. Email delivered to target address with proper headers

#### Technical Achievements
- End-to-end email forwarding chain operational
- Proper error handling and logging throughout pipeline
- Database isolation allows testing without data dependencies
- Gmail SMTP authentication working with App Passwords

## [0.2.0] - 2025-01-11

### 🚀 Backend Deployment & Infrastructure

#### Added
- Successfully deployed backend API to Railway platform
- Database connection established with Supabase PostgreSQL
- Comprehensive crash diagnostics and error handling in server.js
- Health check endpoint at `/health`
- Database test endpoint at `/test-db`
- Railway public URL: `https://datavault-production.up.railway.app`

#### Fixed
- Fixed nodemailer typo (createTransporter → createTransport)
- Fixed Express router import issue in auth routes
- Fixed JavaScript variable scope issue causing "express is not defined" error
- Fixed DATABASE_URL environment variable configuration in Railway

#### Changed
- Enhanced server startup logging with detailed diagnostic information
- Improved error handling with fallback logger system
- Updated database connection with better error reporting

#### In Progress
- Chrome extension update to use backend API instead of subaddresses
- User authentication flow implementation

## [0.1.0] - 2025-01-10

### 🏗️ Architecture Pivot to Custom Domain

#### Added
- Backend API with Express.js and PostgreSQL
- JWT authentication system
- Email forwarding webhook endpoint for Cloudflare
- 8-character alphanumeric alias format (e.g., a7b3x9k2@datavlt.io)
- Comprehensive database schema with users, aliases, and email_logs tables
- CLAUDE.md documentation with architectural decisions
- Gmail SMTP configuration with App Passwords

#### Technical Stack
- Node.js/Express backend
- PostgreSQL database (Supabase)
- Nodemailer for email forwarding
- Railway deployment platform
- Cloudflare Email Routing (planned)

## [1.0.0] - 2025-07-18

### 🎉 Initial Release

#### Core Features
- **Email Alias Generation**: Automatically generate unique email aliases for any website
- **Smart Detection**: Detects email input fields on any webpage
- **Auto-fill**: Remembers and auto-fills aliases when you return to a site
- **Secure Storage**: All data stored locally in your browser
- **One-click Generation**: Simple @ button appears next to email fields

#### User Interface
- **Popup Dashboard**: Quick access to current site's alias and statistics
- **Settings Page**: Comprehensive alias management interface
- **Visual Feedback**: Success indicators and tooltips for better UX
- **Professional Icons**: Vault-themed design with @ symbol

#### Management Features
- **Target Email Configuration**: Set your primary email for alias forwarding
- **Alias List**: View all created aliases with creation dates
- **Export Functionality**: Export all aliases as CSV for backup
- **Delete Options**: Remove individual aliases as needed

#### Compatibility Features
- **Multiple Alias Formats**: 
  - Standard format with + symbol (default)
  - Dots format for compatibility
  - Clean format with no special characters
- **Format Cycling**: "Try Different Format" button for sites that reject certain formats
- **Compatibility Mode**: Toggle to automatically use compatible formats
- **Site Memory**: Remembers which format works for each domain
- **Format Selection**: Choose default format in settings

#### Technical Details
- Built with Manifest V3 for Chrome
- Uses Chrome Storage API for data persistence
- Content script injection for seamless integration
- Service worker for background processing
- No external dependencies or servers

### Known Limitations
- Email forwarding relies on provider support for + addressing
- Requires manual icon installation on first setup
- Chrome/Chromium browsers only (for now)