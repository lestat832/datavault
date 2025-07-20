# Changelog

All notable changes to DataVault will be documented in this file.

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