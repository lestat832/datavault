# Changelog

All notable changes to DataVault will be documented in this file.

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
- Cloudflare Email Routing setup for datavlt.io domain
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