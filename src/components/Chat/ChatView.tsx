import { useRef, useEffect, forwardRef, useImperativeHandle, useState, useMemo } from 'react'
import { ChevronDown, Settings, Eye, Volume2, FileText, Copy, Check, Search } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput, { MessageInputHandle } from './MessageInput'
import ConversationSettingsModal from '../Settings/ConversationSettingsModal'
import type { Conversation, ModelCapabilities } from '@/types/electron'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useModelSelection, useStreamingChat } from '@/hooks'
import clsx from 'clsx'

interface ChatViewProps {
  conversation: Conversation | null
  onOpenSettings?: () => void
}

interface ModelCapabilityIconsProps {
  capabilities?: ModelCapabilities
  className?: string
}

function ModelCapabilityIcons({ capabilities, className = '' }: ModelCapabilityIconsProps) {
  if (!capabilities) return null

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

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {capabilityItems.map(({ key, icon: Icon, enabled, color, grayColor, title }) => (
        <div
          key={key}
          className={clsx(
            "w-3 h-3 transition-colors",
            enabled ? color : grayColor
          )}
          title={title}
        >
          <Icon className="w-3 h-3" />
        </div>
      ))}
    </div>
  )
}

export interface ChatViewHandle {
  focusInput: () => void
  saveQuickChatState?: (baseState: { selectedConversationId: string | null; isNewConversation: boolean }) => void
  restoreQuickChatState?: (state: any) => void
}

