export interface ModelCapabilities {
  // Input capabilities
  vision: boolean
  audio: boolean
  files: boolean
  multimodal: boolean
  
  // Output capabilities
  image: boolean
  thinking: boolean
  
  // Other capabilities
  tools: boolean
  webSearch: boolean
  
  manualOverrides?: {
    vision?: boolean
    audio?: boolean
    files?: boolean
    image?: boolean
    thinking?: boolean
    tools?: boolean
    webSearch?: boolean
  }
}

export interface Provider {
  id: string
  name: string
  endpoint: string
  models: string[]
  enabledModels: string[]
  modelCapabilities: Record<string, ModelCapabilities>
  connected: boolean
  isLocal?: boolean // For providers like Ollama that don't need API keys
  hasApiKey?: boolean // Whether an API key is stored in keychain
}

export interface ProviderPreset {
  id: string
  name: string
  endpoint: string
  description: string
  apiKeyUrl?: string
  isLocal?: boolean
}

export interface AddProviderRequest {
  name: string
  endpoint: string
  apiKey?: string
  isLocal?: boolean
}

export interface UpdateProviderRequest {
  name?: string
  endpoint?: string
  apiKey?: string
  models?: string[]
  enabledModels?: string[]
  modelCapabilities?: Record<string, ModelCapabilities>
}