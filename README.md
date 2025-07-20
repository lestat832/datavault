# DataVault - Chrome Extension

A secure email alias manager that helps you protect your identity online by generating unique email aliases for every website, keeping your real email address private and your inbox organized.

## Features

- **Automatic Email Field Detection**: Detects email input fields on any website
- **One-Click Alias Generation**: Generate unique email aliases with a single click
- **Smart Auto-Fill**: Automatically fills in saved aliases when you return to a site
- **Alias Management**: View, copy, and delete all your aliases from the settings page
- **CSV Export**: Export all your aliases for backup or migration
- **Privacy-Focused**: All data stored locally in your browser

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this directory
4. The extension icon should appear in your toolbar

## Setup

1. After installation, you'll be prompted to enter your target email address
2. This is where all alias emails will forward to (using the + trick)
3. Example: If your email is `john@example.com`, aliases will be like `john+amazon-abc123@example.com`

## Usage

### Creating an Alias
1. Visit any website with a registration form
2. Look for the @ button that appears next to email fields
3. Click it to generate and insert a unique alias
4. Complete the registration as normal

### Managing Aliases
1. Click the extension icon to see the current site's alias
2. Click "Settings" to view all aliases
3. From settings, you can:
   - Copy any alias to clipboard
   - Delete aliases you no longer need
   - Export all aliases as CSV
   - Change your target email

## Important Notes

- **Email Forwarding**: This extension uses the "+" email trick. Make sure your email provider supports this (Gmail, Outlook, and most providers do)
- **No Password Storage**: The extension never stores passwords, only email aliases
- **Local Storage**: All data is stored locally in Chrome - nothing is sent to external servers

## Icon Requirements

You'll need to add icon files in these sizes:
- icon16.png (16x16 pixels)
- icon32.png (32x32 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

## Development

To modify the extension:
1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Privacy & Security

- All aliases are stored locally using Chrome's storage API
- No external servers or APIs are used
- Only minimal permissions required for functionality