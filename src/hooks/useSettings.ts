import { useState, useEffect } from 'react'
import { settings, SETTINGS_KEYS } from '../shared/settingsStore'
import { saveApiKey, getApiKey, deleteApiKey, hasApiKey } from '../utils/secureStorage'
import { Provider, AddProviderRequest, UpdateProviderRequest } from '../types/provider'
import { applyTheme, setupSystemThemeListener } from '../shared/theme'
import { modelsService } from '../services/modelsService'

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  sendMessage: 'enter' | 'cmd-enter'
  globalHotkey: string
  showPricing: boolean
  showConversationSettings: boolean
  providers: Record<string, Provider>
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  sendMessage: 'enter',
  globalHotkey: '',
  showPricing: false,
  showConversationSettings: false,
  providers: {}
}

export function useSettings() {
  const [settings_state, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Apply theme when settings finish loading and set up system listener
  useEffect(() => {
    if (!isLoading && settings_state.theme) {
      applyTheme(settings_state.theme)
      
      // Set up system theme listener for system theme mode
      const cleanup = setupSystemThemeListener(settings_state.theme)
      return cleanup || undefined
    }
  }, [isLoading, settings_state.theme])

  // Check API keys on mount and when providers change
  useEffect(() => {
    if (!isLoading && Object.keys(settings_state.providers).length > 0) {
      checkProviderApiKeys()
    }
  }, [isLoading, Object.keys(settings_state.providers).length])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const loadedSettings: Partial<AppSettings> = {}
      
      // Load each setting individually
      for (const settingKey of Object.values(SETTINGS_KEYS)) {
        const value = await settings.get(settingKey)
        if (value !== null) {
          (loadedSettings as any)[settingKey] = value
        }
      }

      setSettings(prev => ({ ...prev, ...loadedSettings }))
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    try {
      await settings.set(key, value)
      setSettings(prev => {
        const newSettings = { ...prev, [key]: value }
        
        // Apply theme immediately when it changes
        if (key === 'theme') {
          applyTheme(value as string)
        }
        
        return newSettings
      })
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error)
      throw error
    }
  }

  const resetSettings = async () => {
    try {
      await settings.clear()
      setSettings(DEFAULT_SETTINGS)
    } catch (error) {
      console.error('Failed to reset settings:', error)
      throw error
    }
  }

  const getSetting = <K extends keyof AppSettings>(key: K): AppSettings[K] => {
    return settings_state[key]
  }

  const updateProviderSetting = async (providerId: string, providerData: AppSettings['providers'][string]) => {
    const newProviders = { ...settings_state.providers, [providerId]: providerData }
    await updateSetting('providers', newProviders)
  }

  // Direct handlers for SettingsModal compatibility
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    await updateSetting('theme', newTheme)
  }

  const handleSendKeyChange = async (newSendKey: 'enter' | 'cmd-enter') => {
    await updateSetting('sendMessage', newSendKey)
  }

  const handleGlobalHotkeyChange = async (newHotkey: string) => {
    await updateSetting('globalHotkey', newHotkey)
  }

  const handleShowPricingChange = async (show: boolean) => {
    await updateSetting('showPricing', show)
  }

  const handleShowConversationSettingsChange = async (show: boolean) => {
    await updateSetting('showConversationSettings', show)
  }

  const handleToggleModel = async (providerId: string, modelName: string, enabled: boolean) => {
    const provider = settings_state.providers[providerId]
    if (!provider) return

    const enabledModels = enabled
      ? [...provider.enabledModels, modelName]
      : provider.enabledModels.filter(m => m !== modelName)

    await updateProviderSetting(providerId, {
      ...provider,
      enabledModels
    })
  }

  const handleCapabilityToggle = async (
    modelId: string,
    providerId: string,
    capability: 'vision' | 'audio' | 'files' | 'image' | 'thinking' | 'tools' | 'webSearch',
    enabled: boolean
  ) => {
    const provider = settings_state.providers[providerId]
    if (!provider) return

    const modelCapabilities = {
      ...provider.modelCapabilities,
      [modelId]: {
        ...provider.modelCapabilities[modelId],
        [capability]: enabled
      }
    }

    await updateProviderSetting(providerId, {
      ...provider,
      modelCapabilities
    })
  }

  const addProvider = async (request: AddProviderRequest): Promise<void> => {
    try {
      const providerId = request.name.toLowerCase().replace(/\s+/g, '-')
      
      // Save API key to keychain if provided
      if (request.apiKey && !request.isLocal) {
        await saveApiKey(providerId, request.apiKey)
      }

      // Create provider object
      const provider: Provider = {
        id: providerId,
        name: request.name,
        endpoint: request.endpoint,
        models: [],
        enabledModels: [],
        modelCapabilities: {},
        connected: false,
        isLocal: request.isLocal || false,
        hasApiKey: !!request.apiKey && !request.isLocal
      }

      // Save provider to settings
      await updateProviderSetting(providerId, provider)

      // Automatically fetch models for the new provider
      try {
        await refreshProviderModels(providerId)
      } catch (error) {
        // Don't fail the provider creation if model fetching fails
        console.warn(`Failed to fetch models for new provider ${providerId}:`, error)
      }
    } catch (error) {
      console.error('Failed to add provider:', error)
      throw error
    }
  }

  const updateProvider = async (providerId: string, request: UpdateProviderRequest): Promise<void> => {
    try {
      const provider = settings_state.providers[providerId]
      if (!provider) throw new Error('Provider not found')

      // Update API key if provided
      if (request.apiKey !== undefined) {
        if (request.apiKey && !provider.isLocal) {
          await saveApiKey(providerId, request.apiKey)
        } else if (!request.apiKey && !provider.isLocal) {
          await deleteApiKey(providerId)
        }
      }

      // Update provider object
      const updatedProvider: Provider = {
        ...provider,
        ...(request.name && { name: request.name }),
        ...(request.endpoint && { endpoint: request.endpoint }),
        ...(request.models && { models: request.models }),
        ...(request.enabledModels && { enabledModels: request.enabledModels }),
        ...(request.modelCapabilities && { modelCapabilities: request.modelCapabilities }),
        ...(request.apiKey !== undefined && { hasApiKey: !!request.apiKey && !provider.isLocal })
      }

      await updateProviderSetting(providerId, updatedProvider)
    } catch (error) {
      console.error('Failed to update provider:', error)
      throw error
    }
  }

  const removeProvider = async (providerId: string): Promise<void> => {
    try {
      const provider = settings_state.providers[providerId]
      if (!provider) return

      // Delete API key from keychain
      if (provider.hasApiKey) {
        await deleteApiKey(providerId)
      }

      // Remove provider from settings
      const newProviders = { ...settings_state.providers }
      delete newProviders[providerId]
      await updateSetting('providers', newProviders)
    } catch (error) {
      console.error('Failed to remove provider:', error)
      throw error
    }
  }

  const updateProviderApiKey = async (providerId: string, apiKey: string): Promise<void> => {
    try {
      const provider = settings_state.providers[providerId]
      if (!provider) throw new Error('Provider not found')

      if (provider.isLocal) {
        throw new Error('Local providers do not use API keys')
      }

      if (apiKey) {
        await saveApiKey(providerId, apiKey)
      } else {
        await deleteApiKey(providerId)
      }

      // Update provider hasApiKey flag
      await updateProviderSetting(providerId, {
        ...provider,
        hasApiKey: !!apiKey
      })
    } catch (error) {
      console.error('Failed to update provider API key:', error)
      throw error
    }
  }

  const getProviderApiKey = async (providerId: string): Promise<string | null> => {
    try {
      const provider = settings_state.providers[providerId]
      if (!provider || provider.isLocal) return null
      
      return await getApiKey(providerId)
    } catch (error) {
      console.error('Failed to get provider API key:', error)
      return null
    }
  }

  const checkProviderApiKeys = async (): Promise<void> => {
    try {
      const updatedProviders = { ...settings_state.providers }
      let hasChanges = false

      for (const [providerId, provider] of Object.entries(updatedProviders)) {
        if (!provider.isLocal) {
          const hasKey = await hasApiKey(providerId)
          if (provider.hasApiKey !== hasKey) {
            updatedProviders[providerId] = { ...provider, hasApiKey: hasKey }
            hasChanges = true
          }
        }
      }

      if (hasChanges) {
        await updateSetting('providers', updatedProviders)
      }
    } catch (error) {
      console.error('Failed to check provider API keys:', error)
    }
  }

  const refreshProviderModels = async (providerId: string): Promise<void> => {
    try {
      const provider = settings_state.providers[providerId]
      if (!provider) throw new Error('Provider not found')

      // Get API key if needed
      const apiKey = provider.isLocal ? undefined : await getApiKey(providerId)
      
      // Fetch and enrich models
      const enrichedModels = await modelsService.fetchModelsForProvider(
        providerId,
        provider.endpoint,
        apiKey || undefined,
        provider.isLocal
      )

      // Update provider with new models and capabilities
      const modelNames = enrichedModels.map(model => model.id)
      const modelCapabilities = enrichedModels.reduce((acc, model) => {
        acc[model.id] = model.capabilities
        return acc
      }, {} as Record<string, any>)

      // Auto-select first three models for new providers
      const isNewProvider = provider.models.length === 0
      const enabledModels = isNewProvider 
        ? modelNames.slice(0, 3)  // Select first 3 models for new providers
        : provider.enabledModels   // Keep existing selection for refresh

      await updateProviderSetting(providerId, {
        ...provider,
        models: modelNames,
        enabledModels,
        modelCapabilities,
        connected: true
      })

    } catch (error) {
      console.error(`Failed to refresh models for provider ${providerId}:`, error)
      
      // Mark provider as disconnected
      const provider = settings_state.providers[providerId]
      if (provider) {
        await updateProviderSetting(providerId, {
          ...provider,
          connected: false
        })
      }
      
      throw error
    }
  }

  return {
    // Settings data (for direct access)
    settings: settings_state,
    
    // Individual setting values (for SettingsModal compatibility)
    theme: settings_state.theme,
    sendKey: settings_state.sendMessage,
    globalHotkey: settings_state.globalHotkey,
    showPricing: settings_state.showPricing,
    showConversationSettings: settings_state.showConversationSettings,
    providers: settings_state.providers,
    
    // State
    isLoading,
    
    // Generic methods
    updateSetting,
    updateProviderSetting,
    resetSettings,
    getSetting,
    reloadSettings: loadSettings,
    
    // SettingsModal handlers
    handleThemeChange,
    handleSendKeyChange,
    handleGlobalHotkeyChange,
    handleShowPricingChange,
    handleShowConversationSettingsChange,
    handleToggleModel,
    handleCapabilityToggle,
    
    // Provider management
    addProvider,
    updateProvider,
    removeProvider,
    updateProviderApiKey,
    getProviderApiKey,
    checkProviderApiKeys,
    refreshProviderModels,
  }
}