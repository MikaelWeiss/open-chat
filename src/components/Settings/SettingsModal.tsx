import { X, RefreshCw, ExternalLink, Plus, Settings, ChevronDown, ChevronUp, Eye, Volume2, FileText, Search, Brain, Hammer, ImageIcon, Headphones, Globe } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import AboutSettings from './AboutSettings'
import { useSettings } from '../../hooks/useSettings'
import { Provider, ProviderPreset } from '../../types/provider'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ModelCapabilities {
  vision: boolean
  audio: boolean
  files: boolean
  multimodal: boolean
  manualOverrides?: {
    vision?: boolean
    audio?: boolean
    files?: boolean
  }
}

interface ModelCapabilityIconsProps {
  capabilities?: ModelCapabilities
  className?: string
  modelId?: string
  providerId?: string
  onCapabilityToggle?: (modelId: string, providerId: string, capability: 'vision' | 'audio' | 'files' | 'image' | 'thinking' | 'tools' | 'webSearch', enabled: boolean) => void
}

function ModelCapabilityIcons({ 
  capabilities, 
  className = '', 
  modelId, 
  providerId, 
  onCapabilityToggle 
}: ModelCapabilityIconsProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  if (!capabilities) return null

  const handleCapabilityClick = (capability: 'vision' | 'audio' | 'files' | 'image' | 'thinking' | 'tools' | 'webSearch') => {
    if (modelId && providerId && onCapabilityToggle) {
      const currentValue = capabilities[capability]
      onCapabilityToggle(modelId, providerId, capability, !currentValue)
    }
  }

  const capabilityItems = [
    {
      key: 'vision' as const,
      icon: Eye,
      enabled: capabilities.vision,
      color: 'text-blue-500 dark:text-blue-400',
      grayColor: 'text-gray-400 dark:text-gray-600',
      title: 'Vision/Images Input'
    },
    {
      key: 'audio' as const,
      icon: Volume2,
      enabled: capabilities.audio,
      color: 'text-green-500 dark:text-green-400',
      grayColor: 'text-gray-400 dark:text-gray-600',
      title: 'Audio Input'
    },
    {
      key: 'files' as const,
      icon: FileText,
      enabled: capabilities.files,
      color: 'text-orange-500 dark:text-orange-400',
      grayColor: 'text-gray-400 dark:text-gray-600',
      title: 'File Input'
    },
    {
      key: 'image' as const,
      icon: ImageIcon,
      enabled: capabilities.image,
      color: 'text-pink-500 dark:text-pink-400',
      grayColor: 'text-gray-400 dark:text-gray-600',
      title: 'Image Output'
    },
    {
      key: 'thinking' as const,
      icon: Brain,
      enabled: capabilities.thinking,
      color: 'text-purple-500 dark:text-purple-400',
      grayColor: 'text-gray-400 dark:text-gray-600',
      title: 'Reasoning/Thinking'
    },
    {
      key: 'tools' as const,
      icon: Hammer,
      enabled: capabilities.tools,
      color: 'text-yellow-500 dark:text-yellow-400',
      grayColor: 'text-gray-400 dark:text-gray-600',
      title: 'Function Calling/Tools'
    },
    {
      key: 'webSearch' as const,
      icon: Globe,
      enabled: capabilities.webSearch,
      color: 'text-cyan-500 dark:text-cyan-400',
      grayColor: 'text-gray-400 dark:text-gray-600',
      title: 'Web Search'
    }
  ]

  const isClickable = modelId && providerId && onCapabilityToggle
  const hasAnyCapabilities = capabilityItems.some(item => item.enabled)
  
  return (
    <div 
      className={clsx(
        "flex items-center gap-1",
        className,
        !hasAnyCapabilities && isClickable && "min-w-[16px] min-h-[16px] border border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-gray-400 dark:hover:border-gray-500"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={!hasAnyCapabilities && isClickable ? "Click to add capabilities" : undefined}
    >
      {capabilityItems.map(({ key, icon: Icon, enabled, color, grayColor, title }) => {
        const shouldShow = enabled || isHovered
        const isManualOverride = capabilities.manualOverrides?.[key] !== undefined
        
        if (!shouldShow) return null
        
        return (
          <div
            key={key}
            className={clsx(
              "w-4 h-4 transition-colors",
              enabled ? color : grayColor,
              isClickable && "cursor-pointer hover:scale-110"
            )}
            title={`${title}${isManualOverride ? ' (manually set)' : ''}${isClickable ? ' - Click to toggle' : ''}`}
            onClick={() => isClickable && handleCapabilityClick(key)}
          >
            <Icon className="w-4 h-4" />
          </div>
        )
      })}
    </div>
  )
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general')
  const {
    theme,
    sendKey,
    globalHotkey,
    showPricing,
    showConversationSettings,
    providers,
    handleThemeChange,
    handleSendKeyChange,
    handleGlobalHotkeyChange,
    handleShowPricingChange,
    handleShowConversationSettingsChange,
    handleToggleModel,
    handleCapabilityToggle,
    addProvider,
    updateProvider,
    removeProvider,
    refreshProviderModels,
  } = useSettings()
  
  if (!isOpen) return null

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'models', label: 'Models' },
    { id: 'about', label: 'About' },
  ]

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border rounded-xl w-[800px] h-[600px] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-border p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-lg transition-colors',
                  activeTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0">
            {activeTab === 'general' && <GeneralSettings theme={theme} setTheme={handleThemeChange} sendKey={sendKey} setSendKey={handleSendKeyChange} showPricing={showPricing} setShowPricing={handleShowPricingChange} showConversationSettings={showConversationSettings} setShowConversationSettings={handleShowConversationSettingsChange} globalHotkey={globalHotkey} setGlobalHotkey={handleGlobalHotkeyChange} />}
            {activeTab === 'models' && <ModelsSettings providers={providers} onToggleModel={handleToggleModel} onCapabilityToggle={handleCapabilityToggle} onAddProvider={async (name, endpoint, apiKey, isLocal) => await addProvider({ name, endpoint, apiKey, isLocal })} onUpdateProvider={async (providerId, updates) => await updateProvider(providerId, updates)} onRemoveProvider={removeProvider} onRefreshModels={refreshProviderModels} />}
            {activeTab === 'about' && <AboutSettings />}
          </div>
        </div>
      </div>
    </div>
  )
}

