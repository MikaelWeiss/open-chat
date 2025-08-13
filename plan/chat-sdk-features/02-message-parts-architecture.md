# Message Parts Architecture

## Overview
Chat SDK uses a sophisticated message structure that replaces simple text content with structured "parts" that can contain reasoning, text, tool invocations, and other rich content types.

## What Your App Currently Lacks
- **Simple Text Messages**: Your messages only contain basic `content` field
- **No Structured Content**: Missing reasoning display, tool results, attachments
- **Limited Message Types**: Only supports user/assistant text exchange
- **No Rich Context**: Can't handle complex AI reasoning or tool usage

## Current vs Chat SDK Message Structure

### Your Current Message Schema
```typescript
interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;  // Simple text only
  timestamp: string;
}
```

### Chat SDK Message Parts Schema
```typescript
interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];  // Rich structured content
  attachments: Attachment[];
  createdAt: Date;
}

type MessagePart = 
  | { type: 'reasoning'; reasoning: string }
  | { type: 'text'; text: string }
  | { type: 'tool-invocation'; toolInvocation: ToolInvocation }
```

## Key Features from Chat SDK

### 1. Reasoning Parts
- **AI Thought Process**: Show model's internal reasoning before response
- **Transparency**: Users can see how AI arrived at conclusions
- **Collapsible Display**: Hide/show reasoning sections
- **Improved Trust**: Users understand AI decision-making

### 2. Tool Invocation Parts
- **Function Calls**: Display when AI calls external tools
- **Real-time Status**: Show tool execution progress
- **Results Display**: Rich formatting for tool outputs
- **Error Handling**: Graceful handling of tool failures

### 3. Rich Text Parts
- **Enhanced Formatting**: Better than simple markdown
- **Edit Capabilities**: Users can edit message content
- **Version Control**: Track message edits and changes
- **Collaborative Features**: Multiple users can modify content

### 4. Attachment Support
- **File References**: Link files to messages
- **Media Handling**: Images, documents, audio files
- **Context Preservation**: Maintain file context across conversation
- **Cross-Platform Sync**: File access across devices

## Implementation Plan for Open Chat

### Phase 1: Database Migration (High Priority)
1. **Schema Update**
   - Add `parts` JSON field to messages table
   - Add `attachments` JSON field to messages table
   - Keep existing `content` field for backward compatibility
   - Create migration script for existing messages

2. **Data Layer Updates**
   - Update `chatStore.ts` to handle message parts
   - Add type definitions for message parts
   - Implement serialization/deserialization

### Phase 2: UI Components (High Priority)
1. **Message Rendering**
   - Create `MessagePart` component system
   - Implement reasoning display with toggle
   - Add tool invocation status indicators
   - Update message list to use parts

2. **Rich Text Editing**
   - Add inline message editing
   - Implement edit mode/view mode toggle
   - Add edit history tracking

### Phase 3: Advanced Features (Medium Priority)
1. **Tool Integration**
   - Add tool calling infrastructure
   - Implement weather, calculator, document tools
   - Create tool result visualization

2. **Attachment System**
   - File upload and storage
   - Image preview in messages
   - Document attachment handling

### Phase 4: Reasoning Display (Lower Priority)
1. **AI Reasoning**
   - Add reasoning model support
   - Implement collapsible reasoning sections
   - Add reasoning formatting and highlighting

## Technical Architecture

### Message Part Rendering System
```tsx
// Pseudo-code for parts rendering
{message.parts?.map((part, index) => {
  switch (part.type) {
    case 'reasoning':
      return <MessageReasoning reasoning={part.reasoning} />
    case 'text':
      return <MessageText text={part.text} />
    case 'tool-invocation':
      return <ToolInvocation toolInvocation={part.toolInvocation} />
  }
})}
```

### Database Migration Strategy
1. **Backward Compatibility**: Keep existing `content` field
2. **Gradual Migration**: Convert messages to parts format over time
3. **Fallback Handling**: Display old messages if parts parsing fails

## Documentation Links

### Context7 Resources
- **Chat SDK Message Parts**: Use context7 `/context7/chat-sdk_dev-docs` with topic "message parts migration"
- **AI SDK React**: Use context7 `/websites/ai-sdk_dev` for React integration patterns

### Web Documentation
- **Message Parts Migration Guide**: https://chat-sdk.dev/docs/migration-guides/message-parts
- **AI SDK React Hooks**: https://sdk.vercel.ai/docs/reference/ai-sdk-react

## Technical Considerations

### Tauri-Specific Adaptations
- **SQLite Schema**: Update SQLite tables to support JSON fields
- **File Handling**: Use Tauri's file system APIs for attachments
- **Cross-Platform**: Ensure parts render consistently across platforms

### Performance Considerations
- **Large Messages**: Handle messages with many parts efficiently
- **Streaming**: Support real-time part updates during generation
- **Memory Usage**: Optimize for mobile devices with limited memory

### Migration Strategy
- **Phased Rollout**: Implement parts gradually to avoid breaking changes
- **Data Preservation**: Ensure no existing messages are lost
- **Testing**: Extensive testing of migration scripts

## Benefits for Your App
1. **Richer Conversations**: Display AI reasoning and tool usage
2. **Better UX**: Users understand what AI is doing
3. **Professional Features**: Tool calling, file attachments, editing
4. **Future-Proof**: Foundation for advanced AI features

## Effort Estimation
- **Medium Complexity**: Requires database and UI changes
- **Timeline**: 2-3 weeks for core implementation
- **Dependencies**: May need additional UI libraries for rich text editing

## Success Metrics
- Successful migration of existing messages
- User engagement with reasoning display
- Reduced confusion about AI responses
- Increased trust in AI recommendations

## Risk Assessment
- **Medium**: Database migration always carries risks
- **Data Loss**: Potential for message corruption during migration
- **Performance**: Large JSON fields may slow queries
- **Complexity**: More complex message rendering logic

## Implementation Priority
**High Priority** - This is foundational for many other features. The message parts architecture enables tool calling, reasoning display, and artifacts system.