const ChatView = forwardRef<ChatViewHandle, ChatViewProps>(
  ({ conversation, onOpenSettings }, ref) => {
  const [showConversationSettings, setShowConversationSettings] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { getConversationSettings, updateConversationSettings } = useConversationStore()
  const { settings } = useSettingsStore()
  const messageInputRef = useRef<MessageInputHandle>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Use custom hooks
  const {
    selectedModel,
    setSelectedModel,
    availableModels,
    modelsByProvider,
    showModelSelector,
    setShowModelSelector
  } = useModelSelection(conversation)
  
  const { isLoading, streamingMessage, sendMessage } = useStreamingChat()

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
        filtered[providerName] = filteredModels
      }
    })
    return filtered
  }, [modelsByProvider, searchQuery])

  // Get current attachments from MessageInput to determine required capabilities
  const [requiredCapabilities, setRequiredCapabilities] = useState<{
    vision: boolean
    audio: boolean
    files: boolean
  }>({ vision: false, audio: false, files: false })

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

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      messageInputRef.current?.focus()
    },
    saveQuickChatState: (baseState) => {
      // Get state from MessageInput component and combine with base state
      const inputState = messageInputRef.current?.getQuickChatState?.()
      const fullState = {
        ...baseState,
        draftText: inputState?.draftText || '',
        attachments: inputState?.attachments || [],
        selectedModel: selectedModel ? {
          provider: selectedModel.provider,
          model: selectedModel.model
        } : null
      }
      
      // Save to electron
      window.electronAPI.quickChat.saveState(fullState)
    },
    restoreQuickChatState: (state) => {
      // Restore model selection
      if (state.selectedModel) {
        setSelectedModel(state.selectedModel)
      }
      
      // Restore input state
      messageInputRef.current?.restoreQuickChatState?.({
        draftText: state.draftText || '',
        attachments: state.attachments || []
      })
    }
  }))


  // Focus input when conversation changes
  useEffect(() => {
    if (conversation) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 100)
    }
  }, [conversation?.id])

  // Focus search input when model selector opens and clear search when it closes
  useEffect(() => {
    if (showModelSelector) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      setSearchQuery('')
    }
  }, [showModelSelector])

  const copyConversationText = async () => {
    if (!conversation || !conversation.messages || conversation.messages.length === 0) return
    
    // Format conversation text
    const conversationText = conversation.messages
      .map(message => {
        const role = message.role === 'user' ? 'You' : 'Assistant'
        return `${role}:\n${message.content}`
      })
      .join('\n\n')
    
    try {
      await navigator.clipboard.writeText(conversationText)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy conversation:', error)
    }
  }

  const handleSend = async (message: string, attachments?: Array<{path: string, base64: string, mimeType: string, name: string, type: 'image' | 'audio' | 'file'}>) => {
    if (!selectedModel) return
    await sendMessage(message, selectedModel, conversation, attachments)
  }

  if (!conversation) {
    // Show model selection screen if no providers configured
    if (availableModels.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground mb-6">
              <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">No AI Providers Configured</h2>
            <p className="text-muted-foreground mb-6">
              You need to add at least one AI provider to start chatting
            </p>
            <button
              onClick={onOpenSettings}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Open Settings
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Welcome to Open Chat</h2>
          <p className="text-muted-foreground mb-4">
            Select a conversation from the sidebar or start a new one
          </p>
          {selectedModel && (
            <p className="text-sm text-muted-foreground">
              Ready to chat with {selectedModel.model}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Window controls area */}
      <div className="h-6 drag-region" />
      
      {/* Header */}
      <div className="border-b border-border px-4 py-3 drag-region min-w-0 backdrop-blur-sm bg-background/80">
        <div className="flex items-center justify-between min-w-0 gap-4">
          <div className="no-drag min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">{conversation.title}</h2>
            {/* Only show provider/model info if there are configured providers and conversation has provider/model */}
            {availableModels.length > 0 && conversation.provider && conversation.model && (
              <p className="text-sm text-muted-foreground truncate">
                {conversation.provider.charAt(0).toUpperCase() + conversation.provider.slice(1).replace(/-/g, ' ')} • {conversation.model}
              </p>
            )}
          </div>
          
          {/* Show Add Provider button if no providers, otherwise show model selector and copy button */}
          <div className="flex-shrink-0 flex items-center gap-2">
          {/* Copy conversation button - only show if conversation has messages */}
          {conversation.messages && conversation.messages.length > 0 && (
            <button
              onClick={copyConversationText}
              className="no-drag p-2 bg-secondary hover:bg-accent rounded-lg transition-all duration-200 hover:scale-105 shadow-sm border border-border hover:border-primary/30"
              title="Copy conversation"
            >
              {copySuccess ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          )}
          
          {availableModels.length === 0 ? (
            <button
              onClick={onOpenSettings}
              className="no-drag px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 text-sm inline-flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Settings className="h-4 w-4" />
              Add Provider
            </button>
          ) : (
            /* Model selector - show if conversation hasn't started (no messages) or if temporary */
            ((!conversation.messages || conversation.messages.length === 0) || conversation.isTemporary) && (
              <div className="relative no-drag">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-accent rounded-lg transition-all duration-200 hover:scale-105 text-sm shadow-sm border border-border hover:border-primary/30"
                >
                  <span className={!selectedModel || !selectedModel.model ? 'text-muted-foreground' : ''}>
                    {selectedModel && selectedModel.model ? selectedModel.model : 'Select Model'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showModelSelector && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-background border border-border rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                    {/* Search bar - frozen at top */}
                    <div className="sticky top-0 bg-background border-b border-border p-3">
                      <div className="flex items-center gap-2 px-2 py-1 bg-secondary rounded-lg">
                        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search models..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    
                    {Object.entries(filteredModelsByProvider).length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {searchQuery ? `No models found for "${searchQuery}"` : 'No models available. Check your provider settings.'}
                      </div>
                    ) : (
                      Object.entries(filteredModelsByProvider).map(([providerName, models]) => (
                        <div key={providerName}>
                          <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-secondary/50 border-b border-border">
                            {providerName}
                          </div>
                          {models.map((model) => {
                            const compatible = isModelCompatible(model)
                            const incompatibilityReason = getIncompatibilityReason(model)
                            
                            return (
                              <button
                                key={`${model.provider}-${model.model}`}
                                onClick={() => {
                                  if (!compatible) return // Prevent selection of incompatible models
                                  setSelectedModel({ provider: model.provider, model: model.model })
                                  setShowModelSelector(false)
                                  // Focus the input field after model selection
                                  setTimeout(() => {
                                    messageInputRef.current?.focus()
                                  }, 100)
                                }}
                                className={clsx(
                                  'w-full text-left px-4 py-2 transition-colors border-b border-border/30 last:border-b-0',
                                  !compatible 
                                    ? 'cursor-not-allowed opacity-50' 
                                    : 'hover:bg-accent cursor-pointer',
                                  selectedModel?.provider === model.provider && selectedModel?.model === model.model
                                    ? 'bg-accent'
                                    : ''
                                )}
                                disabled={!compatible}
                                title={incompatibilityReason || undefined}
                              >
                                <div className="flex items-center justify-between">
                                  <div className={clsx(
                                    "font-medium text-sm",
                                    !compatible ? "text-muted-foreground" : ""
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
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={conversation.messages} isLoading={isLoading} streamingMessage={streamingMessage} />

      {/* Input */}
      <MessageInput
        ref={messageInputRef}
        onSend={handleSend}
        onCancel={() => {
          // Additional cancel logic if needed
        }}
        disabled={availableModels.length === 0 || !selectedModel || !selectedModel.model}
        isLoading={isLoading}
        noProvider={availableModels.length === 0 || !selectedModel || !selectedModel.model}
        messages={conversation.messages}
        modelCapabilities={
          selectedModel 
            ? settings?.providers[selectedModel.provider]?.modelCapabilities?.[selectedModel.model]
            : undefined
        }
        onOpenConversationSettings={() => setShowConversationSettings(true)}
        onAttachmentsChange={setRequiredCapabilities}
      />

      {/* Conversation Settings Modal */}
      {conversation && (
        <ConversationSettingsModal
          isOpen={showConversationSettings}
          onClose={() => setShowConversationSettings(false)}
          settings={getConversationSettings(conversation.id)}
          onSave={(newSettings) => updateConversationSettings(conversation.id, newSettings)}
        />
      )}
    </div>
  )
})

ChatView.displayName = 'ChatView'

export default ChatView