import { ChevronDown, Copy, Eye, Volume2, FileText, Search, Plus, Check } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput, { MessageInputHandle } from './MessageInput'
import { useRef, RefObject, useState, useEffect, useMemo } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useMessages } from '../../hooks/useMessages'
import { useConversations } from '../../hooks/useConversations'
import { useSettings } from '../../hooks/useSettings'
import { type Conversation } from '../../shared/conversationStore'
import { type CreateMessageInput } from '../../shared/messageStore'
import { chatService } from '../../services/chatService'
import clsx from 'clsx'
import EmptyState from '../EmptyState/EmptyState'

interface ChatViewProps {
  conversationId?: number | null
  onOpenSettings?: () => void
  messageInputRef?: RefObject<MessageInputHandle>
  onSelectConversation?: (conversationId: number | null) => void
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
  const [streamingMessage, setStreamingMessage] = useState('')
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  
  // Model selector state
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedModelIndex, setHighlightedModelIndex] = useState(0)
  const [selectedModel, setSelectedModel] = useState<{provider: string, model: string} | null>(null)
  const [copiedConversation, setCopiedConversation] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { messages, addMessage } = useMessages(conversationId ?? null)
  const { getConversation, updateConversation, createConversation } = useConversations()
  const { settings, getProviderApiKey } = useSettings()
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  
  // Debug: Log when ChatView's settings change
  useEffect(() => {
    if (settings?.providers) {
      console.log('ChatView: useSettings detected providers change')
      console.log('ChatView: Provider keys:', Object.keys(settings.providers))
      if (settings.providers.anthropic) {
        console.log('ChatView: Anthropic enabled models:', settings.providers.anthropic.enabledModels)
      }
    }
  }, [settings?.providers])
  
  // Debug: Log settings changes
  useEffect(() => {
    console.log('Settings changed in ChatView:', Object.keys(settings?.providers || {}))
  }, [settings?.providers])
  
  // Get current attachments from MessageInput to determine required capabilities
  const [requiredCapabilities, setRequiredCapabilities] = useState<{
    vision: boolean
    audio: boolean
    files: boolean
  }>({ vision: false, audio: false, files: false })
  
  // Create a stable dependency for enabled models
  const enabledModelsString = useMemo(() => {
    if (!settings?.providers) return ''
    return Object.entries(settings.providers)
      .map(([providerId, provider]) => `${providerId}:${provider.enabledModels?.join(',') || ''}`)
      .join('|')
  }, [settings?.providers])

  // Get available models from providers
  const availableModels = useMemo(() => {
    if (!settings?.providers) return []
    const models: Array<{provider: string, model: string, capabilities?: any}> = []
    
    Object.entries(settings.providers).forEach(([providerId, provider]) => {
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
    console.log('ChatView: Full providers object keys:', Object.keys(settings?.providers || {}))
    Object.entries(settings?.providers || {}).forEach(([id, provider]) => {
      console.log(`ChatView: Provider ${id} enabled models:`, provider.enabledModels)
    })
    
    return models
  }, [settings?.providers, enabledModelsString])
  
  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    availableModels.forEach(model => {
      const providerName = settings?.providers?.[model.provider]?.name || model.provider
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
  }, [availableModels, settings?.providers])

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
          const conv = await getConversation(conversationId)
          setCurrentConversation(conv)
          // Set selected model from conversation
          if (conv?.provider && conv?.model) {
            setSelectedModel({ provider: conv.provider, model: conv.model })
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
  }, [conversationId, getConversation])
  
  // Reset highlighted index when search query changes or model selector opens/closes
  useEffect(() => {
    setHighlightedModelIndex(-1) // No model highlighted initially
  }, [searchQuery, showModelSelector])
  
  // Clear search when model selector closes
  useEffect(() => {
    if (!showModelSelector) {
      setSearchQuery('')
    }
  }, [showModelSelector])
  
  // Keyboard shortcut to toggle model selector (Cmd+. or Ctrl+.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowModelSelector(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
  
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
        setCurrentConversation(prev => prev ? {
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
      
      const id = await createConversation('New Conversation', provider, model)
      onSelectConversation?.(id || null)
      
      // Focus the message input after a short delay
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 100)
    } catch (err) {
      console.error('Failed to create new conversation:', err)
    }
  }
  
  const handleSend = async (message: string, attachments?: Array<{path: string, base64: string, mimeType: string, name: string, type: 'image' | 'audio' | 'file'}>) => {
    if (!conversationId || !message.trim() || !currentConversation) return
    
    // Check if we have a configured provider
    const providers = settings?.providers || {}
    const provider = providers[currentConversation.provider]
    
    if (!provider || !provider.connected || !currentConversation.model) {
      console.error('No active provider or model configured for this conversation')
      return
    }
    
    try {
      setIsLoading(true)
      setStreamingMessage('')
      
      // Create abort controller for cancellation
      const controller = new AbortController()
      setAbortController(controller)
      
      // Build user message with attachments
      const userMessage: CreateMessageInput = {
        role: 'user',
        text: message,
      }
      
      // Handle image attachments
      if (attachments && attachments.length > 0) {
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
        
        // TODO: Handle audio and file attachments
      }
      
      // Add user message to database
      await addMessage(userMessage)
      
      // Get API key for the provider
      const apiKey = await getProviderApiKey(currentConversation.provider)
      
      // Send to AI provider with streaming
      await chatService.sendMessage({
        conversationId,
        userMessage,
        systemPrompt: currentConversation.system_prompt || undefined,
        provider: currentConversation.provider,
        endpoint: provider.endpoint,
        model: currentConversation.model,
        apiKey: apiKey || undefined,
        isLocal: provider.isLocal,
        signal: controller.signal,
        onStreamChunk: (content: string) => {
          setStreamingMessage(prev => prev + content)
        },
        onStreamComplete: async (message: CreateMessageInput) => {
          // Add complete assistant message to database
          try {
            await addMessage(message)
          } catch (err) {
            console.error('Failed to save assistant message:', err)
          }
          setStreamingMessage('')
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
      setStreamingMessage('')
      setAbortController(null)
    }
  }
  
  const handleCancel = async () => {
    if (abortController) {
      abortController.abort()
      
      // Save partial message if there's content
      if (streamingMessage.trim()) {
        try {
          const partialMessage: CreateMessageInput = {
            role: 'assistant',
            text: streamingMessage,
            processing_time_ms: Date.now() // We don't track start time, so use current time
          }
          await addMessage(partialMessage)
        } catch (err) {
          console.error('Failed to save partial message:', err)
        }
      }
      
      setAbortController(null)
      setIsLoading(false)
      setStreamingMessage('')
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
      <div className="border-b border-border/10 px-6 pt-8 pb-3 w-full glass-nav backdrop-blur-strong flex-shrink-0 select-none"
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
              {currentConversation?.provider || 'No Provider'} • {currentConversation?.model || 'No Model'}
            </p>
          </div>
          
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Copy conversation button - only show if there's at least one message */}
            {messages.length >= 1 && (
              <button
                onClick={handleCopyConversation}
                className="p-2 elegant-hover rounded-xl transition-all duration-200 hover:scale-105 shadow-elegant border border-border/20 text-muted-foreground hover:text-primary"
                title="Copy conversation"
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
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Provider</span>
                </button>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="flex items-center gap-2 px-4 py-2 elegant-hover rounded-xl transition-all duration-200 hover:scale-105 text-sm shadow-elegant border border-border/20 text-muted-foreground hover:text-primary hover:border-primary/30"
                  >
                    <span className={!selectedModel || !selectedModel.model ? 'text-muted-foreground' : 'text-foreground/90'}>
                      {selectedModel && selectedModel.model ? selectedModel.model : 'Select Model'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
              
              {showModelSelector && (
                <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-80 glass-effect border border-border/20 rounded-2xl shadow-elegant-xl z-10 max-h-80 overflow-y-auto elegant-scrollbar">
                  {/* Search bar - frozen at top */}
                  <div className="sticky top-0 glass-nav backdrop-blur-strong border-b border-border/10 p-3">
                    <div className="elegant-input-container flex items-center gap-2 px-3 py-2">
                      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                className="p-2 elegant-hover rounded-xl transition-all duration-200 hover:scale-105 shadow-elegant border border-border/20 text-muted-foreground hover:text-primary"
                title="New conversation"
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
          streamingMessage={streamingMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Input - fixed at bottom */}
      <div className="flex-shrink-0">
        <MessageInput
          ref={messageInputRef}
          onSend={handleSend}
          onCancel={handleCancel}
          disabled={!conversationId || !currentConversation?.provider || !currentConversation?.model}
          isLoading={isLoading}
          noProvider={!currentConversation?.model}
          messages={messages}
          modelCapabilities={
            currentConversation?.model && settings?.providers?.[currentConversation.provider]?.modelCapabilities?.[currentConversation.model] || {
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