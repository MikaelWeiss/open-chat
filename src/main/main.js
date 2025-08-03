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
let quickChatWindow
let currentGlobalShortcut = null

// Quick chat state storage for persistence across window recreations
let quickChatState = {
  draftText: '',
  attachments: [],
  selectedConversationId: null,
  isNewConversation: false,
  selectedModel: null
}

const isDev = process.env.NODE_ENV === 'development'

// Broadcast function to send events to all windows
function broadcastToAllWindows(channel, ...args) {
  const windows = [mainWindow, quickChatWindow].filter(win => win && !win.isDestroyed())
  windows.forEach(win => {
    win.webContents.send(channel, ...args)
  })
}

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

  mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
}

function createQuickChatWindow() {
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  
  quickChatWindow = new BrowserWindow({
    width: 445,
    height: 545,
    maxWidth: 600,
    x: width - 445 - 20, // 20px from right edge
    y: height - 545 - 20, // 20px from bottom edge
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    alwaysOnTop: true,
    visibleOnAllWorkspaces: true,
    skipTaskbar: true,
    resizable: true
  })

  quickChatWindow.loadFile(path.join(__dirname, '../../dist/index.html'), { 
    query: { mode: 'quickchat' } 
  })
  
  quickChatWindow.on('closed', () => {
    quickChatWindow = null
  })

  // Send restore state signal once the window is ready
  quickChatWindow.webContents.once('dom-ready', () => {
    quickChatWindow.webContents.send('quickChat:restoreState', quickChatState)
  })
}

function destroyQuickChatWindow() {
  if (quickChatWindow && !quickChatWindow.isDestroyed()) {
    quickChatWindow.destroy()
    quickChatWindow = null
  }
}

function toggleQuickChatWindow() {
  if (quickChatWindow && !quickChatWindow.isDestroyed()) {
    // Request state save before destroying
    quickChatWindow.webContents.send('quickChat:requestStateSave')
    // Give time for state saving, then destroy
    setTimeout(() => {
      destroyQuickChatWindow()
    }, 100)
  } else {
    createQuickChatWindow()
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
      toggleQuickChatWindow()
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
  const result = await conversationManager.createConversation(provider, model)
  broadcastToAllWindows('conversation:updated', { action: 'created', conversationId: result.id })
  return result
})

ipcMain.handle('conversations:delete', async (event, conversationId) => {
  const result = await conversationManager.deleteConversation(conversationId)
  broadcastToAllWindows('conversation:updated', { action: 'deleted', conversationId })
  return result
})

ipcMain.handle('conversations:rename', async (event, conversationId, newTitle) => {
  const result = await conversationManager.renameConversation(conversationId, newTitle)
  broadcastToAllWindows('conversation:updated', { action: 'renamed', conversationId })
  return result
})

ipcMain.handle('conversations:toggleStar', async (event, conversationId) => {
  const result = await conversationManager.toggleStarConversation(conversationId)
  broadcastToAllWindows('conversation:updated', { action: 'starred', conversationId })
  return result
})

ipcMain.handle('conversations:addMessage', async (event, conversationId, message) => {
  const result = await conversationManager.addMessage(conversationId, message)
  broadcastToAllWindows('conversation:updated', { action: 'message_added', conversationId })
  return result
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
      toggleQuickChatWindow()
    })
  }
})

// IPC Handler for hiding quick chat window
ipcMain.handle('app:hideQuickChat', async () => {
  if (quickChatWindow && !quickChatWindow.isDestroyed()) {
    // Request state save before destroying
    quickChatWindow.webContents.send('quickChat:requestStateSave')
    // Give time for state saving, then destroy
    setTimeout(() => {
      destroyQuickChatWindow()
    }, 100)
  }
})

// IPC Handlers for Quick Chat State Persistence
ipcMain.handle('quickChat:saveState', async (event, state) => {
  quickChatState = { ...quickChatState, ...state }
  return true
})

ipcMain.handle('quickChat:loadState', async () => {
  return quickChatState
})

ipcMain.handle('quickChat:clearState', async () => {
  quickChatState = {
    draftText: '',
    attachments: [],
    selectedConversationId: null,
    isNewConversation: false,
    selectedModel: null
  }
  return true
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
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    
    // Notify frontend that streaming started
    senderWindow.webContents.send('llm:streamStart', { conversationId, streamId })
    
    llmManager.streamCompletion(conversationId, provider, model, messages, (chunk) => {
      senderWindow.webContents.send('llm:streamChunk', { streamId, chunk })
    }, (error) => {
      senderWindow.webContents.send('llm:streamError', { streamId, error })
    }, (data) => {
      senderWindow.webContents.send('llm:streamEnd', { streamId, ...data })
    })
    
    return { streamId }
  } else {
    return await llmManager.getCompletion(provider, model, messages)
  }
})

