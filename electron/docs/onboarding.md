# Open Chat - Onboarding

## What is Open Chat?
Open Chat is a modern, feature-rich chat application for AI providers (Anthropic, OpenAI, etc.) that provides essential features missing from standard web interfaces - built with Electron and React.

## Quick Demo
*[Note: 60-second GIF/terminal cast showing the happy-path local run would go here]*

## Getting Started (Copy-Paste Ready)

### Prerequisites
- Node.js 18 or higher
- npm (recommended) or npm

### One-Line Setup
```bash
git clone https://github.com/yourusername/open-chat.git && cd open-chat && npm install && npm rebuild electron && npm start
```

### Step-by-Step Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/open-chat.git
cd open-chat

# Install dependencies
npm install

# Rebuild Electron (if needed)
npm rebuild electron

# Start the application
npm start
```

### Development Commands
```bash
# Development mode with hot reload
npm dev

# Build for production
npm build

# Package the app
npm build:app

# Quick start (assumes already built)
npm start:quick
```

### Opening the Debugger
1. Start in development mode: `npm dev`
2. Open DevTools:
   - **Main Window**: `Cmd+Option+I` (macOS) or `Ctrl+Shift+I` (Windows/Linux)
   - **Quick Chat Window**: Same shortcuts when focused
3. For Electron main process debugging:
   ```bash
   NODE_ENV=development electron --inspect=9229 .
   ```
   Then open `chrome://inspect` in Chrome and connect to the remote target.

### Testing
```bash
# Run tests (when available)
npm test

# Run linting
npm run lint
```

## What Every Newcomer Touches in Their First Week
See: [Development Workflow](./development-workflow.md) and [Module Map](./module-map.md)

## Next Steps
- Review [High-Level Architecture](./architecture/overview.md)
- Check [Entry Points](./entry-points/) for runnable processes
- Browse [Code Examples](./examples/)

---
*Last updated from source at commit [latest] – edit this file: docs/onboarding.md*