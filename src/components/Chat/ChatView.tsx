import { ChevronDown, Copy, Eye, Volume2, FileText, Search, Plus, Check } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput, { MessageInputHandle } from './MessageInput'
import { useRef, RefObject, useState, useEffect, useMemo } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useSettings } from '../../hooks/useSettings'
import { useProviders, useMessages, useConversations } from '../../stores/appStore'
import { type PendingConversation } from '../../stores/appStore'
import { type Conversation } from '../../shared/conversationStore'
import { type CreateMessageInput } from '../../shared/messageStore'
import { chatService } from '../../services/chatService'
import clsx from 'clsx'
import EmptyState from '../EmptyState/EmptyState'

interface ChatViewProps {
  conversationId?: number | 'pending' | null
  onOpenSettings?: () => void
  messageInputRef?: RefObject<MessageInputHandle>
  onSelectConversation?: (conversationId: number | 'pending' | null) => void
}

interface ModelCapabilityIconsProps {
  capabilities?: {
    vision?: boolean
    audio?: boolean
    files?: boolean
  }
  className?: string
}

function ModelCapabilityIcons({ capabilities, className = '' }: ModelCapabilityIconsProps) {
  if (!capabilities) return null

  const capabilityItems = [
    {
      key: 'vision' as const,
      icon: Eye,
      enabled: capabilities.vision,
      color: 'text-primary',
      grayColor: 'text-muted-foreground/50',
      title: 'Vision/Images'
    },
    {
      key: 'audio' as const,
      icon: Volume2,
      enabled: capabilities.audio,
      color: 'text-primary',
      grayColor: 'text-muted-foreground/50',
      title: 'Audio Input'
    },
    {
      key: 'files' as const,
      icon: FileText,
      enabled: capabilities.files,
      color: 'text-primary',
      grayColor: 'text-muted-foreground/50',
      title: 'File Input'
    }
  ]

  return (
    <div className={clsx("flex items-center gap-1", className)}>
      {capabilityItems.map(({ key, icon: Icon, enabled, color, grayColor, title }) => {
        if (!enabled) return null
        
        return (
          <div
            key={key}
            className={clsx("w-4 h-4", enabled ? color : grayColor)}
            title={title}
          >
            <Icon className="w-4 h-4" />
          </div>
        )
      })}
    </div>
  )
}

