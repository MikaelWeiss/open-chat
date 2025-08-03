const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  
  // Conversations API
  conversations: {
    getAll: () => ipcRenderer.invoke('conversations:getAll'),
    create: (provider, model) => ipcRenderer.invoke('conversations:create', provider, model),
    delete: (conversationId) => ipcRenderer.invoke('conversations:delete', conversationId),
    rename: (conversationId, newTitle) => ipcRenderer.invoke('conversations:rename', conversationId, newTitle),
    addMessage: (conversationId, message) => ipcRenderer.invoke('conversations:addMessage', conversationId, message),
    toggleStar: (conversationId) => ipcRenderer.invoke('conversations:toggleStar', conversationId)
  },
  
  // Settings API
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings) => ipcRenderer.invoke('settings:update', settings),
    getCorruptionStatus: () => ipcRenderer.invoke('settings:getCorruptionStatus'),
    reset: () => ipcRenderer.invoke('settings:reset'),
    openInEditor: () => ipcRenderer.invoke('settings:openInEditor'),
    reload: () => ipcRenderer.invoke('settings:reload')
  },
  
  // LLM API
  llm: {
    sendMessage: (params) => ipcRenderer.invoke('llm:sendMessage', params),
    getProviders: () => ipcRenderer.invoke('llm:getProviders'),
    fetchModels: (providerId) => ipcRenderer.invoke('llm:fetchModels', providerId),
    calculateUsage: (params) => ipcRenderer.invoke('llm:calculateUsage', params),
    cancelStream: (conversationId) => ipcRenderer.invoke('llm:cancelStream', conversationId),
    
    // Streaming handlers
    onStreamStart: (callback) => {
      ipcRenderer.on('llm:streamStart', (event, data) => callback(data))
    },
    onStreamChunk: (callback) => {
      ipcRenderer.on('llm:streamChunk', (event, data) => callback(data))
    },
    onStreamError: (callback) => {
      ipcRenderer.on('llm:streamError', (event, data) => callback(data))
    },
    onStreamEnd: (callback) => {
      ipcRenderer.on('llm:streamEnd', (event, data) => callback(data))
    },
    onStreamCancelled: (callback) => {
      ipcRenderer.on('llm:streamCancelled', (event, data) => callback(data))
    },
    
    // Cleanup streaming listeners
    removeStreamListeners: () => {
      ipcRenderer.removeAllListeners('llm:streamStart')
      ipcRenderer.removeAllListeners('llm:streamChunk')
      ipcRenderer.removeAllListeners('llm:streamError')
      ipcRenderer.removeAllListeners('llm:streamEnd')
      ipcRenderer.removeAllListeners('llm:streamCancelled')
    }
  },
  
  // File operations
  files: {
    selectImage: () => ipcRenderer.invoke('files:selectImage'),
    selectAudio: () => ipcRenderer.invoke('files:selectAudio'),
    selectFile: () => ipcRenderer.invoke('files:selectFile'),
    selectFileByCapabilities: (capabilities) => ipcRenderer.invoke('files:selectFileByCapabilities', capabilities)
  },
  
  // Shell operations
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },
  
  // App events
  app: {
    onTriggerNewConversation: (callback) => {
      ipcRenderer.on('app:triggerNewConversation', () => callback())
    },
    onConversationUpdated: (callback) => {
      ipcRenderer.on('conversation:updated', (event, data) => callback(data))
    },
    removeAppListeners: () => {
      ipcRenderer.removeAllListeners('app:triggerNewConversation')
      ipcRenderer.removeAllListeners('conversation:updated')
      ipcRenderer.removeAllListeners('quickChat:requestStateSave')
      ipcRenderer.removeAllListeners('quickChat:restoreState')
    },
    updateGlobalShortcut: (shortcut) => ipcRenderer.invoke('app:updateGlobalShortcut', shortcut),
    disableGlobalShortcut: () => ipcRenderer.invoke('app:disableGlobalShortcut'),
    enableGlobalShortcut: () => ipcRenderer.invoke('app:enableGlobalShortcut'),
    hideQuickChat: () => ipcRenderer.invoke('app:hideQuickChat'),
    sendFeedback: (message) => ipcRenderer.invoke('app:sendFeedback', message)
  },
  
  // Quick Chat State Management
  quickChat: {
    saveState: (state) => ipcRenderer.invoke('quickChat:saveState', state),
    loadState: () => ipcRenderer.invoke('quickChat:loadState'),
    clearState: () => ipcRenderer.invoke('quickChat:clearState'),
    onRequestStateSave: (callback) => {
      ipcRenderer.on('quickChat:requestStateSave', () => callback())
    },
    onRestoreState: (callback) => {
      ipcRenderer.on('quickChat:restoreState', (event, state) => callback(state))
    },
    removeQuickChatListeners: () => {
      ipcRenderer.removeAllListeners('quickChat:requestStateSave')
      ipcRenderer.removeAllListeners('quickChat:restoreState')
    }
  }
})