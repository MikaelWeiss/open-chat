import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import {ChevronDown, Settings, Eye, Volume2, FileText } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput, { MessageInputHandle } from './MessageInput'
import type { Conversation, ModelCapabilities } from '@/types/electron'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore, useToastStore } from '@/stores/settingsStore'
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
  const [message, setMessage] = useState('')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [selectedModel, setSelectedModel] = useState<{provider: string, model: string} | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const { addMessage, setStreaming } = useConversationStore()
  const { settings } = useSettingsStore()
  const { addToast } = useToastStore()
  const messageInputRef = useRef<MessageInputHandle>(null)

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      messageInputRef.current?.focus()
    }
  }))

  // Get available models from configured providers (filtered by enabled models)
  const availableModels = React.useMemo(() => {
    if (!settings?.providers) return []
    
    const models: Array<{provider: string, model: string, providerName: string, capabilities?: ModelCapabilities}> = []
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
  const modelsByProvider = React.useMemo(() => {
    const grouped: Record<string, Array<{provider: string, model: string, providerName: string, capabilities?: ModelCapabilities}>> = {}
    availableModels.forEach(model => {
      if (!grouped[model.providerName]) {
        grouped[model.providerName] = []
      }
      grouped[model.providerName].push(model)
    })
    
    // Sort providers alphabetically
    const sortedProviders: Record<string, Array<{provider: string, model: string, providerName: string, capabilities?: ModelCapabilities}>> = {}
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
  }, [conversation, availableModels, settings?.defaultProvider])

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 100)
    }
  }, [conversation?.id])

  // Set up streaming event listeners
  useEffect(() => {
    const handleStreamStart = ({ conversationId }: { conversationId: string; streamId: string }) => {
      setStreaming(conversationId)
    }

    const handleStreamChunk = ({ chunk }: { streamId: string; chunk: string }) => {
      // First chunk received - we can stop showing loading indicator
      if (isLoading) {
        setIsLoading(false)
      }
      setStreamingMessage(prev => prev + chunk)
    }

    const handleStreamEnd = () => {
      // Streaming finished, add the complete message
      if (streamingMessage && conversation) {
        addMessage(conversation.id, {
          role: 'assistant',
          content: streamingMessage
          // Note: usage and cost are now calculated dynamically, not stored
        })
      }
      setStreamingMessage('')
      setStreaming(null)
      // Don't need to set isLoading(false) here since it's already false from first chunk
    }

    const handleStreamError = ({ error }: { streamId: string; error: Error }) => {
      console.error('Stream error:', error)
      addToast({
        type: 'error',
        title: 'Message Failed',
        message: error.message || 'Failed to get response from the model. Please check your provider configuration.',
        duration: 7000
      })
      setStreamingMessage('')
      setIsLoading(false)
      setStreaming(null)
    }

    const handleStreamCancelled = (): void => {
      // Save any partial response that was streamed before cancellation
      if (streamingMessage && conversation) {
        addMessage(conversation.id, {
          role: 'assistant',
          content: streamingMessage
        })
      }
      
      setStreamingMessage('')
      setIsLoading(false)
      setStreaming(null)
    }

    // Add event listeners
    window.electronAPI.llm.onStreamStart(handleStreamStart)
    window.electronAPI.llm.onStreamChunk(handleStreamChunk)
    window.electronAPI.llm.onStreamEnd(handleStreamEnd)
    window.electronAPI.llm.onStreamError(handleStreamError)
    window.electronAPI.llm.onStreamCancelled(handleStreamCancelled)

    // Cleanup
    return () => {
      window.electronAPI.llm.removeStreamListeners()
    }
  }, [streamingMessage, conversation, addMessage, addToast, setStreaming, isLoading])

  const handleSend = async (attachments?: Array<{path: string, base64: string, mimeType: string, name: string, type: 'image' | 'audio' | 'file'}>) => {
    if ((!message.trim() && !attachments?.length) || isLoading) return
    
    // Require a model to be selected
    if (!selectedModel || !selectedModel.model) {
      return
    }
    
    setIsLoading(true)
    
    try {
      let currentConversation = conversation
      
      // If conversation is temporary, update it with the selected model
      if (currentConversation?.isTemporary) {
        currentConversation = {
          ...currentConversation,
          provider: selectedModel.provider,
          model: selectedModel.model
        }
        // Update the store with the new model info
        const { selectConversation } = useConversationStore.getState()
        selectConversation(currentConversation)
      }
      
      // If no conversation exists and we have a selected model, create a temporary one
      if (!currentConversation && selectedModel) {
        // Use the createConversation from the store to create a temporary conversation
        const { createConversation } = useConversationStore.getState()
        await createConversation(selectedModel.provider, selectedModel.model)
        currentConversation = useConversationStore.getState().selectedConversation
      }
      
      if (!currentConversation) return
      
      const userMessage = message.trim()
      
      // Add user message to conversation with attachments
      await addMessage(currentConversation.id, {
        role: 'user',
        content: userMessage,
        attachments: attachments?.map(att => ({
          type: att.type,
          path: att.path,
          mimeType: att.mimeType
        }))
      })
      setMessage('')
      
      // Get updated conversation with all messages for context
      const updatedConversation = useConversationStore.getState().selectedConversation
      if (!updatedConversation) return
      
      // Prepare messages for LLM (convert to the format expected by the API)
      const llmMessages: Array<{role: 'user' | 'assistant', content: string | Array<{type: string, text?: string, source?: any}>}> = updatedConversation.messages.map(msg => {
        let content = msg.content
        
        // For the user message we just added, include file content if there are attachments
        if (msg.role === 'user' && attachments?.length && msg === updatedConversation.messages[updatedConversation.messages.length - 1]) {
          // Create multimodal content for the latest user message with attachments
          const contentParts = []
          
          // Add text content if present
          if (content.trim()) {
            contentParts.push({
              type: 'text',
              text: content
            })
          }
          
          // Add file attachments
          attachments.forEach(attachment => {
            if (attachment.type === 'image') {
              contentParts.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: attachment.mimeType,
                  data: attachment.base64
                }
              })
            } else if (attachment.type === 'audio') {
              // For audio files, add as text description for now
              // Different providers handle audio differently
              contentParts.push({
                type: 'text',
                text: `[Audio file: ${attachment.name}]`
              })
            } else {
              // Handle different file types
              if (attachment.mimeType.startsWith('text/') || 
                  attachment.mimeType === 'application/json' ||
                  attachment.mimeType === 'application/javascript' ||
                  attachment.mimeType === 'application/xml') {
                // Text-based files - decode and include content
                try {
                  const fileContent = atob(attachment.base64)
                  contentParts.push({
                    type: 'text',
                    text: `File: ${attachment.name}\n\`\`\`\n${fileContent}\n\`\`\``
                  })
                } catch (e) {
                  contentParts.push({
                    type: 'text',
                    text: `[File: ${attachment.name} - Unable to decode content]`
                  })
                }
              } else if (attachment.mimeType === 'application/pdf') {
                // PDF files - send as base64 using Anthropic's document format
                // This works with Claude and other models that support PDF processing
                contentParts.push({
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: attachment.mimeType,
                    data: attachment.base64
                  }
                })
              } else if (attachment.mimeType.includes('document') ||
                        attachment.mimeType.includes('spreadsheet') ||
                        attachment.mimeType.includes('presentation') ||
                        attachment.mimeType.includes('officedocument')) {
                // Other document files - provide better description and offer to process
                contentParts.push({
                  type: 'text',
                  text: `I've received a document file: ${attachment.name} (${attachment.mimeType}). This appears to be a ${
                    attachment.mimeType.includes('spreadsheet') ? 'spreadsheet' :
                    attachment.mimeType.includes('presentation') ? 'presentation' :
                    'document'
                  } file. Please let me know if you'd like me to help you with anything specific about this file.`
                })
              } else {
                // Other binary files - show as placeholder
                contentParts.push({
                  type: 'text',
                  text: `[File: ${attachment.name} - Binary file not displayed]`
                })
              }
            }
          })
          
          return {
            role: msg.role,
            content: contentParts.length === 1 && contentParts[0].type === 'text' 
              ? contentParts[0].text 
              : contentParts
          }
        }
        
        return {
          role: msg.role,
          content: content
        }
      })
      
      // Reset streaming message for new response
      setStreamingMessage('')
      
      // Send to LLM with streaming
      const result = await window.electronAPI.llm.sendMessage({
        conversationId: updatedConversation.id,
        provider: selectedModel.provider,
        model: selectedModel.model,
        messages: llmMessages as any,
        stream: true
      })
      
      // For streaming, result contains streamId, actual response comes via events
      if (typeof result === 'string' || !result?.streamId) {
        // Fallback to non-streaming if streaming failed
        const response = await window.electronAPI.llm.sendMessage({
          conversationId: updatedConversation.id,
          provider: selectedModel.provider,
          model: selectedModel.model,
          messages: llmMessages as any,
          stream: false
        })
        
        if (response && typeof response === 'string') {
          await addMessage(currentConversation.id, {
            role: 'assistant',
            content: response
          })
        }
        setIsLoading(false)
      }
      // For successful streaming, don't set isLoading(false) here - let the first chunk handle it
      // But set a safety timeout in case streaming never starts
      if (typeof result === 'object' && result?.streamId) {
        setTimeout(() => {
          if (isLoading && !streamingMessage) {
            console.warn('Streaming timeout - no chunks received')
            setIsLoading(false)
          }
        }, 10000) // 10 second timeout
      }
    } catch (error) {
      console.error('Error sending message to LLM:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response from the model. Please check your provider configuration.'
      addToast({
        type: 'error',
        title: 'Message Failed',
        message: errorMessage,
        duration: 7000
      })
      setIsLoading(false)
    }
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
        value={message}
        onChange={setMessage}
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