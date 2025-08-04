# Glossary & Naming Guide

## Domain Terms

### Chat & Conversation Terms
| Term | Definition | Code Usage | Notes |
|------|------------|------------|-------|
| **Conversation** | A complete chat session with message history | `conversation` (never `chat` or `session`) | Preferred over "chat" for clarity |
| **Message** | Single exchange in a conversation (user or assistant) | `message` | Always lowercase |
| **Thread** | ❌ Not used | Use `conversation` instead | Avoid to prevent confusion |
| **Chat** | ❌ Avoid in code | Use `conversation` in code, "chat" in UI only | UI text can say "chat" |
| **Session** | ❌ Not used | Use `conversation` instead | Reserved for auth sessions |

### AI Provider Terms
| Term | Definition | Code Usage | Notes |
|------|------------|------------|-------|
| **Provider** | AI service company (Anthropic, OpenAI, etc.) | `provider` | Always lowercase in code |
| **Model** | Specific AI model (claude-3-sonnet, gpt-4, etc.) | `model` | Use full model name strings |
| **LLM** | Large Language Model | `llm` (in service names) | Used in `LLMManager` |
| **API** | Provider's REST API | `api` | Always lowercase |
| **Completion** | AI-generated response | `completion` | Response from AI provider |
| **Stream** | Real-time response delivery | `stream` | For streaming completions |

### Application Architecture Terms
| Term | Definition | Code Usage | Notes |
|------|------------|------------|-------|
| **Main Process** | Electron's Node.js process | `main` (in file paths) | Never "backend" |
| **Renderer Process** | Electron's Chrome process | `renderer` | Frontend/UI process |
| **IPC** | Inter-Process Communication | `ipc` | Between main and renderer |
| **Service** | Business logic class | `XxxManager` or `XxxService` | Prefer `Manager` suffix |
| **Store** | Zustand state container | `XxxStore` | Always end with `Store` |
| **Component** | React UI component | `PascalCase` | React component naming |

### UI & Interface Terms
| Term | Definition | Code Usage | Notes |
|------|------------|------------|-------|
| **Main Window** | Primary application window | `mainWindow` | Never "main app" |
| **Quick Chat** | Overlay quick access window | `quickChat` | Two words, camelCase |
| **Sidebar** | Left navigation panel | `sidebar` | One word |
| **Settings** | Application configuration | `settings` | Always plural |
| **Modal** | Overlay dialog window | `modal` | Never "dialog" or "popup" |
| **Toast** | Temporary notification | `toast` | For brief messages |

### Data & Storage Terms
| Term | Definition | Code Usage | Notes |
|------|------------|------------|-------|
| **Settings** | User configuration data | `settings` | Always plural, JSON object |
| **Preferences** | ❌ Not used | Use `settings` instead | Avoid for consistency |
| **Config** | ❌ Avoid in user-facing | Use `settings` for user data | OK for build config |
| **Storage** | Data persistence layer | `storage` | File-based storage |
| **State** | Runtime application state | `state` | Zustand store state |
| **Cache** | Temporary data storage | `cache` | For performance optimization |

## File & Directory Naming

### Directory Structure
```
src/
├── main/           # Electron main process (not "backend")
├── components/     # React components (not "ui" or "views")
├── stores/         # Zustand stores (not "state" or "redux")
├── hooks/          # Custom React hooks
├── types/          # TypeScript definitions
└── utils/          # Utility functions (not "helpers")
```

### File Naming Conventions
| Type | Convention | Example | Notes |
|------|------------|---------|-------|
| React Components | `PascalCase.tsx` | `ChatView.tsx` | Match component name |
| Services/Managers | `camelCase.js` | `conversationManager.js` | Business logic |
| Stores | `camelCase.ts` | `conversationStore.ts` | State containers |
| Types | `camelCase.d.ts` | `electron.d.ts` | TypeScript definitions |
| Utilities | `camelCase.ts` | `dummyData.ts` | Helper functions |
| Tests | `*.test.ts` | `conversation.test.ts` | Jest test files |

