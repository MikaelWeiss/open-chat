const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  
  // Conversations API
  conversations: {
    getAll: () => ipcRenderer.invoke('conversations:getAll'),
    create: () => ipcRenderer.invoke('conversations:create'),
    delete: (conversationId) => ipcRenderer.invoke('conversations:delete', conversationId),
    rename: (conversationId, newTitle) => ipcRenderer.invoke('conversations:rename', conversationId, newTitle),
    addMessage: (conversationId, message) => ipcRenderer.invoke('conversations:addMessage', conversationId, message)
  },
  
  // Settings API
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings) => ipcRenderer.invoke('settings:update', settings)
  },
  
  // LLM API
  llm: {
    sendMessage: (params) => ipcRenderer.invoke('llm:sendMessage', params),
    getProviders: () => ipcRenderer.invoke('llm:getProviders'),
    
    // Streaming handlers
    onStreamChunk: (callback) => {
      ipcRenderer.on('llm:streamChunk', (event, data) => callback(data))
    },
    onStreamError: (callback) => {
      ipcRenderer.on('llm:streamError', (event, data) => callback(data))
    },
    onStreamEnd: (callback) => {
      ipcRenderer.on('llm:streamEnd', (event, data) => callback(data))
    },
    
    // Cleanup streaming listeners
    removeStreamListeners: () => {
      ipcRenderer.removeAllListeners('llm:streamChunk')
      ipcRenderer.removeAllListeners('llm:streamError')
      ipcRenderer.removeAllListeners('llm:streamEnd')
    }
  },
  
  // File operations
  files: {
    selectImage: () => ipcRenderer.invoke('files:selectImage')
  }
})