ipcMain.handle('llm:cancelStream', async (event, conversationId) => {
  const cancelled = llmManager.cancelStream(conversationId)
  if (cancelled) {
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    senderWindow.webContents.send('llm:streamCancelled', { conversationId })
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
ipcMain.handle('files:selectImage', async (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(senderWindow, {
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

ipcMain.handle('files:selectAudio', async (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(senderWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'webm'] }
    ]
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    // Read file and return base64
    const filePath = result.filePaths[0]
    const fileData = await fs.readFile(filePath)
    const base64 = fileData.toString('base64')
    const ext = path.extname(filePath).slice(1).toLowerCase()
    const mimeType = `audio/${ext === 'm4a' ? 'mp4' : ext}`
    
    return {
      path: filePath,
      base64,
      mimeType
    }
  }
  
  return null
})

ipcMain.handle('files:selectFile', async (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(senderWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'] },
      { name: 'Spreadsheets', extensions: ['xls', 'xlsx', 'csv', 'ods'] },
      { name: 'Presentations', extensions: ['ppt', 'pptx', 'odp'] },
      { name: 'Code', extensions: ['js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'yml'] }
    ]
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    // Read file and return base64
    const filePath = result.filePaths[0]
    const fileData = await fs.readFile(filePath)
    const base64 = fileData.toString('base64')
    const ext = path.extname(filePath).slice(1).toLowerCase()
    
    // Determine MIME type based on extension
    let mimeType = 'application/octet-stream' // default
    const fileName = path.basename(filePath)
    
    // Common MIME types
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      'odt': 'application/vnd.oasis.opendocument.text',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'ods': 'application/vnd.oasis.opendocument.spreadsheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'odp': 'application/vnd.oasis.opendocument.presentation',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'py': 'text/x-python',
      'java': 'text/x-java-source',
      'cpp': 'text/x-c++src',
      'c': 'text/x-csrc',
      'h': 'text/x-chdr',
      'css': 'text/css',
      'html': 'text/html',
      'json': 'application/json',
      'xml': 'application/xml',
      'yaml': 'application/yaml',
      'yml': 'application/yaml'
    }
    
    if (mimeTypes[ext]) {
      mimeType = mimeTypes[ext]
    }
    
    return {
      path: filePath,
      base64,
      mimeType,
      name: fileName
    }
  }
  
  return null
})

ipcMain.handle('files:selectFileByCapabilities', async (event, capabilities) => {
  // Build file filters based on model capabilities
  const filters = []
  const extensions = []
  
  if (capabilities?.vision) {
    extensions.push('jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg')
  }
  
  if (capabilities?.audio) {
    extensions.push('mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'webm')
  }
  
  if (capabilities?.files) {
    // Add common document and code file extensions
    extensions.push(
      'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
      'xls', 'xlsx', 'csv', 'ods',
      'ppt', 'pptx', 'odp',
      'js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'yml'
    )
  }
  
  // If no capabilities, return null
  if (extensions.length === 0) {
    return null
  }
  
  // Create filter groups
  // Always show "All Supported Files" if there are any supported extensions
  if (extensions.length > 0) {
    filters.push({ name: 'All Supported Files', extensions })
  }
  
  if (capabilities?.vision) {
    filters.push({ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'] })
  }
  
  if (capabilities?.audio) {
    filters.push({ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'webm'] })
  }
  
  if (capabilities?.files) {
    filters.push(
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'] },
      { name: 'Spreadsheets', extensions: ['xls', 'xlsx', 'csv', 'ods'] },
      { name: 'Presentations', extensions: ['ppt', 'pptx', 'odp'] },
      { name: 'Code', extensions: ['js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'yml'] }
    )
  }
  
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(senderWindow, {
    properties: ['openFile'],
    filters
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    // Read file and return base64
    const filePath = result.filePaths[0]
    const fileData = await fs.readFile(filePath)
    const base64 = fileData.toString('base64')
    const ext = path.extname(filePath).slice(1).toLowerCase()
    const fileName = path.basename(filePath)
    
    // Determine MIME type based on extension
    let mimeType = 'application/octet-stream' // default
    
    // Image MIME types
    const imageMimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml'
    }
    
    // Audio MIME types
    const audioMimeTypes = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4',
      'flac': 'audio/flac',
      'webm': 'audio/webm'
    }
    
    // Document MIME types
    const documentMimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      'odt': 'application/vnd.oasis.opendocument.text',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'ods': 'application/vnd.oasis.opendocument.spreadsheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'odp': 'application/vnd.oasis.opendocument.presentation',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'py': 'text/x-python',
      'java': 'text/x-java-source',
      'cpp': 'text/x-c++src',
      'c': 'text/x-csrc',
      'h': 'text/x-chdr',
      'css': 'text/css',
      'html': 'text/html',
      'json': 'application/json',
      'xml': 'application/xml',
      'yaml': 'application/yaml',
      'yml': 'application/yaml'
    }
    
    // Try to find MIME type
    if (imageMimeTypes[ext]) {
      mimeType = imageMimeTypes[ext]
    } else if (audioMimeTypes[ext]) {
      mimeType = audioMimeTypes[ext]
    } else if (documentMimeTypes[ext]) {
      mimeType = documentMimeTypes[ext]
    }
    
    return {
      path: filePath,
      base64,
      mimeType,
      name: fileName
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

// IPC Handler for sending feedback
ipcMain.handle('app:sendFeedback', async (event, message) => {
  try {
    const { exec } = require('child_process')
    const util = require('util')
    const execAsync = util.promisify(exec)
    
    // Escape the message for shell execution
    const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, '\\n')
    
    // Use macOS mail command to send email
    const subject = 'Feedback from Open Chat User'
    const body = `User feedback:\n\n${message}`
    
    // Create mailto URL and open with default email client
    const mailtoUrl = `mailto:support@weisssolutions.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    await shell.openExternal(mailtoUrl)
    return true
  } catch (error) {
    console.error('Failed to send feedback:', error)
    throw new Error('Failed to send feedback. Please try again.')
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