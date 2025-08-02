import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import {ChevronDown, Settings, Eye, Volume2, FileText } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput, { MessageInputHandle } from './MessageInput'
import type { Conversation, ModelCapabilities } from '@/types/electron'
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
}

const ChatView = forwardRef<ChatViewHandle, ChatViewProps>(
  ({ conversation, onOpenSettings }, ref) => {
  const { settings } = useSettingsStore()
  const messageInputRef = useRef<MessageInputHandle>(null)
  
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

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      messageInputRef.current?.focus()
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
          
          {/* Show Add Provider button if no providers, otherwise show model selector */}
          <div className="flex-shrink-0">
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
                    {Object.entries(modelsByProvider).length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No models available. Check your provider settings.
                      </div>
                    ) : (
                      Object.entries(modelsByProvider).map(([providerName, models]) => (
                        <div key={providerName}>
                          <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-secondary/50 border-b border-border">
                            {providerName}
                          </div>
                          {models.map((model) => (
                            <button
                              key={`${model.provider}-${model.model}`}
                              onClick={() => {
                                setSelectedModel({ provider: model.provider, model: model.model })
                                setShowModelSelector(false)
                                // Focus the input field after model selection
                                setTimeout(() => {
                                  messageInputRef.current?.focus()
                                }, 100)
                              }}
                              className={clsx(
                                'w-full text-left px-4 py-2 hover:bg-accent transition-colors border-b border-border/30 last:border-b-0',
                                selectedModel?.provider === model.provider && selectedModel?.model === model.model
                                  ? 'bg-accent'
                                  : ''
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm">{model.model}</div>
                                <ModelCapabilityIcons capabilities={model.capabilities} />
                              </div>
                            </button>
                          ))}
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
        disabled={availableModels.length === 0 || !selectedModel || !selectedModel.model || isLoading}
        isLoading={isLoading}
        messages={conversation.messages}
        modelCapabilities={
          selectedModel 
            ? settings?.providers[selectedModel.provider]?.modelCapabilities?.[selectedModel.model]
            : undefined
        }
      />
    </div>
  )
})

ChatView.displayName = 'ChatView'

export default ChatView