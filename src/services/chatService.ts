import { type CreateMessageInput, messageStore } from '../shared/messageStore'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: { url: string }
  }>
}


interface OpenAIChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}


export interface SendMessageOptions {
  conversationId: number | 'pending'
  userMessage: CreateMessageInput
  systemPrompt?: string
  provider: string
  endpoint: string
  model: string
  apiKey?: string
  isLocal?: boolean
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  onStreamChunk?: (content: string) => void
  onStreamComplete?: (assistantMessage: CreateMessageInput) => void
  signal?: AbortSignal
}

class ChatService {
  /**
   * Send a message to an OpenAI-compatible API and handle streaming response
   */
  async sendMessage({
    conversationId,
    userMessage,
    systemPrompt,
    endpoint,
    model,
    apiKey,
    isLocal = false,
    temperature,
    maxTokens,
    topP,
    topK,
    onStreamChunk,
    onStreamComplete,
    signal
  }: SendMessageOptions): Promise<CreateMessageInput> {
    const startTime = Date.now()

    try {
      // Get conversation history (only for persistent conversations)
      const conversationHistory = typeof conversationId === 'number' 
        ? await messageStore.getMessages(conversationId)
        : [] // Pending conversations have no history in database yet
      
      // Detect provider type for proper formatting
      const isAnthropic = endpoint.includes('anthropic.com')
      
      // Build provider-compatible messages array
      const messages: OpenAIMessage[] = []
      
      // Add system message if provided
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        })
      }

      // Add conversation history
      for (const message of conversationHistory) {
        if (message.role === 'system') continue // Skip system messages from history (we use systemPrompt)
        
        const content = this.buildMessageContent({
          role: message.role as 'user' | 'assistant',
          text: message.text || '',
          images: message.images || undefined,
          audio: message.audio || undefined,
          files: message.files || undefined
        }, isAnthropic)
        
        messages.push({
          role: message.role as 'user' | 'assistant',
          content
        })
      }

      // Convert current user message to provider format and add it
      const userContent = this.buildMessageContent(userMessage, isAnthropic)
      messages.push({
        role: 'user',
        content: userContent
      })

      // Build request payload based on provider
      const requestPayload = isAnthropic ? {
        model,
        messages,
        stream: !!onStreamChunk,
        max_tokens: maxTokens || 1024,
        ...(temperature !== undefined && { temperature }),
        ...(topP !== undefined && { top_p: topP }),
        ...(topK !== undefined && { top_k: topK }),
      } : {
        model,
        messages,
        stream: !!onStreamChunk,
        ...(temperature !== undefined && { temperature }),
        ...(maxTokens !== undefined && { max_tokens: maxTokens }),
        ...(topP !== undefined && { top_p: topP }),
        ...(topK !== undefined && { top_k: topK }),
      }

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add authentication based on provider
      if (!isLocal && apiKey) {
        if (isAnthropic) {
          headers['x-api-key'] = apiKey
          headers['anthropic-version'] = '2023-06-01'
          headers['anthropic-dangerous-direct-browser-access'] = 'true'
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`
        }
      }

      // Build endpoint URL
      const chatEndpoint = this.buildChatEndpoint(endpoint)

      // Make the API call
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
        signal
      })

      if (!response.ok) {
        let errorText = response.statusText
        try {
          const errorBody = await response.text()
          console.error('API Error Response:', errorBody)
          // Try to parse as JSON to extract error message
          try {
            const errorJson = JSON.parse(errorBody)
            if (errorJson.error?.message) {
              errorText = errorJson.error.message
            } else if (errorJson.message) {
              errorText = errorJson.message
            } else {
              errorText = errorBody || response.statusText
            }
          } catch {
            // Not JSON, use as-is
            errorText = errorBody || response.statusText
          }
        } catch (e) {
          // Ignore errors reading response body
        }
        throw new Error(errorText)
      }

      const processingTime = Date.now() - startTime

      if (requestPayload.stream) {
        return this.handleStreamResponse(response, {
          model,
          processingTime,
          onStreamChunk,
          onStreamComplete,
          isAnthropic
        })
      } else {
        return this.handleNonStreamResponse(response, {
          model,
          processingTime
        })
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // For AbortError, we don't throw - let the caller handle the cancellation
        // The partial message will be handled by the cancel handler
        return {
          role: 'assistant',
          text: '', // Empty since partial content is handled elsewhere
          processing_time_ms: Date.now() - startTime
        }
      }
      console.error('Chat service error:', error)
      
      // Provide user-friendly error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('A maximum of 100 PDF pages may be provided')) {
          throw new Error('PDF file is too large. Anthropic supports a maximum of 100 pages per PDF. Please try a smaller PDF file.')
        }
        if (error.message.includes('messages') && error.message.includes('content')) {
          throw new Error('There was an issue with the file attachment format. Please try again or use a different file.')
        }
        throw error
      }
      
      throw new Error('Unknown chat service error')
    }
  }

  /**
   * Build the appropriate chat endpoint URL based on provider
   */
  private buildChatEndpoint(endpoint: string): string {
    // Special case for Anthropic
    if (endpoint.includes('anthropic.com')) {
      return endpoint.endsWith('/v1') ? endpoint + '/messages' : endpoint + '/messages'
    }
    
    // Special case for Ollama
    if (endpoint.includes('ollama') || endpoint.includes('11434')) {
      return endpoint.replace('/v1', '') + '/api/chat'
    }
    
    // For OpenAI-compatible endpoints, ensure /chat/completions suffix
    if (endpoint.endsWith('/chat/completions')) {
      return endpoint
    }
    
    // Add appropriate suffix
    if (endpoint.endsWith('/v1')) {
      return endpoint + '/chat/completions'
    }
    
    // Default: append /chat/completions
    return endpoint + '/chat/completions'
  }

  /**
   * Build provider-compatible message content from our message format
   */
  private buildMessageContent(message: CreateMessageInput, isAnthropic: boolean = false): string | Array<any> {
    const content: Array<any> = []

    // Add text content
    if (message.text) {
      content.push({
        type: 'text',
        text: message.text
      })
    }

    // Add images
    if (message.images && message.images.length > 0) {
      for (const image of message.images) {
        if (isAnthropic) {
          // Anthropic format
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.mime_type || 'image/png',
              data: image.file_path || image.url?.split(',')[1] || ''
            }
          })
        } else {
          // OpenAI format
          content.push({
            type: 'image_url',
            image_url: {
              url: image.url || `data:${image.mime_type};base64,${image.file_path}`
            }
          })
        }
      }
    }

    // Note: Audio files are not directly supported in OpenAI chat completions API
    // They would need to be transcribed first or handled by specific providers
    if (message.audio && message.audio.length > 0) {
      const audioReference = message.audio.map(audio => `[Audio file: ${audio.file_path || 'audio'}.${audio.mime_type?.split('/')[1] || 'audio'}]`).join('\n')
      
      // Add audio reference to text content
      const existingTextIndex = content.findIndex(item => item.type === 'text')
      if (existingTextIndex >= 0) {
        content[existingTextIndex].text += '\n\n' + audioReference
      } else {
        content.push({
          type: 'text',
          text: audioReference
        })
      }
    }

    // Add document files
    if (message.files && message.files.length > 0) {
      for (const file of message.files) {
        if (isAnthropic && file.content) {
          // Check Anthropic-specific limits for PDFs
          if (file.type === 'application/pdf') {
            // Rough estimate: PDF file size > 10MB might exceed 100 page limit
            const estimatedSizeMB = (file.content.length * 0.75) / 1024 / 1024 // base64 is ~33% larger
            if (estimatedSizeMB > 10) {
              console.warn(`PDF file ${file.name} might be too large for Anthropic (estimated ${estimatedSizeMB.toFixed(1)}MB). Anthropic has a 100-page limit.`)
            }
          }
          
          // Anthropic format - use document type for PDF and other files
          content.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: file.type || 'application/octet-stream',
              data: file.content
            }
          })
        } else {
          // For other providers or when no content available, include as text
          let fileContent = ''
          
          // Check if we have base64 content for text files that we can decode
          if (file.content && file.type) {
            const isTextFile = file.type.startsWith('text/') || 
                              ['application/json', 'application/xml'].includes(file.type)
            
            if (isTextFile) {
              try {
                // Decode base64 to text for text-based files
                const decodedContent = atob(file.content)
                fileContent = `\n\n--- File: ${file.name} (${file.type}) ---\n${decodedContent}\n--- End of file ---\n`
              } catch (error) {
                console.warn('Failed to decode file content for:', file.name)
                fileContent = `\n\n[File: ${file.name} (${file.type}) - content not readable]\n`
              }
            } else {
              // For non-text files, just reference them
              fileContent = `\n\n[File attachment: ${file.name} (${file.type})]\n`
            }
          } else {
            // Fallback if no base64 data available
            fileContent = `\n\n[File: ${file.name} (${file.type})]\n`
          }
          
          // If there's already text content, append to it
          const existingTextIndex = content.findIndex(item => item.type === 'text')
          if (existingTextIndex >= 0) {
            content[existingTextIndex].text += fileContent
          } else {
            content.push({
              type: 'text',
              text: message.text ? message.text + fileContent : fileContent.trim()
            })
          }
        }
      }
    }

    // Return simple string if only text, otherwise return array
    return content.length === 1 && content[0].type === 'text' 
      ? content[0].text 
      : content
  }

  /**
   * Handle streaming response from API
   */
  private async handleStreamResponse(
    response: Response, 
    options: {
      model: string
      processingTime: number
      onStreamChunk?: (content: string) => void
      onStreamComplete?: (message: CreateMessageInput) => void
      isAnthropic?: boolean
    }
  ): Promise<CreateMessageInput> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader available')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let wasAborted = false

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const chunk = JSON.parse(data)
              let deltaContent = ''
              
              if (options.isAnthropic) {
                // Anthropic streaming format
                if (chunk.type === 'content_block_delta') {
                  deltaContent = chunk.delta?.text || ''
                }
              } else {
                // OpenAI streaming format
                deltaContent = chunk.choices?.[0]?.delta?.content || ''
              }
              
              if (deltaContent) {
                fullContent += deltaContent
                options.onStreamChunk?.(deltaContent)
              }
            } catch (err) {
              console.warn('Failed to parse streaming chunk:', err)
            }
          }
        }
      }

      // Build final assistant message
      const assistantMessage: CreateMessageInput = {
        role: 'assistant',
        text: fullContent,
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens,
        processing_time_ms: options.processingTime
      }

      // Only call onStreamComplete if not aborted (let the cancel handler save partial content)
      if (!wasAborted) {
        options.onStreamComplete?.(assistantMessage)
      }
      return assistantMessage

    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
        wasAborted = true
        // Don't call onStreamComplete for aborted requests - let the cancel handler deal with partial content
        // Still return the partial message for potential use
        return {
          role: 'assistant',
          text: fullContent,
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          processing_time_ms: options.processingTime
        }
      }
      throw error
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Handle non-streaming response from API
   */
  private async handleNonStreamResponse(
    response: Response,
    options: {
      model: string
      processingTime: number
    }
  ): Promise<CreateMessageInput> {
    const data: OpenAIChatCompletionResponse = await response.json()

    const assistantMessage: CreateMessageInput = {
      role: 'assistant',
      text: data.choices[0]?.message?.content || '',
      input_tokens: data.usage?.prompt_tokens,
      output_tokens: data.usage?.completion_tokens,
      processing_time_ms: options.processingTime
    }

    return assistantMessage
  }
}

// Export singleton instance
export const chatService = new ChatService()