export default function ChatView({ conversationId, messageInputRef: externalMessageInputRef, onSelectConversation }: ChatViewProps) {
  const internalMessageInputRef = useRef<MessageInputHandle>(null)
  const messageInputRef = externalMessageInputRef || internalMessageInputRef
  const [isLoading, setIsLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  
  // Model selector state
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedModelIndex, setHighlightedModelIndex] = useState(0)
  const [selectedModel, setSelectedModel] = useState<{provider: string, model: string} | null>(null)
  const [copiedConversation, setCopiedConversation] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Use Zustand stores
  const { 
    messages, 
    streamingMessage: zustandStreamingMessage,
    addMessage: addMessageToStore,
    loadMessages,
    setStreamingMessage,
    clearStreamingMessage
  } = useMessages(conversationId ?? null)
  const { 
    getConversation,
    updateConversation, 
    createPendingConversation,
    commitPendingConversation
  } = useConversations()
  const { getProviderApiKey } = useSettings()
  const { providers } = useProviders()
  
  const [currentConversation, setCurrentConversation] = useState<Conversation | PendingConversation | null>(null)
  
  // Debug: Log when ChatView's providers change from Zustand
  useEffect(() => {
    if (providers) {
      console.log('ChatView: Zustand providers changed')
      console.log('ChatView: Provider keys:', Object.keys(providers))
      if (providers.anthropic) {
        console.log('ChatView: Anthropic enabled models:', providers.anthropic.enabledModels)
      }
    }
  }, [providers])
  
  // Get current attachments from MessageInput to determine required capabilities
  const [requiredCapabilities, setRequiredCapabilities] = useState<{
    vision: boolean
    audio: boolean
    files: boolean
  }>({ vision: false, audio: false, files: false })
  
  // Create a stable dependency for enabled models
  const enabledModelsString = useMemo(() => {
    if (!providers) return ''
    return Object.entries(providers)
      .map(([providerId, provider]) => `${providerId}:${provider.enabledModels?.join(',') || ''}`)
      .join('|')
  }, [providers])

  // Get available models from providers
  const availableModels = useMemo(() => {
    if (!providers) return []
    const models: Array<{provider: string, model: string, capabilities?: any}> = []
    
    Object.entries(providers).forEach(([providerId, provider]) => {
      if (provider.connected && provider.enabledModels) {
        provider.enabledModels.forEach(modelName => {
          models.push({
            provider: providerId,
            model: modelName,
            capabilities: provider.modelCapabilities?.[modelName]
          })
        })
      }
    })
    
    // Add a debug log to see when this recalculates
    console.log('ChatView: Available models updated:', models.length, 'models found')
    console.log('ChatView: enabledModelsString:', enabledModelsString)
    console.log('ChatView: Full providers object keys:', Object.keys(providers || {}))
    Object.entries(providers || {}).forEach(([id, provider]) => {
      console.log(`ChatView: Provider ${id} enabled models:`, provider.enabledModels)
    })
    
    return models
  }, [providers, enabledModelsString])
  
  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    availableModels.forEach(model => {
      const providerName = providers?.[model.provider]?.name || model.provider
      if (!grouped[providerName]) {
        grouped[providerName] = []
      }
      grouped[providerName].push(model)
    })
    
    // Sort models within each provider group alphabetically
    Object.keys(grouped).forEach(providerName => {
      grouped[providerName].sort((a, b) => a.model.localeCompare(b.model))
    })
    
    return grouped
  }, [availableModels, providers])

  // Filter models based on search query
  const filteredModelsByProvider = useMemo(() => {
    if (!searchQuery.trim()) return modelsByProvider
    
    const filtered: Record<string, any[]> = {}
    Object.entries(modelsByProvider).forEach(([providerName, models]) => {
      const filteredModels = models.filter(model => 
        model.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        providerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      if (filteredModels.length > 0) {
        // Sort filtered models alphabetically as well
        filtered[providerName] = filteredModels.sort((a, b) => a.model.localeCompare(b.model))
      }
    })
    return filtered
  }, [modelsByProvider, searchQuery])

  // Get all models as a flat array for keyboard navigation
  const allFilteredModels = useMemo(() => {
    const models: any[] = []
    Object.entries(filteredModelsByProvider).forEach(([providerName, providerModels]) => {
      providerModels.forEach(model => {
        models.push({ ...model, providerName })
      })
    })
    return models
  }, [filteredModelsByProvider])

  // Load current conversation details
  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        try {
          const conv = getConversation(conversationId)
          setCurrentConversation(conv)
          // Set selected model from conversation
          if (conv?.provider && conv?.model) {
            setSelectedModel({ provider: conv.provider, model: conv.model })
          }
          
          // Load messages if it's a persistent conversation
          if (typeof conversationId === 'number') {
            await loadMessages(conversationId)
          }
        } catch (err) {
          console.error('Failed to load conversation:', err)
        }
      } else {
        setCurrentConversation(null)
        setSelectedModel(null)
      }
    }
    loadConversation()
  }, [conversationId, getConversation, loadMessages])
  
  // Reset highlighted index when search query changes or model selector opens/closes
  useEffect(() => {
    const compatibleModels = allFilteredModels.filter(m => isModelCompatible(m))
    setHighlightedModelIndex(compatibleModels.length > 0 ? 0 : -1) // Start with first model if available
  }, [searchQuery, showModelSelector, allFilteredModels])
  
  // Clear search when model selector closes and auto-focus when it opens
  useEffect(() => {
    if (!showModelSelector) {
      setSearchQuery('')
    } else {
      // Auto-focus the search input when model selector opens
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [showModelSelector])
  
  // Keyboard shortcuts for model selector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle model selector (Cmd+. or Ctrl+.)
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowModelSelector(prev => !prev)
      }
      
      // Open model selector and focus search when Cmd+F is pressed
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (!showModelSelector) {
          setShowModelSelector(true)
          // Focus will be handled by the auto-focus effect when selector opens
        } else {
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showModelSelector])

  // Click outside to close model selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelSelector && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelSelector(false)
      }
    }

    if (showModelSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModelSelector])
  
  // Auto-select model logic: always ensure a model is selected
  useEffect(() => {
    // If we have available models
    if (availableModels.length > 0) {
      // Check if current selected model is still available
      if (selectedModel) {
        const isModelStillAvailable = availableModels.some(
          model => model.provider === selectedModel.provider && model.model === selectedModel.model
        )
        
        if (!isModelStillAvailable) {
          console.log('Selected model is no longer available, auto-selecting first available')
          // Auto-select the first available model
          const firstModel = availableModels[0]
          setSelectedModel({ provider: firstModel.provider, model: firstModel.model })
          
          // Update conversation if applicable
          if (conversationId) {
            updateConversation(conversationId, {
              provider: firstModel.provider,
              model: firstModel.model
            }).catch(err => console.error('Failed to update conversation model:', err))
          }
        }
      } else if (!currentConversation?.model) {
        // No model selected and no conversation model, auto-select first available
        console.log('No model selected, auto-selecting first available')
        const firstModel = availableModels[0]
        setSelectedModel({ provider: firstModel.provider, model: firstModel.model })
        
        // Update conversation if applicable
        if (conversationId) {
          updateConversation(conversationId, {
            provider: firstModel.provider,
            model: firstModel.model
          }).catch(err => console.error('Failed to update conversation model:', err))
        }
      }
    } else {
      // No models available
      setSelectedModel(null)
    }
  }, [availableModels, selectedModel, conversationId, updateConversation, currentConversation?.model])
  
  // Auto-focus input when app opens and model is ready
  useEffect(() => {
    const focusInput = () => {
      // Only focus if there's a model available and input is not disabled
      const hasModel = (currentConversation?.model || selectedModel?.model)
      const isInputEnabled = conversationId && hasModel
      
      if (isInputEnabled && messageInputRef.current?.focus) {
        // Small delay to ensure everything is rendered
        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 150)
      }
    }
    
    focusInput()
  }, [conversationId, currentConversation?.model, selectedModel?.model, messageInputRef])
  
  // Function to check if a model is compatible with current attachments
  const isModelCompatible = (model: any) => {
    if (!model.capabilities) return true // If no capabilities info, allow selection
    
    // Check if model has all required capabilities
    if (requiredCapabilities.vision && !model.capabilities.vision) return false
    if (requiredCapabilities.audio && !model.capabilities.audio) return false
    if (requiredCapabilities.files && !model.capabilities.files) return false
    
    return true
  }

  // Function to get tooltip text for incompatible models
  const getIncompatibilityReason = (model: any) => {
    if (!model.capabilities) return null
    
    const missing: string[] = []
    if (requiredCapabilities.vision && !model.capabilities.vision) missing.push('image')
    if (requiredCapabilities.audio && !model.capabilities.audio) missing.push('audio')
    if (requiredCapabilities.files && !model.capabilities.files) missing.push('file')
    
    if (missing.length === 0) return null
    
    const attachmentTypes = missing.join(', ')
    return `Remove ${attachmentTypes} attachment${missing.length > 1 ? 's' : ''} to switch to this model`
  }
  
  // Function to get the index of a model in the compatible models list
  const getModelIndex = (model: any) => {
    const compatibleModels = allFilteredModels.filter(m => isModelCompatible(m))
    return compatibleModels.findIndex(m => 
      m.provider === model.provider && m.model === model.model
    )
  }

  // Function to check if a model is currently highlighted (unified hover and keyboard)
  const isModelHighlighted = (model: any) => {
    const compatibleModels = allFilteredModels.filter(m => isModelCompatible(m))
    if (highlightedModelIndex < 0 || highlightedModelIndex >= compatibleModels.length) return false
    const highlightedModel = compatibleModels[highlightedModelIndex]
    return highlightedModel.provider === model.provider && highlightedModel.model === model.model
  }

  // Function to handle mouse enter on a model
  const handleModelMouseEnter = (model: any) => {
    const modelIndex = getModelIndex(model)
    if (modelIndex !== -1) {
      setHighlightedModelIndex(modelIndex)
    }
  }
  
  // Handle model selection
  const handleModelSelect = async (model: {provider: string, model: string}) => {
    setSelectedModel(model)
    setShowModelSelector(false)
    
    // Update conversation with new model
    if (conversationId) {
      try {
        await updateConversation(conversationId, {
          provider: model.provider,
          model: model.model
        })
        
        // Update local state immediately to reflect the change
        setCurrentConversation((prev) => prev ? {
          ...prev,
          provider: model.provider,
          model: model.model
        } : null)
      } catch (err) {
        console.error('Failed to update conversation model:', err)
      }
    }
    
    // Focus the input field after model selection
    setTimeout(() => {
      messageInputRef.current?.focus()
    }, 100)
  }
  
  // Handle conversation copy
  const handleCopyConversation = async () => {
    if (messages.length < 1) return
    
    try {
      const conversationText = messages
        .map(msg => {
          const role = msg.role === 'user' ? 'You' : 'Assistant'
          return `${role}: ${msg.text || ''}`
        })
        .join('\n\n')
      
      await navigator.clipboard.writeText(conversationText)
      setCopiedConversation(true)
      setTimeout(() => setCopiedConversation(false), 2000)
    } catch (err) {
      console.error('Failed to copy conversation:', err)
    }
  }
  
  // Handle new conversation creation
  const handleNewConversation = async () => {
    try {
      // Use current conversation's model if available, otherwise empty
      const provider = currentConversation?.provider || ''
      const model = currentConversation?.model || ''
      
      // Create a pending conversation
      createPendingConversation('New Conversation', provider, model)
      
      // Focus the message input after a short delay
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 100)
    } catch (err) {
      console.error('Failed to create new conversation:', err)
    }
  }
  
  const handleSend = async (message: string, attachments?: Array<{path: string, base64: string, mimeType: string, name: string, type: 'image' | 'audio' | 'file'}>) => {
    if (!conversationId || !message.trim()) return
    
    // Get effective provider and model (prefer conversation, fallback to selected)
    const effectiveProvider = currentConversation?.provider || selectedModel?.provider
    const effectiveModel = currentConversation?.model || selectedModel?.model
    
    if (!effectiveProvider || !effectiveModel) {
      console.error('No provider or model selected')
      return
    }
    
    // Check if we have a configured provider
    const provider = providers[effectiveProvider]
    
    if (!provider || !provider.connected) {
      console.error('No active provider configured')
      return
    }
    
    let activeConversationId = conversationId
    
    try {
      setIsLoading(true)
      clearStreamingMessage(conversationId)
      
      // If this is a pending conversation, commit it to persistent before sending message
      if (conversationId === 'pending') {
        console.log('Committing pending conversation to persistent before sending message')
        
        // Update the pending conversation with effective provider/model before committing
        if (!currentConversation?.provider || !currentConversation?.model) {
          await updateConversation('pending', {
            provider: effectiveProvider,
            model: effectiveModel
          })
        }
        
        const persistentId = await commitPendingConversation()
        if (persistentId) {
          activeConversationId = persistentId
          onSelectConversation?.(persistentId)
          // Update current conversation state
          const promotedConv = getConversation(persistentId)
          if (promotedConv) {
            setCurrentConversation(promotedConv)
          }
        } else {
          console.error('Failed to commit pending conversation')
          return
        }
      } else if (activeConversationId && (!currentConversation?.provider || !currentConversation?.model)) {
        // Update existing conversation with effective provider/model
        await updateConversation(activeConversationId, {
          provider: effectiveProvider,
          model: effectiveModel
        })
        setCurrentConversation(prev => prev ? {
          ...prev,
          provider: effectiveProvider,
          model: effectiveModel
        } : null)
      }
      
      // Create abort controller for cancellation
      const controller = new AbortController()
      setAbortController(controller)
      
      // Build user message with attachments
      const userMessage: CreateMessageInput = {
        role: 'user',
        text: message,
      }
      
      // Handle attachments
      if (attachments && attachments.length > 0) {
        // Handle image attachments
        const images = attachments
          .filter(att => att.type === 'image')
          .map(att => ({
            file_path: att.base64, // Store base64 data
            mime_type: att.mimeType,
            url: `data:${att.mimeType};base64,${att.base64}`
          }))
        
        if (images.length > 0) {
          userMessage.images = images
        }
        
        // Handle audio attachments
        const audioFiles = attachments
          .filter(att => att.type === 'audio')
          .map(att => ({
            file_path: att.base64, // Store base64 data
            mime_type: att.mimeType,
            url: `data:${att.mimeType};base64,${att.base64}`
          }))
        
        if (audioFiles.length > 0) {
          userMessage.audio = audioFiles
        }
        
        // Handle file attachments  
        const files = attachments
          .filter(att => att.type === 'file')
          .map(att => ({
            path: att.path,
            name: att.name,
            type: att.mimeType,
            content: att.base64 // Store base64 content for sending to providers
          }))
        
        if (files.length > 0) {
          userMessage.files = files
        }
      }
      
      // Add user message to store (which handles both draft and persistent)
      await addMessageToStore(activeConversationId, userMessage)
      
      // Get API key for the provider
      const apiKey = await getProviderApiKey(effectiveProvider)
      
      // Send to AI provider with streaming
      await chatService.sendMessage({
        conversationId: activeConversationId,
        userMessage,
        systemPrompt: currentConversation?.system_prompt || undefined,
        provider: effectiveProvider,
        endpoint: provider.endpoint,
        model: effectiveModel,
        apiKey: apiKey || undefined,
        isLocal: provider.isLocal,
        signal: controller.signal,
        onStreamChunk: (content: string) => {
          setStreamingMessage(activeConversationId, content)
        },
        onStreamComplete: async (message: CreateMessageInput) => {
          // Add complete assistant message to store
          try {
            await addMessageToStore(activeConversationId, message)
          } catch (err) {
            console.error('Failed to save assistant message:', err)
          }
          clearStreamingMessage(activeConversationId)
        }
      })
      
      // Note: For streaming, the message is already saved in onStreamComplete
      // For non-streaming, we would need to save assistantMessage here, but currently we're always streaming
      
    } catch (err) {
      // Since we handle cancellation gracefully now, we shouldn't get cancelled errors
      console.error('Failed to send message:', err)
      // Show error toast
      if ((window as any).showToast) {
        (window as any).showToast({
          type: 'error',
          title: 'Failed to send message',
          message: err instanceof Error ? err.message : 'An unknown error occurred'
        })
      }
    } finally {
      setIsLoading(false)
      clearStreamingMessage(activeConversationId)
      setAbortController(null)
    }
  }
  
  const handleCancel = async () => {
    if (abortController && conversationId) {
      abortController.abort()
      
      // Save partial message if there's content
      if (zustandStreamingMessage.trim()) {
        try {
          const partialMessage: CreateMessageInput = {
            role: 'assistant',
            text: zustandStreamingMessage,
            processing_time_ms: Date.now() // We don't track start time, so use current time
          }
          await addMessageToStore(conversationId, partialMessage)
        } catch (err) {
          console.error('Failed to save partial message:', err)
        }
      }
      
      setAbortController(null)
      setIsLoading(false)
      clearStreamingMessage(conversationId)
    }
  }

  const handleStartDrag = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const window = getCurrentWindow()
      await window.startDragging()
    } catch (error) {
      console.error('Failed to start dragging:', error)
    }
  }

  return (
    <div className="h-full flex flex-col min-w-0">
      
      {/* Header */}
      <div className="border-b border-border/10 px-6 pt-8 pb-4 w-full glass-nav backdrop-blur-strong flex-shrink-0 select-none"
           onMouseDown={handleStartDrag}
      >
        <div className="flex items-center justify-between w-full gap-4">
          <div 
            className="min-w-0 flex-1 select-none" 
            onMouseDown={handleStartDrag}
          >
            <h2 className="text-lg font-semibold truncate text-foreground/95 tracking-tight">
              {currentConversation?.title || 'New Conversation'}
            </h2>
            <p className="text-sm text-muted-foreground/80 truncate">
              {currentConversation?.provider || selectedModel?.provider || 'No Provider'} • {currentConversation?.model || selectedModel?.model || 'No Model'}
            </p>
          </div>
          
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Copy conversation button - only show if there's at least one message */}
            {messages.length >= 1 && (
              <button
                onClick={handleCopyConversation}
                className="copy-conversation-btn p-2 elegant-hover rounded-xl transition-all duration-200 hover:scale-105 shadow-elegant text-muted-foreground hover:text-primary"
                title="Copy conversation"
                aria-label="Copy conversation to clipboard"
              >
                {copiedConversation ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
            
            {/* Model selector or Add Provider button */}
            {messages.length < 1 && (
              availableModels.length === 0 ? (
                // Show Add Provider button when no models are available
                <button
                  onClick={() => {
                    // Open settings modal to provider section
                    const event = new CustomEvent('openSettings', { detail: { section: 'providers' } })
                    window.dispatchEvent(event)
                  }}
                  className="elegant-button flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium"
                  aria-label="Add AI provider"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Provider</span>
                </button>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="flex items-center gap-2 px-4 py-2 elegant-hover rounded-xl transition-all duration-200 hover:scale-105 text-sm shadow-elegant border border-border/20 text-muted-foreground hover:text-primary hover:border-primary/30"
                    aria-label={selectedModel && selectedModel.model ? `Selected model: ${selectedModel.model}` : 'Select AI model'}
                    aria-expanded={showModelSelector}
                    aria-haspopup="listbox"
                  >
                    <span className={!selectedModel || !selectedModel.model ? 'text-muted-foreground' : 'text-foreground/90'}>
                      {selectedModel && selectedModel.model ? selectedModel.model : 'Select Model'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
              
              {showModelSelector && (
                <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-80 glass-effect border border-border/20 rounded-2xl shadow-elegant-xl z-[9999] max-h-80 overflow-y-auto overflow-x-hidden elegant-scrollbar">
                  {/* Search bar - frozen at top */}
                  <div className="sticky top-0 glass-nav backdrop-blur-strong border-b border-border/10 p-3 z-10">
                    <div className="elegant-input-container flex items-center gap-2 px-3 py-2">
                      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          const compatibleModels = allFilteredModels.filter(m => isModelCompatible(m))
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setHighlightedModelIndex(prev => 
                              prev < compatibleModels.length - 1 ? prev + 1 : 0
                            )
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setHighlightedModelIndex(prev => 
                              prev > 0 ? prev - 1 : compatibleModels.length - 1
                            )
                          } else if (e.key === 'Enter') {
                            e.preventDefault()
                            if (highlightedModelIndex >= 0 && highlightedModelIndex < compatibleModels.length) {
                              const selectedModel = compatibleModels[highlightedModelIndex]
                              handleModelSelect({ provider: selectedModel.provider, model: selectedModel.model })
                            }
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            setShowModelSelector(false)
                          }
                        }}
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground text-foreground"
                      />
                    </div>
                  </div>
                  
                  {Object.entries(filteredModelsByProvider).length === 0 ? (
                    <div className="py-4">
                      <EmptyState
                        type="no-results"
                        title={searchQuery ? "No models found" : "No models available"}
                        description={searchQuery ? `No models matching "${searchQuery}"` : "Check your provider settings"}
                        className="scale-75"
                      />
                    </div>
                  ) : (
                    Object.entries(filteredModelsByProvider).map(([providerName, models]) => (
                      <div key={providerName} className="mb-2">
                        <div className="px-4 py-3 text-xs font-semibold text-muted-foreground glass-nav backdrop-blur-strong border-b border-border/10 tracking-wide">
                          {providerName.toUpperCase()}
                        </div>
                        <div className="p-1">
                          {models.map((model) => {
                            const compatible = isModelCompatible(model)
                            const incompatibilityReason = getIncompatibilityReason(model)
                            const isSelected = selectedModel?.provider === model.provider && selectedModel?.model === model.model
                            const isHighlighted = isModelHighlighted(model)
                            
                            return (
                              <button
                                key={`${model.provider}-${model.model}`}
                                onClick={() => {
                                  if (!compatible) return
                                  handleModelSelect({ provider: model.provider, model: model.model })
                                }}
                                onMouseEnter={() => handleModelMouseEnter(model)}
                                className={clsx(
                                  'w-full text-left px-3 py-2 transition-all duration-200 rounded-xl mx-1 my-0.5',
                                  !compatible 
                                    ? 'cursor-not-allowed opacity-50' 
                                    : 'cursor-pointer elegant-hover',
                                  isSelected
                                    ? 'bg-gradient-subtle border border-primary/20'
                                    : isHighlighted
                                    ? 'bg-surface-hover'
                                    : ''
                                )}
                                disabled={!compatible}
                                title={incompatibilityReason || undefined}
                                data-model-id={`${model.provider}-${model.model}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className={clsx(
                                    "font-medium text-sm",
                                    !compatible ? "text-muted-foreground" : "text-foreground/90"
                                  )}>
                                    {model.model}
                                  </div>
                                  <ModelCapabilityIcons 
                                    capabilities={model.capabilities} 
                                    className={!compatible ? "opacity-50" : ""}
                                  />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
                </div>
              )
            )}
            
            {/* New conversation button - only show if there's at least one message */}
            {messages.length >= 1 && (
              <button
                onClick={handleNewConversation}
                className="new-conversation-btn p-2 elegant-hover rounded-xl transition-all duration-200 hover:scale-105 shadow-elegant text-muted-foreground hover:text-primary"
                title="New conversation"
                aria-label="Start new conversation"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages - this should be the scrollable area */}
      <div className="flex-1 min-h-0">
        <MessageList 
          messages={messages}
          streamingMessage={zustandStreamingMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Input - fixed at bottom */}
      <div className="flex-shrink-0">
        <MessageInput
          ref={messageInputRef}
          onSend={handleSend}
          onCancel={handleCancel}
          disabled={!conversationId || (!currentConversation?.provider && !selectedModel?.provider) || (!currentConversation?.model && !selectedModel?.model)}
          isLoading={isLoading}
          noProvider={!currentConversation?.model && !selectedModel?.model}
          messages={messages}
          modelCapabilities={
            (currentConversation?.model && providers?.[currentConversation.provider]?.modelCapabilities?.[currentConversation.model]) ||
            (selectedModel?.model && providers?.[selectedModel.provider]?.modelCapabilities?.[selectedModel.model]) || {
              vision: false,
              audio: false,
              files: false
            }
          }
          onOpenConversationSettings={() => console.log('Open conversation settings')}
          onAttachmentsChange={setRequiredCapabilities}
        />
      </div>
      </div>
    </div>
  )
}