### Variable Naming
```typescript
// ✅ Good naming
const conversationId = "abc-123"
const activeConversation = conversation
const userMessage = message
const llmResponse = completion
const settingsData = settings

// ❌ Avoid these
const chatId = "abc-123"          // Use conversationId
const currentChat = conversation   // Use activeConversation  
const botMessage = message        // Use assistantMessage
const aiResponse = completion     // Use llmResponse or completion
const config = settings           // Use settings for user data
```

### CSS Class Naming
```css
/* ✅ Good - BEM-inspired with Tailwind */
.chat-view {}              /* Component base */
.chat-view__header {}      /* Component element */
.chat-view--loading {}     /* Component modifier */

/* ✅ Good - Tailwind utilities */
.bg-gray-100 .text-sm .p-4

/* ❌ Avoid generic names */
.container {} .wrapper {} .content {}
```

## API & Interface Naming

### IPC Channel Naming
```typescript
// Pattern: domain:action
'conversations:getAll'     // ✅ Good
'conversations:create'     // ✅ Good
'settings:update'         // ✅ Good
'llm:sendMessage'         // ✅ Good

// ❌ Avoid
'getConversations'        // Missing domain
'conv:get'               // Abbreviated domain
'chat:send'              // Wrong domain term
```

### Event Naming
```typescript
// Pattern: domain:eventType
'conversation:updated'    // ✅ Good
'llm:streamStart'        // ✅ Good
'app:triggerNewConversation' // ✅ Good

// ❌ Avoid
'conversationUpdated'    // Missing colon separator
'onStreamStart'          // Don't include 'on' prefix
'newConversation'        // Ambiguous without domain
```

### Function Naming
```typescript
// ✅ Good - Clear action verbs
async function createConversation() {}
async function deleteConversation() {}
async function updateSettings() {}
async function sendMessage() {}

// ❌ Avoid
async function addConversation() {}   // Use create for new entities
async function removeConversation() {} // Use delete for destruction
async function changeSettings() {}     // Use update for modifications
async function postMessage() {}       // Use send for messaging
```

## Constants & Enums

### Provider Constants
```typescript
const PROVIDERS = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai', 
  GROQ: 'groq'
} as const

// ✅ Usage
if (provider === PROVIDERS.ANTHROPIC) {}

// ❌ Avoid magic strings
if (provider === 'Anthropic') {}  // Wrong case
if (provider === 'claude') {}     // Provider vs model confusion
```

### Message Roles
```typescript
const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
} as const

// ✅ Usage
message.role === MESSAGE_ROLES.USER

// ❌ Avoid
message.role === 'human'     // Use 'user' consistently
message.role === 'ai'        // Use 'assistant' consistently
message.role === 'bot'       // Use 'assistant' consistently
```

## Spelling & Capitalization

### Consistent Spellings
| Correct | ❌ Avoid | Context |
|---------|----------|---------|
| `email` | `e-mail`, `Email` | User interface |
| `setup` (noun) | `set-up` | "Quick setup guide" |
| `set up` (verb) | `setup` | "Set up your API key" |
| `log in` (verb) | `login` | "Log in to continue" |
| `login` (noun) | `log-in` | "Login screen" |
| `API key` | `api key`, `Api Key` | User interface |
| `macOS` | `MacOS`, `Mac OS` | Platform references |

### Brand Names
| Correct | ❌ Avoid | Notes |
|---------|----------|-------|
| `Anthropic` | `anthropic` | Company name (capitalize) |
| `OpenAI` | `OpenAi`, `openai` | Company name (specific caps) |
| `Claude` | `claude` | Model family (capitalize) |
| `GPT-4` | `gpt-4`, `Gpt-4` | Model name (specific format) |
| `Electron` | `electron` | Framework name in docs |
| `React` | `react` | Library name in docs |

---
*Last updated from source at commit [latest] – edit this file: docs/glossary.md*