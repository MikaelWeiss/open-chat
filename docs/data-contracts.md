# Data & Event Contracts

## API Schema

### IPC Communication Protocol
All frontend-backend communication uses Electron's IPC (Inter-Process Communication) with typed interfaces defined in `src/types/electron.d.ts`.

## Core Domain Objects

### 1. Conversation
```json
{
  "id": "string (UUID)",
  "title": "string",
  "provider": "anthropic | openai | groq | other",
  "model": "string",
  "messages": [
    {
      "id": "string (UUID)",
      "role": "user | assistant | system",
      "content": "string",
      "timestamp": "number (Unix timestamp)",
      "attachments": [
        {
          "type": "image | audio | file",
          "data": "string (base64)",
          "mimeType": "string",
          "name": "string (optional)"
        }
      ]
    }
  ],
  "createdAt": "number (Unix timestamp)",
  "updatedAt": "number (Unix timestamp)"
}
```

### 2. Settings
```json
{
  "providers": {
    "anthropic": {
      "apiKey": "string",
      "models": ["claude-3-sonnet", "claude-3-haiku"],
      "enabled": true
    },
    "openai": {
      "apiKey": "string", 
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "enabled": false
    }
  },
  "ui": {
    "theme": "light | dark | system",
    "fontSize": "small | medium | large",
    "sidebarWidth": "number"
  },
  "keyboard": {
    "globalHotkey": "string (accelerator)",
    "shortcuts": {
      "newConversation": "string",
      "toggleSidebar": "string"
    }
  },
  "usage": {
    "trackTokens": "boolean",
    "trackCosts": "boolean",
    "resetInterval": "daily | weekly | monthly | never"
  }
}
```

### 3. Usage Statistics
```json
{
  "totalTokens": "number",
  "totalCost": "number (USD)",
  "conversationCount": "number",
  "messageCount": "number",
  "byProvider": {
    "anthropic": {
      "tokens": "number",
      "cost": "number",
      "messages": "number"
    }
  },
  "period": {
    "start": "number (Unix timestamp)",
    "end": "number (Unix timestamp)"
  }
}
```

### 4. Model Capabilities
```json
{
  "id": "string",
  "name": "string", 
  "provider": "string",
  "capabilities": {
    "vision": "boolean",
    "audio": "boolean", 
    "files": "boolean",
    "streaming": "boolean"
  },
  "pricing": {
    "inputTokens": "number (per 1K tokens)",
    "outputTokens": "number (per 1K tokens)",
    "currency": "USD"
  },
  "contextWindow": "number",
  "maxOutputTokens": "number"
}
```

### 5. File Attachment
```json
{
  "type": "image | audio | file",
  "data": "string (base64 encoded)",
  "mimeType": "string (MIME type)",
  "name": "string (filename)",
  "size": "number (bytes)",
  "path": "string (original file path)"
}
```

## Event-Driven Communication

### IPC Events

| Event | Producer | Consumer(s) | Payload |
|-------|----------|-------------|---------|
| `conversation:updated` | Main Process | All Renderer Processes | `{ action: 'created'|'deleted'|'renamed'|'message_added', conversationId: string }` |
| `llm:streamStart` | Main Process | Sender Renderer | `{ conversationId: string, streamId: string }` |
| `llm:streamChunk` | Main Process | Sender Renderer | `{ streamId: string, chunk: string }` |
| `llm:streamEnd` | Main Process | Sender Renderer | `{ streamId: string, totalTokens: number, cost: number }` |
| `llm:streamError` | Main Process | Sender Renderer | `{ streamId: string, error: string }` |
| `llm:streamCancelled` | Main Process | Sender Renderer | `{ conversationId: string }` |
| `app:triggerNewConversation` | Main Process | Main Window Renderer | `{}` |

### Stream Events Flow
```
Renderer Process          Main Process            LLM Provider
      │                        │                        │
      │ llm:sendMessage        │                        │
      ├───────────────────────→│                        │
      │                        │ HTTP Request           │
      │                        ├───────────────────────→│
      │ llm:streamStart        │                        │
      │←───────────────────────┤                        │
      │                        │ Stream Chunk           │
      │                        │←───────────────────────┤
      │ llm:streamChunk        │                        │
      │←───────────────────────┤                        │
      │ ... (multiple chunks)  │                        │
      │                        │ Stream Complete        │
      │                        │←───────────────────────┤
      │ llm:streamEnd          │                        │
      │←───────────────────────┤                        │
```

## Storage Format

### File Locations
- **macOS**: `~/Library/Application Support/open-chat/`
- **Windows**: `%APPDATA%/open-chat/`
- **Linux**: `~/.config/open-chat/`

### File Structure
```
open-chat/
├── conversations.json    # All conversation data
├── settings.json        # Application settings
└── usage-stats.json     # Usage tracking data
```

## Validation & Error Handling

### IPC Error Responses
```json
{
  "success": false,
  "error": {
    "code": "string (error code)",
    "message": "string (human readable)",
    "details": "any (additional context)"
  }
}
```

### Common Error Codes
- `INVALID_API_KEY` - Provider API key is invalid
- `MODEL_NOT_FOUND` - Requested model is not available
- `RATE_LIMITED` - Provider rate limit exceeded
- `NETWORK_ERROR` - Connection to provider failed
- `SETTINGS_CORRUPTED` - Settings file is malformed
- `CONVERSATION_NOT_FOUND` - Conversation ID doesn't exist

---
*Last updated from source at commit [latest] – edit this file: docs/data-contracts.md*