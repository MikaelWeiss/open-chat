# High-Level Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Open Chat Application                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │Main Window  │  │Quick Chat   │  │ Electron Main   │  │
│  │(React UI)   │  │Window       │  │ Process         │  │
│  │             │  │(React UI)   │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│         │                 │                 │           │
│         └─────────────────┼─────────────────┘           │
│                           │                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              IPC Communication Layer               │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                Service Layer                       │  │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │  │
│  │ │Conversation │ │ Settings    │ │ LLM Manager     │ │  │
│  │ │ Manager     │ │ Manager     │ │                 │ │  │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              External Integrations                 │  │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │  │
│  │ │ Anthropic   │ │ OpenAI      │ │ Other LLM       │ │  │
│  │ │ API         │ │ API         │ │ Providers       │ │  │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Local Storage                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│ │Conversations│ │ Settings    │ │ User Data           │ │
│ │ (JSON)      │ │ (JSON)      │ │ (OS-specific)       │ │
│ └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Color-Coded Deployment Boundaries

- **🟦 Blue - Single Electron App**: Main Window, Quick Chat Window, Electron Main Process
- **🟨 Yellow - Service Layer**: Internal services within the Electron app
- **🟩 Green - External SaaS**: LLM Provider APIs (Anthropic, OpenAI, etc.)
- **🟪 Purple - Local Storage**: File system-based storage

## Key Components

### Frontend (Renderer Processes)
- **Main Window**: Full-featured chat interface with conversation management
- **Quick Chat Window**: Lightweight overlay window for quick interactions
- **Technology**: React 18, TypeScript, Tailwind CSS, Zustand for state management

### Backend (Main Process)
- **Electron Main Process**: Window management, IPC coordination, system integration
- **Service Layer**: Business logic managers for conversations, settings, and LLM operations
- **Technology**: Node.js, Electron APIs

### External Integrations
- **LLM Providers**: HTTP/HTTPS APIs for AI model interactions
- **File System**: Local storage for conversations and settings

## Data Flow

1. **User Interaction** → Frontend UI (React components)
2. **Frontend** → IPC calls to main process
3. **Main Process** → Service layer methods
4. **Services** → External APIs or local storage
5. **Response** flows back through the same path
6. **Streaming**: Direct event-based communication for real-time responses

## Security Boundaries

- **Context Isolation**: Enabled for all renderer processes
- **Node Integration**: Disabled in renderer processes
- **Sandbox**: Enabled for enhanced security
- **Preload Scripts**: Controlled API exposure to renderer processes

---
*Last updated from source at commit [latest] – edit this file: docs/architecture/overview.md*