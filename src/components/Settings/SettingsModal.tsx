import { X, RefreshCw, ExternalLink, Plus, Settings, ChevronDown, ChevronUp, Eye, Volume2, FileText, Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useSettingsStore, useToastStore } from '../../stores/settingsStore'
import type { ModelCapabilities } from '../../types/electron'
import AboutSettings from './AboutSettings'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ModelCapabilityIconsProps {
  capabilities?: ModelCapabilities
  className?: string
  modelId?: string
  providerId?: string
  onCapabilityToggle?: (modelId: string, providerId: string, capability: 'vision' | 'audio' | 'files', enabled: boolean) => void
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

  const handleCapabilityClick = (capability: 'vision' | 'audio' | 'files') => {
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
      title: 'Vision/Images'
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
    }
  ]

  const isClickable = modelId && providerId && onCapabilityToggle
  const hasAnyCapabilities = capabilityItems.some(item => item.enabled)
  
  return (
    <div 
      className={clsx(
        "flex items-center gap-1",
        className,
        // Show a minimum clickable area when no capabilities are visible but manual toggling is enabled
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
  const { settings, updateSettings } = useSettingsStore()
  
  // Local state for form inputs
  const [theme, setTheme] = useState('system')
  const [sendKey, setSendKey] = useState('enter')
  const [showPricing, setShowPricing] = useState(false)
  const [showConversationSettings, setShowConversationSettings] = useState(false)
  const [globalHotkey, setGlobalHotkey] = useState('')

  // Sync local state with settings store
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme || 'system')
      setSendKey(settings.keyboard?.sendMessage || 'enter')
      setShowPricing(settings.showPricing || false)
      setShowConversationSettings(settings.showConversationSettings || false)
      setGlobalHotkey(settings.keyboard?.globalHotkey ?? '')
    }
  }, [settings])

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    await updateSettings({ theme: newTheme as 'system' | 'light' | 'dark' })
  }

  const handleSendKeyChange = async (newSendKey: string) => {
    setSendKey(newSendKey)
    await updateSettings({ 
      keyboard: { 
        newLine: settings?.keyboard?.newLine || 'shift+enter',
        sendMessage: newSendKey as 'enter' | 'cmd-enter',
        globalHotkey: settings?.keyboard?.globalHotkey ?? ''
      } 
    })
  }

  const handleGlobalHotkeyChange = async (newHotkey: string) => {
    setGlobalHotkey(newHotkey)
    await updateSettings({ 
      keyboard: { 
        newLine: settings?.keyboard?.newLine || 'shift+enter',
        sendMessage: settings?.keyboard?.sendMessage || 'enter',
        globalHotkey: newHotkey
      } 
    })
  }

  const handleShowPricingChange = async (show: boolean) => {
    setShowPricing(show)
    await updateSettings({ showPricing: show })
  }

  const handleShowConversationSettingsChange = async (show: boolean) => {
    setShowConversationSettings(show)
    await updateSettings({ showConversationSettings: show })
  }
  
  if (!isOpen) return null

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'models', label: 'Models' },
    { id: 'mcp', label: 'MCP Servers' },
    { id: 'about', label: 'About' },
  ]

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border rounded-xl w-[800px] max-h-[600px] flex flex-col shadow-2xl"
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
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && <GeneralSettings theme={theme} setTheme={handleThemeChange} sendKey={sendKey} setSendKey={handleSendKeyChange} showPricing={showPricing} setShowPricing={handleShowPricingChange} showConversationSettings={showConversationSettings} setShowConversationSettings={handleShowConversationSettingsChange} globalHotkey={globalHotkey} setGlobalHotkey={handleGlobalHotkeyChange} />}
            {activeTab === 'models' && <ModelsSettings />}
            {activeTab === 'mcp' && <MCPSettings />}
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
        // Use the code for letter keys to avoid special characters like œ
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
        // Re-enable global shortcut after capture
        // @ts-ignore
        window.electronAPI?.app?.enableGlobalShortcut?.()
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

  const startCapture = async () => {
    // Temporarily disable global shortcut during capture
    // @ts-ignore
    await window.electronAPI?.app?.disableGlobalShortcut?.()
    setIsCapturing(true)
    setCapturedKeys([])
  }

  const cancelCapture = async () => {
    setIsCapturing(false)
    setCapturedKeys([])
    // Re-enable global shortcut
    // @ts-ignore
    await window.electronAPI?.app?.enableGlobalShortcut?.()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClear()
  }

  // Parse the display format similar to the image
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

