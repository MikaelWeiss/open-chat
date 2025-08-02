import { useState, useEffect } from 'react'
import type { Conversation, Message } from '@/types/electron'
import { useConversationStore } from '@/stores/conversationStore'
import { useToastStore } from '@/stores/settingsStore'

interface FileAttachment {
  path: string
  base64: string
  mimeType: string
  name: string
  type: 'image' | 'audio' | 'file'
}

interface UseStreamingChatReturn {
  isLoading: boolean
  streamingMessage: string
  sendMessage: (
    message: string, 
    selectedModel: {provider: string, model: string}, 
    conversation: Conversation | null,
    attachments?: FileAttachment[]
  ) => Promise<void>
}

export function useStreamingChat(): UseStreamingChatReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const { addMessage, setStreaming } = useConversationStore()
  const { addToast } = useToastStore()

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
      if (streamingMessage) {
        const currentConversation = useConversationStore.getState().selectedConversation
        if (currentConversation) {
          addMessage(currentConversation.id, {
            role: 'assistant',
            content: streamingMessage
          })
        }
      }
      setStreamingMessage('')
      setStreaming(null)
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
      if (streamingMessage) {
        const currentConversation = useConversationStore.getState().selectedConversation
        if (currentConversation) {
          addMessage(currentConversation.id, {
            role: 'assistant',
            content: streamingMessage
          })
        }
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
  }, [streamingMessage, addMessage, addToast, setStreaming, isLoading])

  const sendMessage = async (
    message: string, 
    selectedModel: {provider: string, model: string}, 
    conversation: Conversation | null,
    attachments?: FileAttachment[]
  ) => {
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

  return {
    isLoading,
    streamingMessage,
    sendMessage
  }
}