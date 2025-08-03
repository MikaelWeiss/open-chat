import { useState, useEffect, useRef } from 'react'
import type { Conversation } from '@/types/electron'
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
  const streamingMessageRef = useRef('')


  // Keep the ref in sync with the state
  useEffect(() => {
    streamingMessageRef.current = streamingMessage
  }, [streamingMessage])

  // Set up streaming event listeners
  useEffect(() => {
    const handleStreamStart = ({ conversationId }: { conversationId: string; streamId: string }) => {
      useConversationStore.getState().setStreaming(conversationId)
    }

    const handleStreamChunk = ({ chunk }: { streamId: string; chunk: string }) => {
      // First chunk received - we can stop showing loading indicator
      setIsLoading(false)
      setStreamingMessage(prev => prev + chunk)
    }

    const handleStreamEnd = () => {
      // Streaming finished, add the complete message
      if (streamingMessageRef.current) {
        const currentConversation = useConversationStore.getState().selectedConversation
        if (currentConversation) {
          useConversationStore.getState().addMessage(currentConversation.id, {
            role: 'assistant',
            content: streamingMessageRef.current
          })
        }
      }
      setStreamingMessage('')
      setIsLoading(false)
      useConversationStore.getState().setStreaming(null)
    }

    const handleStreamError = ({ error }: { streamId: string; error: Error }) => {
      console.error('Stream error:', error)
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Message Failed',
        message: error.message || 'Failed to get response from the model. Please check your provider configuration.',
        duration: 7000
      })
      setStreamingMessage('')
      setIsLoading(false)
      useConversationStore.getState().setStreaming(null)
    }

    const handleStreamCancelled = (): void => {
      // Save any partial response that was streamed before cancellation
      if (streamingMessageRef.current) {
        const currentConversation = useConversationStore.getState().selectedConversation
        if (currentConversation) {
          useConversationStore.getState().addMessage(currentConversation.id, {
            role: 'assistant',
            content: streamingMessageRef.current
          })
        }
      }
      
      setStreamingMessage('')
      setIsLoading(false)
      useConversationStore.getState().setStreaming(null)
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
  }, [])

  const sendMessage = async (
    message: string, 
    selectedModel: {provider: string, model: string}, 
    conversation: Conversation | null,
    attachments?: FileAttachment[]
  ) => {
    if ((!message.trim() && !attachments?.length) || isLoading) return
    
    // Add small delay to prevent provider rate limiting/deduplication issues
    // This is specifically needed for providers like Moonshot AI that have issues with rapid successive requests
    await new Promise(resolve => setTimeout(resolve, 100))
    
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
      const isTemporary = currentConversation.id.startsWith('temp-')
      
      await useConversationStore.getState().addMessage(currentConversation.id, {
        role: 'user',
        content: userMessage,
        attachments: attachments?.map(att => ({
          type: att.type,
          path: att.path,
          mimeType: att.mimeType
        }))
      })
      
      // Get updated conversation - different handling for temp vs existing conversations
      let updatedConversation
      if (isTemporary) {
        // For temporary conversations, addMessage creates a real conversation and updates store
        updatedConversation = useConversationStore.getState().selectedConversation
        if (!updatedConversation) return
      } else {
        // For existing conversations, manually update to include new message immediately 
        // (fixes race condition where addMessage doesn't update selectedConversation state)
        const newMessage = {
          id: `temp-${Date.now()}`, // Temporary ID until saved
          role: 'user' as const,
          content: userMessage,
          timestamp: new Date().toISOString(),
          attachments: attachments?.map(att => ({
            type: att.type,
            path: att.path,
            mimeType: att.mimeType
          }))
        }
        
        updatedConversation = {
          ...currentConversation,
          messages: [...currentConversation.messages, newMessage],
          updatedAt: new Date().toISOString()
        }
        
        // Update the selected conversation state immediately
        useConversationStore.getState().selectConversation(updatedConversation)
      }
      
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
      streamingMessageRef.current = ''
      
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
          await useConversationStore.getState().addMessage(currentConversation.id, {
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
          // Check current loading state, not the captured value
          setIsLoading(currentIsLoading => {
            if (currentIsLoading && !streamingMessageRef.current) {
              console.warn('Streaming timeout - no chunks received')
              return false
            }
            return currentIsLoading
          })
        }, 10000) // 10 second timeout
      }
    } catch (error) {
      console.error('Error sending message to LLM:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response from the model. Please check your provider configuration.'
      useToastStore.getState().addToast({
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