# Module Map / Bounded Contexts

## Service Modules

| Module | Purpose | Language | Owner | On-Call | API Spec |
|--------|---------|----------|-------|---------|----------|
| **Main Process** | Window management, IPC coordination | JavaScript | Core Team | @core-devs | [IPC API](./api/ipc-reference.md) |
| **Conversation Manager** | Chat conversation CRUD operations | JavaScript | Core Team | @core-devs | [Service API](./api/conversation-service.md) |
| **Settings Manager** | Application configuration management | JavaScript | Core Team | @core-devs | [Settings API](./api/settings-service.md) |
| **LLM Manager** | AI provider integration and streaming | JavaScript | Core Team | @core-devs | [LLM API](./api/llm-service.md) |
| **React Frontend** | User interface and interactions | TypeScript/React | Frontend Team | @frontend-devs | [Component API](./api/component-reference.md) |

## Frontend Components

| Component | Purpose | Dependencies | Location |
|-----------|---------|--------------|----------|
| **App.tsx** | Main application container | React, Zustand | `src/App.tsx` |
| **QuickChatApp.tsx** | Quick chat overlay interface | React, Zustand | `src/QuickChatApp.tsx` |
| **ChatView** | Primary chat interface | MessageList, MessageInput | `src/components/Chat/` |
| **Sidebar** | Conversation navigation | ConversationStore | `src/components/Sidebar/` |
| **Settings** | Configuration interface | SettingsStore | `src/components/Settings/` |

## Dependency Matrix

```
┌─────────────────┐    calls    ┌─────────────────┐
│  React Frontend │ ──────────→ │  Electron Main  │
└─────────────────┘             └─────────────────┘
                                         │
                                         │ uses
                                         ▼
                                ┌─────────────────┐
                                │ Service Managers│
                                └─────────────────┘
                                         │
                                         │ calls
                                         ▼
                                ┌─────────────────┐
                                │ External APIs   │
                                │ Local Storage   │
                                └─────────────────┘
```

## Internal Dependencies

### Main Process Dependencies
- **Conversation Manager** ← Settings Manager (for provider configs)
- **LLM Manager** ← Settings Manager (for API keys)
- **All Managers** ← Main Process (for IPC coordination)

### Frontend Dependencies
- **All Components** ← Zustand Stores (for state management)
- **Chat Components** ← LLM Services (via IPC)
- **Settings Components** ← Settings Services (via IPC)

## Package Structure

```
src/
├── main/                    # Electron main process
│   ├── main.js             # Entry point, window management
│   ├── preload.js          # Secure IPC bridge
│   └── services/           # Business logic layer
│       ├── conversationManager.js
│       ├── settingsManager.js
│       ├── llmManager.js
│       ├── pricingManager.js
│       ├── tokenCounter.js
│       └── modelCapabilityDetector.js
├── components/             # React UI components
│   ├── Chat/              # Chat-related components
│   ├── Settings/          # Configuration components
│   ├── Sidebar/           # Navigation components
│   ├── Shortcuts/         # Keyboard shortcut components
│   └── Toast/             # Notification components
├── stores/                # Zustand state management
│   ├── conversationStore.ts
│   └── settingsStore.ts
├── hooks/                 # Custom React hooks
│   └── useUsageStats.ts
├── types/                 # TypeScript definitions
│   └── electron.d.ts
└── utils/                 # Utility functions
    └── dummyData.ts
```

## Module Responsibilities

### Core Services
- **ConversationManager**: CRUD operations for chat conversations, message handling
- **SettingsManager**: Configuration persistence, corruption recovery, provider management
- **LLMManager**: AI provider communication, streaming, token counting, pricing

### UI Layer
- **React Components**: User interface, event handling, local state
- **Zustand Stores**: Global application state, persistence
- **Custom Hooks**: Reusable stateful logic

### Integration Layer
- **IPC Handlers**: Secure communication between renderer and main processes
- **Preload Scripts**: Controlled API exposure to frontend

---
*Last updated from source at commit [latest] – edit this file: docs/module-map.md*