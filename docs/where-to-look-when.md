# "Where to Look When..." Index

## Adding New Features

| **When you want to...** | **Start looking at...** | **Key files to check** |
|--------------------------|--------------------------|-------------------------|
| Add a new AI provider | `src/main/services/llmManager.js` | Provider config in settings, API integration |
| Add a new chat feature | `src/components/Chat/ChatView.tsx` | MessageInput, MessageList components |
| Add new settings option | `src/main/services/settingsManager.js` | SettingsModal component, settings store |
| Add new keyboard shortcut | `src/main/main.js` → IPC handlers | SettingsModal keyboard section |
| Add file type support | `src/main/main.js` → file handlers | MIME type mappings, capability detection |
| Add new UI component | `src/components/` directory | Follow existing component patterns |
| Add new window/modal | `src/main/main.js` → window creation | BrowserWindow configuration |
| Add streaming feature | `src/main/services/llmManager.js` | Streaming handlers, IPC events |

## Debugging Issues

| **When you see...** | **Look first at...** | **Common causes** |
|----------------------|----------------------|-------------------|
| API key errors | `src/main/services/settingsManager.js` | Invalid key format, provider configuration |
| Streaming stops | `src/main/services/llmManager.js` | Network issues, rate limiting, API errors |
| Settings corruption | Settings file in app data directory | Invalid JSON, file permissions, disk space |
| Memory usage high | `src/stores/conversationStore.ts` | Large conversation history, memory leaks |
| UI not updating | React component state and props | State management, IPC communication |
| File upload fails | `src/main/main.js` → file handlers | File size limits, MIME type support |
| Global shortcut broken | `src/main/main.js` → shortcut registration | Conflicts with other apps, invalid keys |
| Build failures | `build.js` and TypeScript errors | Dependency issues, type errors |

## Performance Issues

| **Performance problem** | **Check these locations** | **Optimization strategies** |
|-------------------------|---------------------------|----------------------------|
| Slow app startup | `src/main/main.js` initialization | Service initialization order |
| Slow message rendering | `src/components/Chat/MessageList.tsx` | Virtual scrolling, memoization |
| High memory usage | Conversation store, message history | Conversation pruning, pagination |
| Slow typing/input | `src/components/Chat/MessageInput.tsx` | Debouncing, input optimization |
| Build time too long | `build.js` configuration | Bundle optimization, tree shaking |
| Large bundle size | esbuild output analysis | Dependency audit, code splitting |

## Data & Storage Issues

| **Data issue** | **File location** | **Recovery steps** |
|----------------|-------------------|-------------------|
| Lost conversations | `~/Library/Application Support/open-chat/conversations.json` | Check backups, corruption recovery |
| Settings reset | `~/Library/Application Support/open-chat/settings.json` | Validate JSON, check permissions |
| Usage stats wrong | Usage tracking in conversation store | Recalculate from conversation history |
| File attachments missing | Base64 data in conversation messages | Check file size limits, encoding |

## Configuration & Setup

| **Configuration task** | **Primary location** | **Related files** |
|------------------------|----------------------|-------------------|
| Provider API keys | Settings → Providers | `settingsManager.js`, provider configs |
| UI customization | Settings → Appearance | `src/components/Settings/` |
| Keyboard shortcuts | Settings → Keyboard | Global shortcut registration |
| Development setup | `package.json`, `build.js` | Development scripts, dependencies |
| Deployment config | `electron-builder` config | Packaging and distribution |

## Security & Privacy

| **Security concern** | **Check these files** | **Key considerations** |
|----------------------|----------------------|------------------------|
| API key exposure | Settings encryption, logs | Never log API keys, secure storage |
| File access permissions | Electron security settings | Sandbox, context isolation |
| External URL handling | `src/main/main.js` → shell handlers | Validate URLs before opening |
| IPC security | Preload scripts, context isolation | Controlled API exposure |

## Architecture & Code Organization

| **Architectural concern** | **Key files/patterns** | **Design principles** |
|---------------------------|------------------------|----------------------|
| Adding new service | `src/main/services/` pattern | Single responsibility, dependency injection |
| State management | Zustand stores in `src/stores/` | Immutable updates, persistence |
| Component organization | `src/components/` hierarchy | Composition over inheritance |
| IPC communication | Main process handlers + preload | Type-safe, error handling |
| Error handling | Service-level try/catch patterns | Graceful degradation, user feedback |

## Testing & Quality

| **Testing need** | **Where to start** | **Testing strategy** |
|------------------|-------------------|---------------------|
| Unit testing | Service classes in `src/main/services/` | Mock external dependencies |
| Integration testing | IPC communication flows | End-to-end user workflows |
| UI testing | React components | Component behavior, user interactions |
| Performance testing | Conversation loading, streaming | Large data sets, concurrent users |
| Security testing | API key handling, file access | Penetration testing, code review |

## External Integrations

| **Integration type** | **Implementation files** | **Documentation** |
|---------------------|-------------------------|-------------------|
| AI provider APIs | `src/main/services/llmManager.js` | Provider API documentation |
| File system access | Electron file dialog handlers | Electron security guidelines |
| OS-level features | Global shortcuts, notifications | Platform-specific APIs |
| Build system | `build.js`, package scripts | esbuild documentation |

## Common Code Patterns

| **Pattern type** | **Example location** | **When to use** |
|------------------|----------------------|-----------------|
| Service initialization | `conversationManager.initialize()` | Service startup, dependency setup |
| IPC handler | `ipcMain.handle('conversations:create')` | Frontend-backend communication |
| Error handling | `try/catch` in service methods | Graceful error recovery |
| State updates | Zustand store actions | Application state changes |
| Component composition | Chat component hierarchy | Reusable UI components |

## Migration & Upgrades

| **Migration scenario** | **Files to update** | **Compatibility considerations** |
|------------------------|---------------------|--------------------------------|
| Electron version upgrade | `package.json`, security settings | API changes, deprecations |
| Node.js version upgrade | All JavaScript files | Syntax compatibility, dependencies |
| React version upgrade | All TypeScript/React files | Hook changes, component APIs |
| Dependencies update | `package.json`, lock files | Breaking changes, security fixes |

## Quick Reference Commands

```bash
# Find where something is used
grep -r "searchTerm" src/

# Find component usage
grep -r "ComponentName" src/components/

# Find IPC channel usage
grep -r "ipc-channel-name" src/

# Find service method usage
grep -r "methodName" src/main/services/

# Check settings structure
cat ~/Library/Application\ Support/open-chat/settings.json

# Monitor console logs
# Open DevTools → Console tab

# Check file locations
find ~/Library/Application\ Support/open-chat/ -name "*.json"
```

## Emergency Contacts & Escalation

| **Issue severity** | **First action** | **Escalation path** |
|-------------------|------------------|---------------------|
| Critical security issue | Stop using app, disconnect network | Report privately to security team |
| Data loss | Stop writing new data, backup current state | Recovery procedures, data team |
| Performance degradation | Monitor resource usage, collect logs | Performance team, optimization |
| Build system broken | Check CI logs, dependency issues | Build team, infrastructure |

---
*Last updated from source at commit [latest] – edit this file: docs/where-to-look-when.md*