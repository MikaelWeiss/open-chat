# Debugging & Telemetry Playbook

## Structured Logging

### Log Locations
```bash
# macOS Console App
# Filter by "open-chat" process

# Terminal output (development)
npm dev
# Logs appear in terminal

# Electron main process logs
console.log() # Appears in terminal
console.error() # Appears in terminal

# Renderer process logs  
console.log() # Appears in DevTools console
```

### Log Levels and Conventions
```javascript
// Main process (src/main/main.js)
console.log('[INFO]', message)
console.error('[ERROR]', error)
console.warn('[WARN]', warning)

// Service logs include request IDs
console.log('[LLM] Request ID:', requestId, 'Provider:', provider)
console.log('[CONV] Conversation ID:', conversationId, 'Action:', action)
console.log('[SETTINGS] Corruption detected:', corruptionDetails)
```

### Trace ID Convention
```javascript
// Each streaming request gets a unique streamId
const streamId = Date.now().toString()
console.log('[STREAM] Started:', streamId, 'Conversation:', conversationId)
console.log('[STREAM] Chunk received:', streamId, 'Length:', chunk.length)
console.log('[STREAM] Completed:', streamId, 'Total tokens:', totalTokens)
```

## Dashboard & Metrics

### Built-in Usage Dashboard
**Access**: Settings → Usage Statistics
- **Total tokens used** across all providers
- **Cost tracking** (per provider)
- **Message count** and conversation count
- **Time period** filtering (daily/weekly/monthly)

### Key Performance Metrics
```javascript
// Available via DevTools console in renderer
useUsageStats.getState().stats
// Returns: { totalTokens, totalCost, conversationCount, messageCount, byProvider }

// Conversation performance
useConversationStore.getState().conversations
// Returns: Array of all conversations with timestamps
```

### Electron Performance Metrics
```bash
# Enable performance monitoring
NODE_ENV=development electron --trace-warnings --enable-logging .

# Memory usage monitoring
process.memoryUsage()
# Returns: { rss, heapTotal, heapUsed, external, arrayBuffers }
```

## Common Error Triage

### 1. "API Key Invalid" Error
**Symptoms**: `INVALID_API_KEY` error in console
**Look in**: Settings → Provider configuration
**Fix**: 
1. Verify API key in settings
2. Test API key with curl:
   ```bash
   curl -H "x-api-key: YOUR_KEY" https://api.anthropic.com/v1/messages
   ```
3. Check provider status page

### 2. "Model Not Found" Error  
**Symptoms**: `MODEL_NOT_FOUND` error when sending messages
**Look in**: Console logs for model availability
**Fix**:
1. Settings → Provider → Refresh Models
2. Check if model is deprecated/removed
3. Verify provider subscription level

### 3. Streaming Stops Mid-Response
**Symptoms**: Stream chunks stop, no `llm:streamEnd` event
**Look in**: Main process console for network errors
**Fix**:
1. Check network connectivity
2. Verify rate limits not exceeded  
3. Look for provider-specific error messages

### 4. Settings Corruption
**Symptoms**: Settings reset to defaults, corruption warning
**Look in**: Settings Manager corruption status
**Fix**:
1. Settings → Advanced → Check Corruption Status
2. Backup and manually edit settings file
3. Use "Reset to Defaults" as last resort

### 5. High Memory Usage
**Symptoms**: App becomes slow, high RAM usage
**Look in**: Task Manager / Activity Monitor
**Fix**:
1. Check conversation count (large conversations use more memory)
2. Clear old conversations
3. Restart app to clear memory leaks

## Debugging Tools & Commands

### React DevTools
```bash
# Install React DevTools
# Then access via Electron DevTools → React tab

# Inspect component state
# Select component → Props/State panel
```

### Zustand State Inspection
```javascript
// In DevTools console
useConversationStore.getState()
useSettingsStore.getState()

// Watch state changes
useConversationStore.subscribe(console.log)
```

### IPC Communication Debugging
```javascript
// In main process (main.js)
ipcMain.handle('debug:log-ipc', (event, channel, data) => {
  console.log('[IPC]', channel, data)
})

// In renderer process
window.electronAPI.on('*', (channel, data) => {
  console.log('[IPC-RECEIVED]', channel, data)
})
```

### Network Request Monitoring
```bash
# Enable verbose HTTP logging
DEBUG=* npm dev

# Or specifically for HTTP requests
DEBUG=axios:* npm dev
```

### File System Debugging
```javascript
// In main process
console.log('[FS] Settings path:', settingsManager.settingsPath)
console.log('[FS] Conversations path:', conversationManager.conversationsPath)

// Check file permissions
fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK, (err) => {
  if (err) console.error('[FS] Permission error:', err)
})
```

## Performance Analysis

### Bundle Size Analysis
```bash
# Generate bundle analysis
npm build
npx source-map-explorer dist/assets/*.js

# Look for:
# - Large dependencies
# - Duplicate packages
# - Unused code
```

### Startup Performance
```javascript
// In main.js
console.time('app-startup')
app.whenReady().then(() => {
  console.timeEnd('app-startup')
})

// In renderer
console.time('react-mount')
ReactDOM.render(<App />, document.getElementById('root'))
console.timeEnd('react-mount')
```

### Streaming Performance
```javascript
// In LLMManager
console.time(`stream-${streamId}`)
// ... streaming logic
console.timeEnd(`stream-${streamId}`)

// Track token throughput
const startTime = Date.now()
const tokensPerSecond = totalTokens / ((Date.now() - startTime) / 1000)
```

## Error Recovery Procedures

### Corrupted Settings Recovery
1. **Backup current settings**:
   ```bash
   cp "~/Library/Application Support/open-chat/settings.json" ./settings-backup.json
   ```
2. **Try auto-repair**: Settings → Advanced → Reload Settings
3. **Manual repair**: Edit settings file directly
4. **Nuclear option**: Settings → Advanced → Reset All Settings

### Conversation Data Recovery
1. **Check backup location**: Same directory as settings
2. **Export conversations**: File → Export All Conversations
3. **Manual recovery**: Parse `conversations.json` directly

### Complete App Reset
```bash
# Nuclear option - removes all data
rm -rf "~/Library/Application Support/open-chat"
# Restart app to regenerate defaults
```

## Monitoring & Alerting

### Health Check Endpoints
```javascript
// In main process - can be called via IPC
ipcMain.handle('health:check', async () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    memory: process.memoryUsage(),
    conversations: await conversationManager.getStats(),
    settings: await settingsManager.getStatus()
  }
})
```

### Usage Monitoring
```javascript
// Track usage patterns
const usageStats = {
  sessionsPerDay: 0,
  averageConversationLength: 0,
  preferredProviders: {},
  errorRate: 0
}
```

---
*Last updated from source at commit [latest] – edit this file: docs/debugging-telemetry.md*