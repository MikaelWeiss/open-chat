# Open Chat - Implementation Plan

## Overview
A minimal, modern Electron-based chat application that supports multiple LLM providers (including local LLMs), with a clean interface inspired by Claude Code's design.

## Core Features

### 1. User Interface
- **Design System**
  - Minimal, modern aesthetic with light/dark themes
  - Color scheme: Primarily black and white with subtle blue accents
  - Claude Code-inspired interface
  
- **Layout**
  - Collapsible sidebar (slides in/out, pushing main chat interface)
  - Main chat view
  - Settings modal/sheet

### 2. Sidebar
- Lists conversations grouped by day
- Shows conversation titles (auto-generated)
- Slide animation when toggling
- Context menu for delete/rename operations
- Search functionality for conversations

### 3. Chat Interface
- Message input with markdown support
- Real-time streaming responses
- Code syntax highlighting
- Image/audio file attachments (when provider supports)
- Message actions (copy, regenerate)
- Typing indicators during streaming

### 4. Settings
- **Provider Configuration**
  - LLM provider selection (OpenAI, Anthropic, custom endpoints)
  - API key and endpoint URL inputs
  - Local LLM configuration with bash script support
  - Default provider selection
  
- **MCP Configuration**
  - Manual server addition
  - Pre-configured server list
  - Server enable/disable toggles
  
- **General Settings**
  - Theme selection (light/dark/system)
  - Keyboard shortcut customization
  - Export/import conversations
  - Data storage location

### 5. LLM Provider Support
- **Universal Features**
  - Streaming responses
  - Context management
  - Error handling and retry logic
  
- **Provider-Specific Features**
  - OpenAI: GPT models, function calling
  - Anthropic: Claude models, computer use
  - Local LLMs: Auto-start via bash scripts
  - Custom endpoints: Flexible configuration

### 6. Tool Support
By "tools" I mean LLM function calling capabilities:
- Web search integration
- File system access (with user permission)
- Code execution (sandboxed)
- Calculator
- Image generation (if provider supports)
- Custom tool definitions

### 7. MCP (Model Context Protocol) Support
- Server discovery and management
- Tool integration from MCP servers
- Resource access from MCP servers
- Default server suggestions

### 8. Data Storage
```
userData/
├── conversations/
│   ├── images/
│   │   └── [conversation-id]/
│   │       └── [image-files]
│   ├── audio/
│   │   └── [conversation-id]/
│   │       └── [audio-files]
│   └── chats/
│       ├── conversation-1.json
│       ├── conversation-2.json
│       └── ...
├── settings.json
└── mcp-servers.json
```

### 9. Keyboard Shortcuts
- `Enter`: Send message (configurable)
- `Shift+Enter`: New line (configurable)
- `Cmd/Ctrl+N`: New conversation
- `Cmd/Ctrl+L`: Focus input field
- `Cmd/Ctrl+K`: Quick conversation search
- `Cmd/Ctrl+,`: Open settings

## Technical Architecture

### 1. Technology Stack
- **Framework**: Electron
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Markdown**: react-markdown + remark plugins
- **Code Highlighting**: Prism.js or Shiki
- **Icons**: Lucide React
- **Build Tool**: esbuild

### 2. Main Process (main.js)
- Window management
- IPC communication handlers
- File system operations
- Local LLM process management
- Auto-updater integration

### 3. Renderer Process Architecture
```
src/
├── components/
│   ├── Sidebar/
│   ├── Chat/
│   ├── Settings/
│   └── common/
├── hooks/
├── services/
│   ├── llm/
│   │   ├── providers/
│   │   └── streaming.ts
│   ├── storage/
│   ├── mcp/
│   └── tools/
├── stores/
├── types/
└── utils/
```

### 4. Key Services

**LLM Service**
- Provider abstraction layer
- Streaming response handling
- Request queuing and rate limiting
- Error handling and retries

**Storage Service**
- Conversation CRUD operations
- File attachment management
- Settings persistence
- Export/import functionality

**MCP Service**
- Server connection management
- Tool and resource discovery
- Protocol implementation

**Tool Service**
- Tool registration and execution
- Permission management
- Result formatting

### 5. Security Considerations
- Secure storage of API keys (using Electron safeStorage)
- CSP headers for web content
- Sandboxed tool execution
- Input sanitization
- File access permissions

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Electron + React + TypeScript project
- [ ] Implement basic UI layout with sidebar and chat area
- [ ] Add theme support (light/dark)
- [ ] Create settings modal structure
- [ ] Implement local storage service

### Phase 2: Core Chat Features (Week 2)
- [ ] Implement message input and display
- [ ] Add markdown rendering
- [ ] Add code syntax highlighting
- [ ] Implement conversation management (create, delete, rename)
- [ ] Add keyboard shortcuts

### Phase 3: LLM Integration (Week 3)
- [ ] Create LLM provider abstraction
- [ ] Implement OpenAI provider
- [ ] Implement Anthropic provider
- [ ] Add streaming support
- [ ] Implement local LLM support with bash scripts

### Phase 4: Advanced Features (Week 4)
- [ ] Add image/audio attachment support
- [ ] Implement tool system
- [ ] Add web search tool
- [ ] Implement MCP support
- [ ] Add export/import functionality

### Phase 5: Polish & Testing (Week 5)
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Build and packaging setup

## Conversation JSON Structure
```json
{
  "id": "unique-conversation-id",
  "title": "Auto-generated title",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "provider": "openai",
  "model": "gpt-4",
  "messages": [
    {
      "id": "message-id",
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-01-01T00:00:00Z",
      "attachments": [
        {
          "type": "image",
          "path": "images/conversation-id/image1.png",
          "mimeType": "image/png"
        }
      ]
    },
    {
      "id": "message-id-2",
      "role": "assistant",
      "content": "Hi there!",
      "timestamp": "2024-01-01T00:00:01Z",
      "toolCalls": []
    }
  ],
  "metadata": {
    "totalTokens": 150,
    "temperature": 0.7
  }
}
```

## Settings JSON Structure
```json
{
  "theme": "system",
  "defaultProvider": "openai",
  "providers": {
    "openai": {
      "apiKey": "encrypted-key",
      "endpoint": "https://api.openai.com/v1",
      "models": ["gpt-4", "gpt-3.5-turbo"]
    },
    "local": {
      "endpoint": "http://localhost:8080",
      "startCommand": "ollama serve",
      "models": ["llama2", "mistral"]
    }
  },
  "keyboard": {
    "sendMessage": "enter",
    "newLine": "shift+enter"
  },
  "dataPath": "~/Library/Application Support/OpenChat"
}
```

## UI/UX Guidelines
- Clean, uncluttered interface
- Smooth animations (sidebar slide, message appear)
- Clear visual feedback for all actions
- Accessibility considerations (keyboard navigation, screen readers)
- Responsive to window resizing
- Native OS integration (menus, notifications)