function HotkeyCapture({ value, onChange, onClear }: { value: string, onChange: (hotkey: string) => void, onClear: () => void }) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedKeys, setCapturedKeys] = useState<string[]>([])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isCapturing) return
    
    e.preventDefault()
    e.stopPropagation()

    const keys = []
    if (e.ctrlKey) keys.push('Control')
    if (e.metaKey) keys.push('Command')
    if (e.altKey) keys.push('Alt')
    if (e.shiftKey) keys.push('Shift')
    
    // Add the main key if it's not a modifier
    if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      if (e.key === ' ') {
        keys.push('Space')
      } else if (e.code.startsWith('Key')) {
        keys.push(e.code.replace('Key', ''))
      } else if (e.key.length === 1) {
        keys.push(e.key.toUpperCase())
      } else {
        keys.push(e.key)
      }
    }

    if (keys.length > 0) {
      setCapturedKeys(keys)
      
      // Auto-save if we have at least one modifier + one key
      const modifiers = keys.filter(k => ['Control', 'Command', 'Alt', 'Shift'].includes(k))
      const nonModifiers = keys.filter(k => !['Control', 'Command', 'Alt', 'Shift'].includes(k))
      
      if (modifiers.length > 0 && nonModifiers.length > 0) {
        const hotkey = keys.join('+')
        onChange(hotkey)
        setIsCapturing(false)
        setCapturedKeys([])
      }
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!isCapturing) return
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    if (isCapturing) {
      document.addEventListener('keydown', handleKeyDown, true)
      document.addEventListener('keyup', handleKeyUp, true)
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true)
        document.removeEventListener('keyup', handleKeyUp, true)
      }
    }
  }, [isCapturing])

  const startCapture = () => {
    setIsCapturing(true)
    setCapturedKeys([])
  }

  const cancelCapture = () => {
    setIsCapturing(false)
    setCapturedKeys([])
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClear()
  }

  // Parse the display format
  const parseDisplayKeys = (hotkey: string) => {
    if (!hotkey || !hotkey.trim()) return 'Not set'
    
    return hotkey.split('+').map(key => {
      switch (key.toLowerCase()) {
        case 'control':
        case 'ctrl':
          return '^'
        case 'command':
        case 'cmd':
          return '⌘'
        case 'alt':
          return '⌥'
        case 'shift':
          return '⇧'
        case 'space':
          return 'Space'
        default:
          return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
      }
    }).join(' ')
  }

  const displayValue = parseDisplayKeys(value)
  const isCleared = !value || !value.trim()

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={startCapture}
        disabled={isCapturing}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all min-w-[120px]",
          isCapturing 
            ? "bg-orange-500/10 border-orange-500 text-orange-600" 
            : isCleared
            ? "bg-secondary border-border text-muted-foreground hover:bg-accent"
            : "bg-secondary border-orange-500 text-foreground hover:bg-accent"
        )}
      >
        {isCapturing ? (
          <span className="text-orange-600 text-sm">
            {capturedKeys.length > 0 ? capturedKeys.join(' + ') : 'Press keys...'}
          </span>
        ) : (
          <>
            <span className="text-sm font-mono">
              {displayValue}
            </span>
            {!isCleared && (
              <X 
                className="h-3 w-3 text-red-500 hover:text-red-600 cursor-pointer" 
                onClick={handleClear}
              />
            )}
          </>
        )}
      </button>
      
      {isCapturing && (
        <button
          onClick={cancelCapture}
          className="px-3 py-1 text-sm bg-secondary hover:bg-accent rounded-lg transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  )
}

function GeneralSettings({ theme, setTheme, sendKey, setSendKey, showPricing, setShowPricing, showConversationSettings, setShowConversationSettings, globalHotkey, setGlobalHotkey }: any) {

  const handleClearHotkey = () => {
    setGlobalHotkey('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Usage & Pricing</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="showPricing"
              checked={showPricing}
              onChange={(e) => setShowPricing(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="showPricing" className="text-sm font-medium cursor-pointer">
                Show pricing information
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Display estimated costs for API usage. Note: Pricing estimates are approximate and may not reflect actual costs. 
                Actual billing depends on your provider's pricing structure and may vary.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Advanced Settings</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="showConversationSettings"
              checked={showConversationSettings}
              onChange={(e) => setShowConversationSettings(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="showConversationSettings" className="text-sm font-medium cursor-pointer">
                Show conversation settings
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Display a settings icon next to the message input to access advanced conversation options like temperature, system prompt, and other model parameters.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Keyboard Shortcuts</h3>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium">Global Hotkey</label>
              <p className="text-xs text-muted-foreground mt-1">
                System-wide hotkey to open app and start new chat. Click to set, use X to clear.
              </p>
            </div>
            <div className="ml-4">
              <HotkeyCapture
                value={globalHotkey}
                onChange={setGlobalHotkey}
                onClear={handleClearHotkey}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Send Message</label>
            <select
              value={sendKey}
              onChange={(e) => setSendKey(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="enter">Enter</option>
              <option value="cmd-enter">Cmd/Ctrl + Enter</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {sendKey === 'enter' ? 'Shift+Enter for new line' : 'Enter for new line'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ConfiguredModel {
  id: string
  name: string
  provider: string
  enabled: boolean
  manuallyAdded: boolean
}

interface ModelsSettingsProps {
  providers: Record<string, Provider>
  onToggleModel: (providerId: string, modelName: string, enabled: boolean) => void
  onCapabilityToggle: (modelId: string, providerId: string, capability: 'vision' | 'audio' | 'files' | 'image' | 'thinking' | 'tools' | 'webSearch', enabled: boolean) => void
  onAddProvider: (name: string, endpoint: string, apiKey?: string, isLocal?: boolean) => Promise<void>
  onUpdateProvider: (providerId: string, updates: { apiKey?: string }) => Promise<void>
  onRemoveProvider: (providerId: string) => Promise<void>
  onRefreshModels: (providerId: string) => Promise<void>
}

function ModelsSettings({ providers: providersData, onToggleModel, onCapabilityToggle, onAddProvider, onUpdateProvider, onRemoveProvider, onRefreshModels }: ModelsSettingsProps) {
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set())
  const [showApiKeyModal, setShowApiKeyModal] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState('')
  const [refreshingProvider, setRefreshingProvider] = useState<string | null>(null)
  const [confirmRemoveProvider, setConfirmRemoveProvider] = useState<string | null>(null)
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [customProvider, setCustomProvider] = useState({ name: '', endpoint: '', apiKey: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchHovered, setIsSearchHovered] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchHovered) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 150)
    }
  }, [isSearchHovered])

  // Add keyboard shortcut for search (Cmd+F or Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault()
        setIsSearchHovered(true)
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const providerPresets: ProviderPreset[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1',
      description: 'GPT-4, GPT-3.5, and other OpenAI models',
      apiKeyUrl: 'https://platform.openai.com/api-keys'
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      endpoint: 'https://api.anthropic.com/v1',
      description: 'Claude 3.5 Sonnet, Claude 3 Opus, and other Claude models',
      apiKeyUrl: 'https://console.anthropic.com/settings/keys'
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      endpoint: 'https://openrouter.ai/api/v1',
      description: 'Access to 400+ models with rich metadata',
      apiKeyUrl: 'https://openrouter.ai/keys'
    },
    {
      id: 'groq',
      name: 'Groq',
      endpoint: 'https://api.groq.com/openai/v1',
      description: 'Fast inference for Llama, Mixtral models',
      apiKeyUrl: 'https://console.groq.com/keys'
    },
    {
      id: 'xai',
      name: 'xAI (Grok)',
      endpoint: 'https://api.x.ai/v1',
      description: 'Fully OpenAI/Anthropic compatible',
      apiKeyUrl: 'https://console.x.ai/team/api-keys'
    },
    {
      id: 'google-gemini',
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
      description: 'Native multimodal capabilities',
      apiKeyUrl: 'https://aistudio.google.com/app/apikey'
    },
    {
      id: 'ollama',
      name: 'Ollama',
      endpoint: 'http://localhost:11434/v1',
      description: 'User-friendly local LLM runner',
      isLocal: true
    },
    {
      id: 'vllm',
      name: 'vLLM',
      endpoint: 'http://localhost:8000/v1',
      description: 'High-performance inference server',
      isLocal: true
    }
  ]

  // Generate configured models from providers data
  const configuredModels: ConfiguredModel[] = Object.entries(providersData).flatMap(([providerId, provider]) =>
    provider.models.map(modelName => ({
      id: `${providerId}-${modelName}`,
      name: modelName,
      provider: providerId,
      enabled: provider.enabledModels.includes(modelName),
      manuallyAdded: false
    }))
  )

  const filteredModels = configuredModels.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const modelsByProvider = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {} as Record<string, ConfiguredModel[]>)

  // If no search query, show all providers (even those without models)
  // If searching, only show providers that have matching models
  const providers = searchQuery 
    ? Object.keys(modelsByProvider).sort()
    : Object.keys(providersData).sort()

  const toggleProviderExpansion = (providerId: string) => {
    setExpandedProviders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(providerId)) {
        newSet.delete(providerId)
      } else {
        newSet.add(providerId)
      }
      return newSet
    })
  }

  const handleAddPreset = (preset: ProviderPreset) => {
    setSelectedPreset(preset.id)
    setCustomProvider({ name: preset.name, endpoint: preset.endpoint, apiKey: '' })
  }

  const handleSaveProvider = async () => {
    const isLocalProvider = providerPresets.find(p => p.id === selectedPreset)?.isLocal
    if (!customProvider.name || !customProvider.endpoint || (!customProvider.apiKey && !isLocalProvider)) return

    try {
      await onAddProvider(
        customProvider.name,
        customProvider.endpoint,
        customProvider.apiKey || undefined,
        isLocalProvider
      )

      // Show success toast
      // @ts-ignore
      if (window.showToast) {
        // @ts-ignore
        window.showToast({
          type: 'success',
          title: 'Provider Added',
          message: `${customProvider.name} has been successfully configured.`,
          duration: 3000
        })
      }

      setShowAddProvider(false)
      setSelectedPreset(null)
      setCustomProvider({ name: '', endpoint: '', apiKey: '' })
    } catch (error) {
      console.error('Failed to save provider:', error)
      // @ts-ignore
      if (window.showToast) {
        // @ts-ignore
        window.showToast({
          type: 'error',
          title: 'Failed to Add Provider',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          duration: 5000
        })
      }
    }
  }

  const handleRefreshModels = async (providerId: string) => {
    setRefreshingProvider(providerId)
    try {
      await onRefreshModels(providerId)
      
      // @ts-ignore
      if (window.showToast) {
        // @ts-ignore
        window.showToast({
          type: 'success',
          title: 'Models Refreshed',
          message: `Successfully updated models for ${providersData[providerId]?.name || providerId}.`,
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Failed to refresh models:', error)
      // @ts-ignore
      if (window.showToast) {
        // @ts-ignore
        window.showToast({
          type: 'error',
          title: 'Failed to Refresh Models',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          duration: 5000
        })
      }
    } finally {
      setRefreshingProvider(null)
    }
  }

  const handleUpdateApiKey = async (providerId: string, apiKey: string) => {
    try {
      await onUpdateProvider(providerId, { apiKey })
      console.log('Updated API key for:', providerId, apiKey ? '[REDACTED]' : '[EMPTY]')
    } catch (error) {
      console.error('Failed to update API key:', error)
      throw error
    }
  }

  const handleRemoveProvider = async (providerId: string) => {
    try {
      await onRemoveProvider(providerId)
      console.log('Removed provider:', providerId)
      
      // @ts-ignore
      if (window.showToast) {
        // @ts-ignore
        window.showToast({
          type: 'success',
          title: 'Provider Removed',
          message: `Provider has been successfully removed.`,
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Failed to remove provider:', error)
      // @ts-ignore
      if (window.showToast) {
        // @ts-ignore
        window.showToast({
          type: 'error',
          title: 'Failed to Remove Provider',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          duration: 5000
        })
      }
    } finally {
      setConfirmRemoveProvider(null)
      setShowApiKeyModal(null)
    }
  }

  if (showAddProvider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Add Provider</h3>
          <button
            onClick={() => {
              setShowAddProvider(false)
              setSelectedPreset(null)
              setCustomProvider({ name: '', endpoint: '', apiKey: '' })
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>

        {!selectedPreset ? (
          <div className="space-y-6">
            <h4 className="font-medium">Choose a preset or add custom</h4>

            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">Cloud Providers (API Key Required)</h5>
              <div className="grid gap-3">
                {providerPresets
                  .filter(preset => !preset.isLocal)
                  .filter(preset => !providersData[preset.id])
                  .map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAddPreset(preset)}
                    className="text-left p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-muted-foreground">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">Local Providers (No API Key)</h5>
              <div className="grid gap-3">
                {providerPresets
                  .filter(preset => preset.isLocal)
                  .filter(preset => !providersData[preset.id])
                  .map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAddPreset(preset)}
                    className="text-left p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-muted-foreground">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">Custom</h5>
              <div className="grid gap-3">
                <button
                  onClick={() => {
                    setSelectedPreset('custom')
                    setCustomProvider({ name: '', endpoint: '', apiKey: '' })
                  }}
                  className="text-left p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="font-medium">Custom Provider</div>
                  <div className="text-sm text-muted-foreground">Add a custom OpenAI-compatible endpoint</div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-medium">
              Configure {selectedPreset === 'custom' ? 'Custom Provider' : customProvider.name}
            </h4>

            {selectedPreset === 'custom' && (
              <div>
                <label className="text-sm font-medium">Provider Name</label>
                <input
                  type="text"
                  value={customProvider.name}
                  onChange={(e) => setCustomProvider({ ...customProvider, name: e.target.value })}
                  placeholder="My Custom Provider"
                  className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Endpoint URL</label>
              <input
                type="url"
                value={customProvider.endpoint}
                onChange={(e) => setCustomProvider({ ...customProvider, endpoint: e.target.value })}
                placeholder="https://api.example.com/v1"
                className={`w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  customProvider.endpoint && !customProvider.endpoint.startsWith('http')
                    ? 'border border-red-500'
                    : ''
                }`}
              />
              {customProvider.endpoint && !customProvider.endpoint.startsWith('http') && (
                <p className="text-xs text-red-500 mt-1">URL must start with http:// or https://</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {providerPresets.find(p => p.id === selectedPreset)?.isLocal ? 'API Key (optional for local)' : 'API Key'}
                </label>
                {selectedPreset && selectedPreset !== 'custom' && !providerPresets.find(p => p.id === selectedPreset)?.isLocal && (
                  <button
                    onClick={() => {
                      const apiKeyUrl = providerPresets.find(p => p.id === selectedPreset)?.apiKeyUrl
                      if (apiKeyUrl) {
                        console.log('Open external URL:', apiKeyUrl)
                        window.open(apiKeyUrl, '_blank')
                      }
                    }}
                    className="text-xs text-primary hover:underline focus:outline-none"
                  >
                    Get API Key →
                  </button>
                )}
              </div>
              <input
                type="password"
                value={customProvider.apiKey}
                onChange={(e) => setCustomProvider({ ...customProvider, apiKey: e.target.value })}
                placeholder={providerPresets.find(p => p.id === selectedPreset)?.isLocal ? 'leave empty for local' : 'sk-...'}
                className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={handleSaveProvider}
              disabled={
                !customProvider.name ||
                !customProvider.endpoint ||
                !customProvider.endpoint.startsWith('http') ||
                (!customProvider.apiKey && !providerPresets.find(p => p.id === selectedPreset)?.isLocal)
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Provider
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">Models</h3>
            <div
              className="flex items-center gap-1"
              onMouseEnter={() => setIsSearchHovered(true)}
              onMouseLeave={() => setIsSearchHovered(false)}
            >
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={clsx(
                  'rounded-lg bg-secondary py-1 px-2 text-sm transition-all duration-300 focus:outline-none',
                  isSearchHovered || searchQuery
                    ? 'w-32 opacity-100'
                    : 'w-0 opacity-0',
                )}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your AI models and providers
          </p>
        </div>
        <button
          onClick={() => setShowAddProvider(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </button>
      </div>

      <div className="space-y-4">
        {/* Capability Legend */}
        <div className="p-3 bg-secondary/30 rounded-lg border border-border">
          <h4 className="text-sm font-medium mb-2">Model Capabilities</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h5 className="text-xs font-medium mb-2 text-muted-foreground">Input</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-blue-500" />
                  <span>Vision</span>
                </div>
                <div className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-green-500" />
                  <span>Audio</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-orange-500" />
                  <span>Files</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-medium mb-2 text-muted-foreground">Output</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-pink-500" />
                  <span>Images</span>
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3 text-purple-500" />
                  <span>Reasoning</span>
                </div>
                <div className="flex items-center gap-1">
                  <Hammer className="w-3 h-3 text-yellow-500" />
                  <span>Tools</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-500" />
                  <span>Web Search</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {providers.map(providerId => {
          const providerModels = modelsByProvider[providerId] || []
          const providerData = providersData[providerId]
          const isExpanded = expandedProviders.has(providerId)

          return (
            <div key={providerId} className="border border-border rounded-lg">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleProviderExpansion(providerId)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {providerData?.name || providerId.replace(/-/g, ' ')}
                        <div className={`w-2 h-2 rounded-full ${providerData?.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {providerModels.length} model{providerModels.length !== 1 ? 's' : ''}
                        {providerData?.hasApiKey && <span className="ml-2">• API Key Stored</span>}
                        {providerData?.isLocal && <span className="ml-2">• Local</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRefreshModels(providerId)}
                      disabled={refreshingProvider === providerId}
                      className="p-2 hover:bg-accent rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh models and capabilities"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshingProvider === providerId ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                      onClick={() => {
                        setShowApiKeyModal(providerId)
                        setNewApiKey('')
                      }}
                      className="p-2 hover:bg-accent rounded transition-colors"
                      title="Manage API key"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pl-8 space-y-2">
                    {providerModels.length > 0 ? (
                      providerModels.map(model => {
                        const capabilities = providersData[providerId]?.modelCapabilities?.[model.name]
                        return (
                          <div key={model.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded">
                            <input
                              type="checkbox"
                              checked={model.enabled}
                              onChange={(e) => onToggleModel(providerId, model.name, e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm flex-1">{model.name}</span>
                            <ModelCapabilityIcons
                              capabilities={capabilities}
                              modelId={model.name}
                              providerId={providerId}
                              onCapabilityToggle={onCapabilityToggle}
                            />
                            {model.manuallyAdded && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded">
                                Manual
                              </span>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-3 text-center text-sm text-muted-foreground bg-secondary/30 rounded">
                        No models available. Click the refresh button to fetch models from this provider.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* API Key Management Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Manage API Key - {showApiKeyModal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <button
                onClick={() => {
                  setShowApiKeyModal(null)
                  setNewApiKey('')
                }}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const preset = providerPresets.find(p => p.id === showApiKeyModal)
              return preset && preset.apiKeyUrl && !preset.isLocal && (
                <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Need an API key? Get one from the provider:
                  </p>
                  <button
                    onClick={() => {
                      if (preset.apiKeyUrl) {
                        console.log('Open external URL:', preset.apiKeyUrl)
                        window.open(preset.apiKeyUrl, '_blank')
                      }
                    }}
                    className="text-sm text-primary hover:underline focus:outline-none flex items-center gap-1">
                    Visit {preset.name} API Keys <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )
            })()}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">API Key</label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder={
                    providerPresets.find(p => p.id === showApiKeyModal)?.isLocal
                      ? 'Optional for local providers'
                      : 'Enter your API key'
                  }
                  className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {showApiKeyModal === 'openrouter' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    OpenRouter API key is optional but recommended for higher rate limits
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setConfirmRemoveProvider(showApiKeyModal)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                >
                  Remove Provider
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowApiKeyModal(null)
                      setNewApiKey('')
                    }}
                    className="px-4 py-2 bg-secondary hover:bg-accent rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await handleUpdateApiKey(showApiKeyModal, newApiKey)
                        handleRefreshModels(showApiKeyModal)
                        setShowApiKeyModal(null)
                        setNewApiKey('')
                        
                        // @ts-ignore
                        if (window.showToast) {
                          // @ts-ignore
                          window.showToast({
                            type: 'success',
                            title: 'API Key Updated',
                            message: 'API key has been successfully updated.',
                            duration: 3000
                          })
                        }
                      } catch (error) {
                        console.error('Failed to update API key:', error)
                        // @ts-ignore
                        if (window.showToast) {
                          // @ts-ignore
                          window.showToast({
                            type: 'error',
                            title: 'Failed to Update API Key',
                            message: error instanceof Error ? error.message : 'An unknown error occurred',
                            duration: 5000
                          })
                        }
                      }
                    }}
                    disabled={refreshingProvider === showApiKeyModal}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {refreshingProvider === showApiKeyModal && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Save & Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Provider Confirmation Modal */}
      {confirmRemoveProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Remove Provider
              </h3>
              <button
                onClick={() => setConfirmRemoveProvider(null)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to remove <span className="font-medium text-foreground capitalize">{confirmRemoveProvider.replace(/-/g, ' ')}</span>?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmRemoveProvider(null)}
                  className="px-4 py-2 bg-secondary hover:bg-accent rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveProvider(confirmRemoveProvider)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Remove Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

