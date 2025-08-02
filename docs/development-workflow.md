# Development Workflow Cheat-Sheet

## Quick Development Setup

### Daily Development Commands
```bash
# Start development environment (most common)
pnpm dev

# Quick restart (after making changes to main process)
pnpm start:quick

# Fresh build and start
pnpm start

# Build only (no electron)
pnpm build
```

## Running Tests

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testNamePattern="ConversationManager"

# Run tests in watch mode
npm test -- --watch
```

### Integration Tests
```bash
# Test specific functionality
npm run test:integration

# Test LLM provider connections
npm run test:providers
```

### Manual Testing
```bash
# Test different providers
# 1. Set up API keys in settings
# 2. Create test conversations
# 3. Verify streaming responses
# 4. Test file attachments
```

## Local Development Environment

### Prerequisites Check
```bash
# Verify Node.js version (18+)
node --version

# Verify pnpm installation
pnpm --version

# Check Electron installation
npx electron --version
```

### Docker-free Local Environment
```bash
# Clone and setup
git clone <repo-url>
cd open-chat
pnpm install
pnpm rebuild electron

# Set up environment variables (optional)
cp .env.example .env.local
```

### Realistic Test Data
```bash
# Use built-in dummy data
# Located in: src/utils/dummyData.ts

# Generate test conversations
# Available via: Developer menu in app
```

## Debugging Setup

### VS Code Debug Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["--inspect=9229", "."],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["exec", "electron"]
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "*": "${workspaceFolder}/src/*"
      }
    }
  ]
}
```

### Chrome DevTools
```bash
# Start with debugging enabled
NODE_ENV=development electron --inspect=9229 .

# Open Chrome and navigate to:
chrome://inspect

# Connect to remote target
```

### React DevTools
1. Install React Developer Tools extension
2. Start app in development mode: `pnpm dev`
3. Open Electron DevTools (`Cmd+Option+I`)
4. Switch to "React" tab

## Hot Reload Development

### Frontend Hot Reload
```bash
# Automatic React hot reload
pnpm dev

# Manual restart if hot reload fails
# Ctrl+C to stop, then pnpm dev again
```

### Backend Changes
```bash
# Main process changes require restart
# 1. Stop current process (Ctrl+C)
# 2. Restart with: pnpm dev

# Service changes (JavaScript files in src/main/services/)
# Require full restart
```

## Database/Storage Development

### Local Storage Locations
```bash
# macOS
~/Library/Application Support/open-chat/

# Windows  
%APPDATA%/open-chat/

# Linux
~/.config/open-chat/
```

### Reset Local Data
```bash
# Clear all conversations and settings
rm -rf "~/Library/Application Support/open-chat"

# Or use in-app reset (Settings → Advanced → Reset All Data)
```

### Backup Development Data
```bash
# Backup current state
cp -r "~/Library/Application Support/open-chat" ./backup-data/

# Restore from backup
cp -r ./backup-data/* "~/Library/Application Support/open-chat/"
```

## Testing Different Providers

### Mock LLM Responses
```javascript
// In src/main/services/llmManager.js
// Enable mock mode for testing
const MOCK_MODE = process.env.NODE_ENV === 'development'
```

### Provider API Testing
```bash
# Test OpenAI connection
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.openai.com/v1/models

# Test Anthropic connection  
curl -H "x-api-key: YOUR_API_KEY" \
     https://api.anthropic.com/v1/messages
```

## Performance Monitoring

### Bundle Analysis
```bash
# Analyze bundle size
pnpm build
npx source-map-explorer dist/assets/*.js
```

### Memory Monitoring
```bash
# Start with memory profiling
electron --trace-warnings --max-old-space-size=4096 .
```

### Electron Performance
```bash
# Enable performance metrics
NODE_ENV=development electron --enable-logging .
```

## Common Development Issues

### Port Conflicts
```bash
# If port 3000 is in use
lsof -ti:3000 | xargs kill -9

# Use different port
PORT=3001 pnpm dev
```

### Node Module Issues
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm rebuild electron
```

### Build Cache Issues
```bash
# Clear build cache
rm -rf dist/
pnpm build
```

### Electron Binary Issues
```bash
# Rebuild Electron
pnpm rebuild electron

# Download fresh Electron
rm -rf node_modules/electron/
pnpm install electron
```

---
*Last updated from source at commit [latest] – edit this file: docs/development-workflow.md*