function ModelsSettings() {
  const { settings, updateSettings } = useSettingsStore()
  const { addToast } = useToastStore()
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
      }, 150) // Short delay to allow for transition
    }
  }, [isSearchHovered])

  const providerPresets = [
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
      id: 'deepinfra',
      name: 'DeepInfra',
      endpoint: 'https://api.deepinfra.com/v1/openai',
      description: 'Model hosting platform',
      apiKeyUrl: 'https://deepinfra.com/dash/api_keys'
    },
    {
      id: 'fireworks',
      name: 'Fireworks AI',
      endpoint: 'https://api.fireworks.ai/inference/v1',
      description: 'Optimized inference',
      apiKeyUrl: 'https://app.fireworks.ai/settings/users/api-keys'
    },
    {
      id: 'together',
      name: 'Together AI',
      endpoint: 'https://api.together.xyz/v1',
      description: 'Open source model focus',
      apiKeyUrl: 'https://api.together.xyz/settings/api-keys'
    },
    {
      id: 'inceptionlabs',
      name: 'Inception Labs',
      endpoint: 'https://api.inceptionlabs.ai/v1',
      description: 'High-performance AI models',
      apiKeyUrl: 'https://platform.inceptionlabs.ai/dashboard/api-keys'
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
    },
    {
      id: 'llamacpp',
      name: 'llama.cpp',
      endpoint: 'http://localhost:8080/v1',
      description: 'C++ implementation, very efficient',
      isLocal: true
    }
  ]

  // Get configured models from settings
  const configuredModels: ConfiguredModel[] = []
  if (settings?.providers) {
    Object.entries(settings.providers).forEach(([providerId, provider]) => {
      if (provider.configured && provider.models) {
        const enabledModels = provider.enabledModels || provider.models.slice(0, 3)
        provider.models.forEach((modelName: string) => {
          configuredModels.push({
            id: `${providerId}-${modelName}`,
            name: modelName,
            provider: providerId,
            enabled: enabledModels.includes(modelName),
            manuallyAdded: false // TODO: track manually added models
          })
        })
      }
    })
  }

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

  const providers = Object.keys(modelsByProvider).sort()

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

  const handleAddPreset = (preset: typeof providerPresets[0]) => {
    setSelectedPreset(preset.id)
    setCustomProvider({ name: preset.name, endpoint: preset.endpoint, apiKey: '' })
  }

  const handleSaveProvider = async () => {
    const isLocalProvider = providerPresets.find(p => p.id === selectedPreset)?.isLocal
    if (!customProvider.name || !customProvider.endpoint || (!customProvider.apiKey && !isLocalProvider)) return

    try {
      const newProviders = {
        ...settings?.providers,
        [selectedPreset || customProvider.name.toLowerCase().replace(/\s+/g, '-')]: {
          apiKey: customProvider.apiKey,
          endpoint: customProvider.endpoint,
          models: [],
          enabledModels: [],
          configured: true,
          enabled: true,
          ...(isLocalProvider && { startCommand: customProvider.apiKey })
        }
      }

      await updateSettings({ providers: newProviders })

      // Auto-fetch models for the newly added provider
      const providerId = selectedPreset || customProvider.name.toLowerCase().replace(/\s+/g, '-')
      if (customProvider.apiKey || isLocalProvider) {
        try {
          await handleTestProvider(providerId)
          await window.electronAPI.llm.fetchModels(providerId)

          // After fetching models, automatically enable the first 3
          const updatedSettings = await window.electronAPI.settings.get()
          const provider = updatedSettings?.providers[providerId]

          if (provider && provider.models && provider.models.length > 0) {
            const autoEnabledModels = provider.models.slice(0, 3)
            const providersWithEnabledModels = {
              ...updatedSettings.providers,
              [providerId]: {
                ...provider,
                enabledModels: autoEnabledModels
              }
            }
            await updateSettings({ providers: providersWithEnabledModels })
          }
        } catch (error) {
          console.error('Failed to auto-test and fetch models for provider:', error)
        }
      }

      setShowAddProvider(false)
      setSelectedPreset(null)
      setCustomProvider({ name: '', endpoint: '', apiKey: '' })
    } catch (error) {
      console.error('Failed to save provider:', error)
      addToast({
        type: 'error',
        title: 'Failed to save provider',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      })
    }
  }

  const handleTestProvider = async (providerId: string) => {
    try {
      await window.electronAPI.llm.fetchModels(providerId)
      addToast({
        type: 'success',
        title: 'Connection Successful',
        message: `Successfully connected to ${providerId.replace(/-/g, ' ')}`,
        duration: 3000
      })
    } catch (error) {
      console.error('Provider test failed:', error)
      addToast({
        type: 'error',
        title: 'Connection Failed',
        message: `Failed to connect to ${providerId.replace(/-/g, ' ')}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      })
    }
  }

  const handleRefreshModels = async (providerId: string) => {
    setRefreshingProvider(providerId)
    try {
      await window.electronAPI.llm.fetchModels(providerId)
      const updatedSettings = await window.electronAPI.settings.get()

      // Set default enabled models if not already set
      const provider = updatedSettings?.providers[providerId]
      if (provider && provider.models && !provider.enabledModels) {
        const newProviders = {
          ...updatedSettings.providers,
          [providerId]: {
            ...provider,
            enabledModels: provider.models.slice(0, 3)
          }
        }
        await updateSettings({ providers: newProviders })
      } else {
        await updateSettings(updatedSettings)
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      addToast({
        type: 'error',
        title: 'Failed to Refresh Models',
        message: `Could not fetch models and capabilities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      })
    }
    finally {
      setRefreshingProvider(null)
    }
  }

  const handleCapabilityToggle = async (modelId: string, providerId: string, capability: 'vision' | 'audio' | 'files', enabled: boolean) => {
    const provider = settings?.providers[providerId]
    if (!provider?.modelCapabilities) return

    const currentCapabilities = provider.modelCapabilities[modelId]
    if (!currentCapabilities) return

    const updatedCapabilities = {
      ...currentCapabilities,
      [capability]: enabled,
      manualOverrides: {
        ...currentCapabilities.manualOverrides,
        [capability]: enabled
      }
    }

    const newProviders = {
      ...settings?.providers,
      [providerId]: {
        ...provider,
        modelCapabilities: {
          ...provider.modelCapabilities,
          [modelId]: updatedCapabilities
        }
      }
    }

    await updateSettings({ providers: newProviders })
  }

  const handleToggleModel = async (providerId: string, modelName: string, enabled: boolean) => {
    const provider = settings?.providers[providerId]
    if (!provider) return

    const currentEnabledModels = provider.enabledModels || provider.models.slice(0, 3)
    let newEnabledModels: string[]

    if (enabled) {
      newEnabledModels = [...currentEnabledModels, modelName].filter((m, i, arr) => arr.indexOf(m) === i)
    } else {
      newEnabledModels = currentEnabledModels.filter(m => m !== modelName)
    }

    const newProviders = {
      ...settings?.providers,
      [providerId]: {
        ...provider,
        enabledModels: newEnabledModels
      }
    }

    await updateSettings({ providers: newProviders })
  }

  const handleUpdateApiKey = async (providerId: string, apiKey: string) => {
    const newProviders = {
      ...settings?.providers,
      [providerId]: {
        ...settings?.providers?.[providerId],
        apiKey,
        endpoint: settings?.providers?.[providerId]?.endpoint || '',
        models: settings?.providers?.[providerId]?.models || [],
        configured: !!apiKey
      }
    }
    await updateSettings({ providers: newProviders })
  }

  const handleRemoveProvider = async (providerId: string) => {
    const newProviders = { ...settings?.providers }
    delete newProviders[providerId]
    await updateSettings({ providers: newProviders })
    setConfirmRemoveProvider(null)
    setShowApiKeyModal(null)
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
                  .filter(preset => !settings?.providers?.[preset.id]?.configured)
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
                  .filter(preset => !settings?.providers?.[preset.id]?.configured)
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
                        window.electronAPI.shell.openExternal(apiKeyUrl)
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
              className="relative flex items-center"
              onMouseEnter={() => setIsSearchHovered(true)}
              onMouseLeave={() => setIsSearchHovered(false)}
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={clsx(
                  'rounded-lg bg-secondary py-1 pl-9 pr-2 text-sm transition-all duration-300 focus:outline-none',
                  isSearchHovered || searchQuery
                    ? 'w-40 opacity-100'
                    : 'w-10 opacity-0',
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

      {providers.length === 0 && !searchQuery ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">No providers configured yet</p>
            <p className="text-sm">Add a provider to start chatting with AI</p>
          </div>
          <button
            onClick={() => setShowAddProvider(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-auto"
          >
            <Plus className="h-4 w-4" />
            Add Your First Provider
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Capability Legend */}
          <div className="p-3 bg-secondary/30 rounded-lg border border-border">
            <h4 className="text-sm font-medium mb-2">Model Capabilities</h4>
            <div className="flex flex-wrap gap-4 text-xs">
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

          {providers.map(providerId => {
            const providerModels = modelsByProvider[providerId] || []
            const isExpanded = expandedProviders.has(providerId)
            const provider = settings?.providers[providerId]
            const hasModels = provider?.models && provider.models.length > 0

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
                        <h4 className="font-medium capitalize flex items-center gap-2">
                          {providerId.replace(/-/g, ' ')}
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          {providerModels.length} model{providerModels.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRefreshModels(providerId)}
                        disabled={refreshingProvider === providerId}
                        className="p-2 hover:bg-accent rounded transition-colors disabled:opacity-50"
                        title="Refresh models and capabilities"
                      >
                        <RefreshCw className={clsx("h-4 w-4", refreshingProvider === providerId && "animate-spin")} />
                      </button>

                      <button
                        onClick={() => {
                          setShowApiKeyModal(providerId)
                          setNewApiKey(provider?.apiKey || '')
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
                      {hasModels ? (
                        providerModels.map(model => {
                          const capabilities = provider?.modelCapabilities?.[model.name]
                          return (
                            <div key={model.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded">
                              <input
                                type="checkbox"
                                checked={model.enabled}
                                onChange={(e) => handleToggleModel(providerId, model.name, e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-sm flex-1">{model.name}</span>
                              <ModelCapabilityIcons
                                capabilities={capabilities}
                                modelId={model.name}
                                providerId={providerId}
                                onCapabilityToggle={handleCapabilityToggle}
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
                        <div className="text-sm text-muted-foreground">
                          No models found. Click the refresh button to fetch models.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {providers.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Search className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">No models found for "{searchQuery}"</p>
                <p className="text-sm">Try a different search term.</p>
              </div>
            </div>
          )}
        </div>
      )}

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
                    onClick={() => window.electronAPI.shell.openExternal(preset.apiKeyUrl)}
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
                      await handleUpdateApiKey(showApiKeyModal, newApiKey)
                      await handleRefreshModels(showApiKeyModal)
                      setShowApiKeyModal(null)
                      setNewApiKey('')
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

function MCPSettings() {
  const [servers] = useState([
    { id: 'filesystem', name: 'Filesystem', enabled: true },
    { id: 'github', name: 'GitHub', enabled: false },
    { id: 'google-drive', name: 'Google Drive', enabled: false },
  ])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">MCP Servers</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Model Context Protocol servers extend your AI's capabilities with tools and resources.
        </p>
        
        <div className="space-y-3">
          {servers.map((server) => (
            <div
              key={server.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div>
                <h4 className="font-medium">{server.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {server.id === 'filesystem' && 'Access local files and directories'}
                  {server.id === 'github' && 'Interact with GitHub repositories'}
                  {server.id === 'google-drive' && 'Access Google Drive files'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={server.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>

        <button className="mt-4 px-4 py-2 bg-secondary hover:bg-accent rounded-lg transition-colors">
          Add MCP Server
        </button>
      </div>
    </div>
  )
}