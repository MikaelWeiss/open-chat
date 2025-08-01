const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } = require('electron')
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
let currentGlobalShortcut = null

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

function showAndFocusWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.show()
    mainWindow.focus()
    app.focus({ steal: true })
    
    // Trigger new conversation creation in the renderer
    mainWindow.webContents.send('app:triggerNewConversation')
  } else {
    createWindow()
  }
}

function registerGlobalShortcut(shortcut) {
  // Unregister existing shortcut if any
  if (currentGlobalShortcut) {
    globalShortcut.unregister(currentGlobalShortcut)
    currentGlobalShortcut = null
  }
  
  // Register new shortcut if provided
  if (shortcut && shortcut.trim()) {
    const ret = globalShortcut.register(shortcut, () => {
      showAndFocusWindow()
    })

    if (ret) {
      currentGlobalShortcut = shortcut
    } else {
      currentGlobalShortcut = null
    }
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
  const result = await settingsManager.updateSettings(settings)
  
  // Update global shortcut if keyboard settings changed
  if (settings.keyboard && 'globalHotkey' in settings.keyboard) {
    registerGlobalShortcut(settings.keyboard.globalHotkey)
  }
  
  return result
})

// IPC Handler for updating global shortcut
ipcMain.handle('app:updateGlobalShortcut', async (event, shortcut) => {
  registerGlobalShortcut(shortcut)
  return currentGlobalShortcut === shortcut
})

// IPC Handler for temporarily disabling global shortcut during capture
ipcMain.handle('app:disableGlobalShortcut', async () => {
  if (currentGlobalShortcut) {
    globalShortcut.unregister(currentGlobalShortcut)
  }
})

// IPC Handler for re-enabling global shortcut after capture
ipcMain.handle('app:enableGlobalShortcut', async () => {
  if (currentGlobalShortcut) {
    const ret = globalShortcut.register(currentGlobalShortcut, () => {
      showAndFocusWindow()
    })
  }
})

ipcMain.handle('settings:getCorruptionStatus', async () => {
  return await settingsManager.getCorruptionStatus()
})

ipcMain.handle('settings:reset', async () => {
  return await settingsManager.resetSettings()
})

ipcMain.handle('settings:openInEditor', async () => {
  const { shell } = require('electron')
  const status = settingsManager.getCorruptionStatus()
  try {
    await shell.openPath(status.settingsPath)
    return true
  } catch (error) {
    console.error('Failed to open settings file:', error)
    return false
  }
})

ipcMain.handle('settings:reload', async () => {
  return await settingsManager.reloadSettings()
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
    return false
  }
})

// App lifecycle
app.whenReady().then(async () => {
  createWindow()

  // Initialize settings and register global shortcut from settings
  try {
    await settingsManager.initialize()
    const settings = await settingsManager.getSettings()
    const globalHotkey = settings?.keyboard?.globalHotkey || ''
    registerGlobalShortcut(globalHotkey)
  } catch (error) {
    // Fallback to default (no hotkey)
    registerGlobalShortcut('')
  }

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

app.on('will-quit', () => {
  // Unregister current global shortcut
  if (currentGlobalShortcut) {
    globalShortcut.unregister(currentGlobalShortcut)
  }
  // Unregister all global shortcuts as a fallback
  globalShortcut.unregisterAll()
})

// Handle app initialization
app.on('ready', async () => {
  await conversationManager.initialize()
  await settingsManager.initialize()
  await llmManager.initialize(settingsManager)
})