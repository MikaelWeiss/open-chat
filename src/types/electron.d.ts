export interface ElectronAPI {
  platform: string
  
  conversations: {
    getAll: () => Promise<Conversation[]>
    create: (provider?: string, model?: string) => Promise<Conversation>
    delete: (conversationId: string) => Promise<boolean>
    rename: (conversationId: string, newTitle: string) => Promise<Conversation | null>
    addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message | null>
    toggleStar: (conversationId: string) => Promise<Conversation | null>
  }
  
  settings: {
    get: () => Promise<Settings>
    update: (settings: Partial<Settings>) => Promise<Settings>
    getCorruptionStatus: () => Promise<{
      corrupted: boolean
      error: string | null
      settingsPath: string
    }>
    reset: () => Promise<Settings>
    openInEditor: () => Promise<boolean>
    reload: () => Promise<{
      settings: Settings
      corruptionStatus: {
        corrupted: boolean
        error: string | null
        settingsPath: string
      }
    }>
  }
  
  llm: {
    sendMessage: (params: {
      conversationId: string
      provider: string
      model: string
      messages: Message[]
      stream: boolean
    }) => Promise<string | { streamId: string }>
    getProviders: () => Promise<Provider[]>
    fetchModels: (providerId: string) => Promise<string[]>
    calculateUsage: (params: {
      provider: string
      model: string
      messages: Message[]
    }) => Promise<{ usage: { promptTokens: number; completionTokens: number; totalTokens: number }; cost: number }>
    cancelStream: (conversationId: string) => Promise<void>
    onStreamStart: (callback: (data: { conversationId: string; streamId: string }) => void) => void
    onStreamChunk: (callback: (data: { streamId: string; chunk: string }) => void) => void
    onStreamError: (callback: (data: { streamId: string; error: Error }) => void) => void
    onStreamEnd: (callback: (data: { streamId: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number }; cost?: number }) => void) => void
    onStreamCancelled: (callback: (data: { streamId: string; error: string }) => void) => void
    removeStreamListeners: () => void
  }
  
  files: {
    selectImage: () => Promise<{
      path: string
      base64: string
      mimeType: string
    } | null>
    selectAudio: () => Promise<{
      path: string
      base64: string
      mimeType: string
    } | null>
    selectFile: () => Promise<{
      path: string
      base64: string
      mimeType: string
      name: string
    } | null>
    selectFileByCapabilities: (capabilities?: ModelCapabilities) => Promise<{
      path: string
      base64: string
      mimeType: string
      name: string
    } | null>
  }
  
  shell: {
    openExternal: (url: string) => Promise<boolean>
  }
  
  app: {
    onTriggerNewConversation: (callback: () => void) => void
    onConversationUpdated: (callback: (data: { conversationId?: string, action: string }) => void) => void
    removeAppListeners: () => void
    updateGlobalShortcut: (shortcut: string) => Promise<boolean>
    disableGlobalShortcut: () => Promise<void>
    enableGlobalShortcut: () => Promise<void>
    hideQuickChat?: () => Promise<void>
    sendFeedback: (message: string) => Promise<boolean>
  }
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  attachments?: {
    type: 'image' | 'audio' | 'file'
    path: string
    mimeType: string
  }[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost?: number
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  provider: string
  model: string
  messages: Message[]
  isTemporary?: boolean
  starred?: boolean
}

export interface ModelCapabilities {
  vision: boolean
  audio: boolean
  files: boolean
  multimodal: boolean
  description?: string | null
  contextLength?: number | null
  // Track which capabilities were manually overridden by user
  manualOverrides?: {
    vision?: boolean
    audio?: boolean
    files?: boolean
  }
}

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  defaultProvider: string
  showPricing?: boolean
  providers: {
    [key: string]: {
      apiKey: string
      endpoint: string
      models: string[]
      enabledModels?: string[]
      configured: boolean
      enabled?: boolean
      startCommand?: string
      modelCapabilities?: { [modelId: string]: ModelCapabilities }
      lastCapabilityUpdate?: string
    }
  }
  keyboard: {
    sendMessage: 'enter' | 'cmd-enter'
    newLine: string
    globalHotkey: string
  }
  mcpServers: Array<{
    id: string
    name: string
    enabled: boolean
  }>
}

export interface Provider {
  id: string
  name: string
  models: string[]
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}