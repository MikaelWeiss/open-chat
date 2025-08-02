# Open Chat - Onboarding

## What is Open Chat?
Open Chat is a modern, feature-rich chat application for AI providers (Anthropic, OpenAI, etc.) that provides essential features missing from standard web interfaces - built with Electron and React.

## Quick Demo
*[Note: 60-second GIF/terminal cast showing the happy-path local run would go here]*

## Getting Started (Copy-Paste Ready)

### Prerequisites
- Node.js 18 or higher
- pnpm (recommended) or npm

### One-Line Setup
```bash
git clone https://github.com/yourusername/open-chat.git && cd open-chat && pnpm install && pnpm rebuild electron && pnpm start
```

### Step-by-Step Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/open-chat.git
cd open-chat

# Install dependencies
pnpm install

# Rebuild Electron (if needed)
pnpm rebuild electron

# Start the application
pnpm start
```

### Development Commands
```bash
# Development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Package the app
pnpm build:app

# Quick start (assumes already built)
pnpm start:quick
```

### Opening the Debugger
1. Start in development mode: `pnpm dev`
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