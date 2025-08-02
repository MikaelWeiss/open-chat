# React Frontend Entry Points

## Main Application (App.tsx)

### Overview
Primary React application for the main chat window interface.

### Entry Point Details
- **Main file**: `src/App.tsx`
- **Entry script**: `src/main.tsx`
- **Build target**: `dist/index.html`
- **Process type**: Electron renderer process
- **Technology**: React 18, TypeScript, Tailwind CSS

### Key Environment Variables
| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | No |

### Key Features
- Full conversation management interface
- Settings configuration
- File upload capabilities
- Multi-provider LLM support
- Global keyboard shortcuts
- Usage statistics tracking

### Dependencies
- React 18.3.1
- Zustand (state management)
- Tailwind CSS (styling)
- Lucide React (icons)
- React Markdown (message rendering)

## Quick Chat Application (QuickChatApp.tsx)

### Overview
Lightweight React application for the quick chat overlay window.

### Entry Point Details
- **Main file**: `src/QuickChatApp.tsx`
- **Entry script**: `src/quick-chat.tsx`
- **Build target**: `dist/quick-chat.html`
- **Process type**: Electron renderer process
- **Window**: Overlay, always-on-top, resizable

### Key Features
- Simplified chat interface
- Quick AI interactions
- Minimal UI for focused conversations
- Global shortcut activation

### Dependencies
- Same as main app but with reduced feature set
- Shared components and stores

## Build Process

### Development
```bash
# Start with hot reload
pnpm dev

# Build only
pnpm dev:build
```

### Production
```bash
# Build for production
pnpm build
```

### Build Configuration
- **Bundler**: Custom esbuild configuration (`build.js`)
- **CSS**: Tailwind CSS with PostCSS
- **TypeScript**: Strict mode enabled
- **Output**: `dist/` directory

## State Management

### Zustand Stores
- **ConversationStore**: Chat conversations and messages
- **SettingsStore**: Application configuration and preferences

### Key Store Actions
```typescript
// Conversation actions
useConversationStore.getState().addConversation()
useConversationStore.getState().deleteConversation()
useConversationStore.getState().addMessage()

// Settings actions
useSettingsStore.getState().updateSettings()
useSettingsStore.getState().resetSettings()
```

## Component Architecture

### Main Components
- **ChatView**: Primary chat interface
- **Sidebar**: Conversation navigation
- **Settings**: Configuration modal
- **MessageInput**: Message composition
- **MessageList**: Chat message display

### Shared Components
- **Toast**: Notifications
- **ShortcutsModal**: Keyboard shortcut help
- **UsageDisplay**: Token and cost tracking

## IPC Communication

### Frontend → Main Process
```typescript
// Send message to LLM
window.electronAPI.llm.sendMessage({
  conversationId,
  provider,
  model,
  messages,
  stream: true
})

// Settings operations
window.electronAPI.settings.get()
window.electronAPI.settings.update(newSettings)

// File operations
window.electronAPI.files.selectFile()
```

### Main Process → Frontend
```typescript
// Stream responses
window.electronAPI.on('llm:streamChunk', (data) => {
  // Handle streaming chunk
})

// Conversation updates
window.electronAPI.on('conversation:updated', (data) => {
  // Sync conversation state
})
```

## Debugging

### React DevTools
1. Install React Developer Tools browser extension
2. Start in development mode: `pnpm dev`
3. Open DevTools in Electron window
4. Switch to React tab

### Redux DevTools (Zustand)
```bash
# Install Redux DevTools extension
# Zustand store will be visible in Redux tab
```

---
*Last updated from source at commit [latest] – edit this file: docs/entry-points/react-frontend.md*