export interface ElectronAPI {
  platform: string
  
  conversations: {
    getAll: () => Promise<Conversation[]>
    create: (provider?: string, model?: string) => Promise<Conversation>
    delete: (conversationId: string) => Promise<boolean>
    rename: (conversationId: string, newTitle: string) => Promise<Conversation | null>
    addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message | null>
  }
  
  settings: {
    get: () => Promise<Settings>
    update: (settings: Partial<Settings>) => Promise<Settings>
  }
  
  llm: {
    sendMessage: (params: {
      provider: string
      model: string
      messages: Message[]
      stream: boolean
    }) => Promise<string | { streamId: string }>
    getProviders: () => Promise<Provider[]>
    fetchModels: (providerId: string) => Promise<string[]>
    onStreamChunk: (callback: (data: { streamId: string; chunk: string }) => void) => void
    onStreamError: (callback: (data: { streamId: string; error: Error }) => void) => void
    onStreamEnd: (callback: (data: { streamId: string }) => void) => void
    removeStreamListeners: () => void
  }
  
  files: {
    selectImage: () => Promise<{
      path: string
      base64: string
      mimeType: string
    } | null>
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
}

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  defaultProvider: string
  providers: {
    [key: string]: {
      apiKey: string
      endpoint: string
      models: string[]
      configured: boolean
      startCommand?: string
    }
  }
  keyboard: {
    sendMessage: 'enter' | 'cmd-enter'
    newLine: string
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