import { useState, useEffect, useMemo } from 'react'
import type { Conversation, ModelCapabilities } from '@/types/electron'
import { useSettingsStore } from '@/stores/settingsStore'

interface ModelOption {
  provider: string
  model: string
  providerName: string
  capabilities?: ModelCapabilities
}

interface UseModelSelectionReturn {
  selectedModel: {provider: string, model: string} | null
  setSelectedModel: (model: {provider: string, model: string} | null) => void
  availableModels: ModelOption[]
  modelsByProvider: Record<string, ModelOption[]>
  showModelSelector: boolean
  setShowModelSelector: (show: boolean) => void
}

export function useModelSelection(conversation: Conversation | null): UseModelSelectionReturn {
  const [selectedModel, setSelectedModel] = useState<{provider: string, model: string} | null>(null)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const { settings } = useSettingsStore()

  // Get available models from configured providers (filtered by enabled models)
  const availableModels = useMemo(() => {
    if (!settings?.providers) return []
    
    const models: ModelOption[] = []
    Object.entries(settings.providers).forEach(([providerId, provider]) => {
      if (provider.configured && provider.models && (provider.enabled !== false)) {
        // Filter models based on enabled models setting
        const enabledModels = provider.enabledModels || provider.models.slice(0, 3) // Default to first 3
        enabledModels.forEach(model => {
          if (provider.models.includes(model)) { // Ensure model still exists
            models.push({
              provider: providerId,
              model,
              providerName: providerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              capabilities: provider.modelCapabilities?.[model]
            })
          }
        })
      }
    })
    return models
  }, [settings?.providers])

  // Group models by provider for display
  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, ModelOption[]> = {}
    availableModels.forEach(model => {
      if (!grouped[model.providerName]) {
        grouped[model.providerName] = []
      }
      grouped[model.providerName].push(model)
    })
    
    // Sort providers alphabetically
    const sortedProviders: Record<string, ModelOption[]> = {}
    Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .forEach(providerName => {
        sortedProviders[providerName] = grouped[providerName]
      })
    
    return sortedProviders
  }, [availableModels])

  // Sync selected model with conversation's model
  useEffect(() => {
    if (conversation && conversation.provider && conversation.model) {
      // If conversation has a model, use it
      setSelectedModel({ provider: conversation.provider, model: conversation.model })
    } else if (!selectedModel && availableModels.length > 0) {
      // If no model selected and no conversation model, use default or first available
      const defaultProvider = settings?.defaultProvider
      let defaultModel = availableModels[0]
      
      if (defaultProvider) {
        const providerModel = availableModels.find(m => m.provider === defaultProvider)
        if (providerModel) defaultModel = providerModel
      }
      
      setSelectedModel({ provider: defaultModel.provider, model: defaultModel.model })
    }
  }, [conversation, availableModels, settings?.defaultProvider, selectedModel])

  return {
    selectedModel,
    setSelectedModel,
    availableModels,
    modelsByProvider,
    showModelSelector,
    setShowModelSelector
  }
}