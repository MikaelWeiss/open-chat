import { type CreateMessageInput } from '../shared/messageStore'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: { url: string }
  }>
}

interface OpenAIChatCompletionRequest {
  model: string
  messages: OpenAIMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
  top_p?: number
  top_k?: number
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

interface StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: {
      role?: 'assistant'
      content?: string
    }
    finish_reason?: string
  }[]
}

export interface SendMessageOptions {
  conversationId: number
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
      // Build OpenAI-compatible messages array
      const messages: OpenAIMessage[] = []
      
      // Add system message if provided
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        })
      }

      // Convert user message to OpenAI format
      const userContent = this.buildMessageContent(userMessage)
      messages.push({
        role: 'user',
        content: userContent
      })

      // Build request payload based on provider
      let requestPayload: any
      
      if (endpoint.includes('anthropic.com')) {
        // Anthropic API format
        requestPayload = {
          model,
          messages,
          stream: !!onStreamChunk,
          max_tokens: maxTokens || 1024,
          ...(temperature !== undefined && { temperature }),
          ...(topP !== undefined && { top_p: topP }),
          ...(topK !== undefined && { top_k: topK }),
        }
      } else {
        // OpenAI API format
        requestPayload = {
          model,
          messages,
          stream: !!onStreamChunk,
          ...(temperature !== undefined && { temperature }),
          ...(maxTokens !== undefined && { max_tokens: maxTokens }),
          ...(topP !== undefined && { top_p: topP }),
          ...(topK !== undefined && { top_k: topK }),
        }
      }

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add authentication based on provider
      if (!isLocal && apiKey) {
        if (endpoint.includes('anthropic.com')) {
          headers['x-api-key'] = apiKey
          headers['anthropic-version'] = '2023-06-01'
          headers['anthropic-dangerous-direct-browser-access'] = 'true'
        } else if (endpoint.includes('generativelanguage.googleapis.com')) {
          // Google AI uses query parameter auth
          // Will be handled in URL construction
        } else {
          // Standard OpenAI-compatible Bearer token
          headers['Authorization'] = `Bearer ${apiKey}`
        }
      }

      // Build endpoint URL
      let chatEndpoint: string
      if (endpoint.includes('anthropic.com')) {
        chatEndpoint = endpoint + '/messages'
      } else if (endpoint.includes('generativelanguage.googleapis.com')) {
        chatEndpoint = `${endpoint}:generateContent${apiKey ? `?key=${apiKey}` : ''}`
      } else if (endpoint.includes('ollama') || endpoint.includes('11434')) {
        chatEndpoint = endpoint.replace('/v1', '') + '/api/chat'
      } else {
        chatEndpoint = endpoint + '/chat/completions'
      }

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
          errorText = errorBody || response.statusText
        } catch (e) {
          // Ignore errors reading response body
        }
        throw new Error(`API call failed: ${response.status} ${errorText}`)
      }

      const processingTime = Date.now() - startTime

      if (requestPayload.stream) {
        return this.handleStreamResponse(response, {
          model,
          processingTime,
          onStreamChunk,
          onStreamComplete,
          isAnthropic: endpoint.includes('anthropic.com')
        })
      } else {
        return this.handleNonStreamResponse(response, {
          model,
          processingTime
        })
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request was cancelled')
      }
      console.error('Chat service error:', error)
      throw error instanceof Error ? error : new Error('Unknown chat service error')
    }
  }

  /**
   * Build OpenAI-compatible message content from our message format
   */
  private buildMessageContent(message: CreateMessageInput): string | Array<any> {
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
        content.push({
          type: 'image_url',
          image_url: {
            url: image.url || `data:${image.mime_type};base64,${image.file_path}`
          }
        })
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

      options.onStreamComplete?.(assistantMessage)
      return assistantMessage

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