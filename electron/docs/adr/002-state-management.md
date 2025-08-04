# ADR-002: State Management with Zustand

**Status**: Accepted  
**Date**: 2024-01-20  
**Deciders**: Frontend Team  

## Context

We needed to choose a state management solution for the React frontend that would handle:
- Conversation data and chat history
- Application settings and preferences
- Real-time streaming state from AI providers
- Cross-window state synchronization (main window + quick chat)
- Persistent storage integration

## Decision

We chose **Zustand** as the primary state management library.

## Rationale

### Considered Options

1. **Zustand** (Lightweight state management)
2. **Redux Toolkit** (Full-featured state management)
3. **React Context + useReducer** (Built-in React state)
4. **Jotai** (Atomic state management)
5. **Valtio** (Proxy-based state)

### Why Zustand Won

**Pros:**
- **Minimal Boilerplate**: Simple store definition and usage patterns
- **TypeScript Support**: Excellent TypeScript integration out of the box
- **Small Bundle Size**: Only ~8KB, important for Electron app size
- **DevTools Integration**: Works with Redux DevTools for debugging
- **Persistence**: Built-in persistence middleware for settings
- **Performance**: Efficient re-renders with selector-based subscriptions
- **Learning Curve**: Easy to adopt for team members familiar with hooks

**Implementation Example:**
```typescript
const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  addConversation: (conversation) => 
    set((state) => ({ conversations: [...state.conversations, conversation] })),
  // ... other actions
}))
```

### Rejected Alternatives

**Redux Toolkit**:
- Pros: Mature ecosystem, excellent DevTools, predictable state updates
- Cons: More boilerplate, larger bundle size, overkill for chat app complexity
- **Rejection Reason**: Too heavy for our use case

**React Context + useReducer**:
- Pros: No external dependencies, built into React
- Cons: Performance issues with frequent updates, complex cross-component sharing
- **Rejection Reason**: Performance concerns with chat streaming

**Jotai**:
- Pros: Atomic updates, excellent performance, modern approach
- Cons: Different mental model, less mature ecosystem
- **Rejection Reason**: Team preferred object-oriented store approach

**Valtio**:
- Pros: Mutable state updates, proxy magic, simple API
- Cons: Magic behavior can be confusing, debugging complexity
- **Rejection Reason**: Preference for explicit state updates

## Consequences

### Positive
- Fast development with minimal state management boilerplate
- Easy debugging with Redux DevTools integration
- Efficient performance with selector-based subscriptions
- Built-in persistence reduces custom storage code
- Small impact on bundle size

### Negative
- Less mature ecosystem compared to Redux
- Fewer community resources and examples
- Team needs to learn new patterns (though similar to React hooks)

### Store Architecture

#### Conversation Store (`conversationStore.ts`)
```typescript
interface ConversationState {
  conversations: Conversation[]
  activeConversationId: string | null
  streamingStates: Map<string, StreamingState>
  // Actions
  addConversation: (conversation: Conversation) => void
  deleteConversation: (id: string) => void
  updateStreamingState: (id: string, state: StreamingState) => void
}
```

#### Settings Store (`settingsStore.ts`)
```typescript
interface SettingsState {
  providers: ProviderSettings
  ui: UISettings
  keyboard: KeyboardSettings
  // Actions
  updateSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
}
```

### Cross-Window Synchronization

Since Electron can have multiple renderer processes (main window + quick chat), we handle synchronization via:
1. **IPC Events**: Main process broadcasts state changes to all windows
2. **Store Updates**: Each window updates its local Zustand store
3. **Conflict Resolution**: Last-write-wins for settings, append-only for conversations

```typescript
// Listen for cross-window updates
window.electronAPI.on('conversation:updated', (data) => {
  useConversationStore.getState().syncFromIPC(data)
})
```

### Persistence Strategy

- **Settings Store**: Automatically persisted via Zustand persist middleware
- **Conversation Store**: Manual persistence via IPC to main process
- **Streaming State**: In-memory only, rebuilt on app restart

## Migration Path

If Zustand proves insufficient:
1. **Phase 1**: Extract business logic into separate service classes
2. **Phase 2**: Replace Zustand with Redux Toolkit while keeping same service interfaces
3. **Phase 3**: Update components to use new state management

This approach minimizes rewrite risk by keeping state logic separate from state management implementation.

## Review Date

This decision should be reviewed in 6 months (July 2024) or if:
- Performance issues arise with large conversation histories
- Cross-window synchronization becomes complex
- Team finds state management patterns confusing

---
*Last updated from source at commit [latest] – edit this file: docs/adr/002-state-management.md*