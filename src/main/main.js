const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs').promises
const { ConversationManager } = require('./services/conversationManager')
const { SettingsManager } = require('./services/settingsManager')
const { LLMManager } = require('./services/llmManager')

// Initialize managers
const conversationManager = new ConversationManager()
const settingsManager = new SettingsManager()
const llmManager = new LLMManager()

let mainWindow

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 }
  })

  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

// IPC Handlers for Conversations
ipcMain.handle('conversations:getAll', async () => {
  return await conversationManager.getAllConversations()
})

ipcMain.handle('conversations:create', async (event, provider, model) => {
  return await conversationManager.createConversation(provider, model)
})

ipcMain.handle('conversations:delete', async (event, conversationId) => {
  return await conversationManager.deleteConversation(conversationId)
})

ipcMain.handle('conversations:rename', async (event, conversationId, newTitle) => {
  return await conversationManager.renameConversation(conversationId, newTitle)
})

ipcMain.handle('conversations:addMessage', async (event, conversationId, message) => {
  return await conversationManager.addMessage(conversationId, message)
})

// IPC Handlers for Settings
ipcMain.handle('settings:get', async () => {
  return await settingsManager.getSettings()
})

ipcMain.handle('settings:update', async (event, settings) => {
  return await settingsManager.updateSettings(settings)
})

// IPC Handlers for LLM Operations
ipcMain.handle('llm:sendMessage', async (event, { conversationId, provider, model, messages, stream }) => {
  if (stream) {
    // For streaming, we'll send chunks back via events
    const streamId = Date.now().toString()
    
    // Notify frontend that streaming started
    mainWindow.webContents.send('llm:streamStart', { conversationId, streamId })
    
    llmManager.streamCompletion(conversationId, provider, model, messages, (chunk) => {
      mainWindow.webContents.send('llm:streamChunk', { streamId, chunk })
    }, (error) => {
      mainWindow.webContents.send('llm:streamError', { streamId, error })
    }, (data) => {
      mainWindow.webContents.send('llm:streamEnd', { streamId, ...data })
    })
    
    return { streamId }
  } else {
    return await llmManager.getCompletion(provider, model, messages)
  }
})

ipcMain.handle('llm:cancelStream', async (event, conversationId) => {
  const cancelled = llmManager.cancelStream(conversationId)
  if (cancelled) {
    mainWindow.webContents.send('llm:streamCancelled', { conversationId })
  }
  return cancelled
})

ipcMain.handle('llm:getProviders', async () => {
  return await llmManager.getAvailableProviders()
})

ipcMain.handle('llm:fetchModels', async (event, providerId) => {
  try {
    const models = await llmManager.fetchModelsFromProvider(providerId)
    
    // Update the provider's models in settings
    const settings = await settingsManager.getSettings()
    if (settings.providers[providerId]) {
      settings.providers[providerId].models = models
      await settingsManager.updateSettings({ providers: settings.providers })
    }
    
    return models
  } catch (error) {
    throw error
  }
})

ipcMain.handle('llm:calculateUsage', async (event, { provider, model, messages }) => {
  return await llmManager.calculateUsageForMessages(provider, model, messages)
})

// IPC Handlers for File Operations
ipcMain.handle('files:selectImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ]
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    // Read file and return base64
    const filePath = result.filePaths[0]
    const fileData = await fs.readFile(filePath)
    const base64 = fileData.toString('base64')
    const mimeType = `image/${path.extname(filePath).slice(1)}`
    
    return {
      path: filePath,
      base64,
      mimeType
    }
  }
  
  return null
})

// IPC Handler for opening external URLs
ipcMain.handle('shell:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url)
    return true
  } catch (error) {
    console.error('Failed to open external URL:', error)
    return false
  }
})

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle app initialization
app.on('ready', async () => {
  await conversationManager.initialize()
  await settingsManager.initialize()
  await llmManager.initialize(settingsManager)
})