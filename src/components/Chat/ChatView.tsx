import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send, Paperclip, ChevronDown, Settings } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput, { MessageInputHandle } from './MessageInput'
import type { Conversation } from '@/types/electron'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import clsx from 'clsx'

interface ChatViewProps {
  conversation: Conversation | null
  sidebarOpen: boolean
  onOpenSettings?: () => void
}

export interface ChatViewHandle {
  focusInput: () => void
}

const ChatView = forwardRef<ChatViewHandle, ChatViewProps>(
  ({ conversation, sidebarOpen, onOpenSettings }, ref) => {
  const [message, setMessage] = useState('')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [selectedModel, setSelectedModel] = useState<{provider: string, model: string} | null>(null)
  const { addMessage } = useConversationStore()
  const { settings } = useSettingsStore()
  const messageInputRef = useRef<MessageInputHandle>(null)

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      messageInputRef.current?.focus()
    }
  }))

  // Get available models from configured providers
  const availableModels = React.useMemo(() => {
    if (!settings?.providers) return []
    
    const models: Array<{provider: string, model: string, providerName: string}> = []
    Object.entries(settings.providers).forEach(([providerId, provider]) => {
      if (provider.configured && provider.models) {
        provider.models.forEach(model => {
          models.push({
            provider: providerId,
            model,
            providerName: providerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          })
        })
      }
    })
    return models
  }, [settings?.providers])

  // Set default model if none selected and conversation doesn't have one
  useEffect(() => {
    if (!selectedModel && availableModels.length > 0 && !conversation) {
      const defaultProvider = settings?.defaultProvider
      let defaultModel = availableModels[0]
      
      if (defaultProvider) {
        const providerModel = availableModels.find(m => m.provider === defaultProvider)
        if (providerModel) defaultModel = providerModel
      }
      
      setSelectedModel({ provider: defaultModel.provider, model: defaultModel.model })
    }
  }, [selectedModel, availableModels, conversation, settings?.defaultProvider])

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 100)
    }
  }, [conversation?.id])

  const handleSend = async () => {
    if (!message.trim()) return
    
    let currentConversation = conversation
    
    // If no conversation exists and we have a selected model, create one
    if (!currentConversation && selectedModel) {
      const newConversation = await window.electronAPI.conversations.create(selectedModel.provider, selectedModel.model)
      // The store will be updated via the conversation store's createConversation method
      // For now, we'll use the returned conversation directly
      currentConversation = newConversation
    }
    
    if (!currentConversation) return
    
    await addMessage(currentConversation.id, {
      role: 'user',
      content: message.trim()
    })
    setMessage('')
    
    // TODO: Send to LLM and get response
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
    <div className="flex-1 flex flex-col">
      {/* Window controls area */}
      <div className="h-6 drag-region" />
      
      {/* Header */}
      <div className="border-b border-border px-4 py-3 drag-region">
        <div className="flex items-center justify-between">
          <div className="no-drag">
            <h2 className="text-lg font-semibold">{conversation.title}</h2>
            {/* Only show provider/model info if there are configured providers and conversation has provider/model */}
            {availableModels.length > 0 && conversation.provider && conversation.model && (
              <p className="text-sm text-muted-foreground">
                {conversation.provider} • {conversation.model}
              </p>
            )}
          </div>
          
          {/* Show Add Provider button if no providers, otherwise show model selector */}
          {availableModels.length === 0 ? (
            <button
              onClick={onOpenSettings}
              className="no-drag px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm inline-flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Add Provider
            </button>
          ) : (
            /* Model selector - only show if conversation hasn't started (no messages) or if not locked */
            (!conversation.messages || conversation.messages.length === 0) && (
              <div className="relative no-drag">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-accent rounded-lg transition-colors text-sm"
                >
                  <span>
                    {selectedModel ? selectedModel.model : 'Select Model'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showModelSelector && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-background border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {availableModels.map((model, index) => (
                      <button
                        key={`${model.provider}-${model.model}`}
                        onClick={() => {
                          setSelectedModel({ provider: model.provider, model: model.model })
                          setShowModelSelector(false)
                        }}
                        className={clsx(
                          'w-full text-left px-3 py-2 hover:bg-accent transition-colors',
                          selectedModel?.provider === model.provider && selectedModel?.model === model.model
                            ? 'bg-accent'
                            : ''
                        )}
                      >
                        <div className="font-medium">{model.model}</div>
                        <div className="text-xs text-muted-foreground">{model.providerName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={conversation.messages} />

      {/* Input */}
      <MessageInput
        ref={messageInputRef}
        value={message}
        onChange={setMessage}
        onSend={handleSend}
        disabled={availableModels.length === 0}
      />
    </div>
  )
})

ChatView.displayName = 'ChatView'

export default ChatView