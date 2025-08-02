# Main Process Entry Point

## Overview
The Electron main process entry point that manages application lifecycle, windows, and IPC communication.

## Entry Point Details
- **Binary**: `electron .`
- **Main file**: `src/main/main.js`
- **Process type**: Electron main process
- **Starts listening**: Window creation and IPC handlers
- **Platform**: Cross-platform (macOS, Windows, Linux)

## Key Environment Variables
| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | No |

## Startup Sequence
1. **App Ready**: Waits for Electron app ready event
2. **Window Creation**: Creates main application window
3. **Service Initialization**: Initializes conversation, settings, and LLM managers
4. **IPC Registration**: Registers all IPC handlers
5. **Global Shortcuts**: Sets up keyboard shortcuts from settings

## Windows Created
- **Main Window**: Primary chat interface (1200x800px)
- **Quick Chat Window**: Overlay quick chat (445x545px, positioned bottom-right)

## IPC Handlers Registered
- `conversations:*` - Conversation management
- `settings:*` - Settings operations
- `llm:*` - AI provider communication
- `files:*` - File selection and handling
- `app:*` - Application-level operations
- `shell:*` - External URL handling

## Global Shortcuts
- Configurable global hotkey for quick chat toggle
- Default: No shortcut (user configurable)

## Security Configuration
- **Context Isolation**: Enabled
- **Node Integration**: Disabled in renderer
- **Sandbox**: Enabled
- **Preload Script**: `src/main/preload.js`

## Key Dependencies
- `electron` - Desktop app framework
- `path` - File path utilities
- `fs.promises` - Async file operations
- Service managers (conversation, settings, LLM)

## Debugging
```bash
# Debug main process
NODE_ENV=development electron --inspect=9229 .
```
Then connect Chrome DevTools to `chrome://inspect`

## Common Issues
- **Port conflicts**: Main process inspector uses port 9229
- **Global shortcut conflicts**: Check for duplicate shortcuts with other apps
- **Window positioning**: Quick chat window positioning on multi-monitor setups

---
*Last updated from source at commit [latest] – edit this file: docs/entry-points/main-process.md*