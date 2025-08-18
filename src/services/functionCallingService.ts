import { toolService } from './toolService'
import { type CreateMessageInput } from '../shared/messageStore'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | Array<{ 
    type: 'text' | 'image_url'
    text?: string
    image_url?: { url: string }
  }> 
  tool_calls?: Array<{ 
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }> 
  tool_call_id?: string
  name?: string
}

interface ModelConfig {
  provider: string
  endpoint: string
  model: string
  apiKey?: string
  isLocal?: boolean
  temperature?: number
  maxTokens?: number
  topP?: number
  tools?: Array<{ 
    type: 'function'
    function: {
      name: string
      description: string
      parameters: any
    }
  }> 
}

class FunctionCallingService {
  /**
   * Execute a complete function calling loop with a model
   */
  async executeWithFunctionCalling({
    messages,
    modelConfig,
    maxToolCalls = 3,
    onStreamChunk,
    signal
  }: { 
    messages: OpenAIMessage[]
    modelConfig: ModelConfig
    maxToolCalls?: number
    onStreamChunk?: (content: string) => void
    signal?: AbortSignal
  }): Promise<CreateMessageInput> {
    let currentMessages = [...messages]
    let toolCallCount = 0
    let finalContent = ''
    let searchResultStartIndex = 1

    while (toolCallCount < maxToolCalls) {
      const response = await this.callModel({
        messages: currentMessages,
        modelConfig,
        signal
      })

      // Check if the response contains tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        toolCallCount++
        
        // Add assistant message with tool calls
        currentMessages.push({
          role: 'assistant',
          content: response.content || undefined,
          tool_calls: response.tool_calls
        })

        // Stream tool execution info if needed
        if (onStreamChunk) {
          const toolInfo = response.tool_calls.map(tc => {
            try {
              const args = JSON.parse(tc.function.arguments)
              return `🔍 Searching for: ${args.query || 'information'}`
            } catch {
              return `🔍 Searching...`
            }
          }).join('\n')
          onStreamChunk(toolInfo + '\n\n')
        }

        // Execute tool calls
        console.log('Executing tool calls:', response.tool_calls)
        const toolResults = await toolService.executeToolCalls(
          response.tool_calls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: tc.function
          }))
        )

        console.log('Tool results:', toolResults)

        // Add tool results to messages
        for (const result of toolResults) {
          let content = result.content
          if (result.name === 'web_search') {
            try {
              const searchOutput = JSON.parse(result.content)
              content = toolService.formatSearchResults(searchOutput, searchResultStartIndex)
              searchResultStartIndex += searchOutput.results.length
            } catch (e) {
              console.error('Could not parse search result content', e)
            }
          }
          currentMessages.push({
            role: 'tool',
            content: content,
            tool_call_id: result.tool_call_id,
            name: result.name
          })
        }

        console.log('Messages after tool execution:', currentMessages.slice(-3)) // Show last 3 messages

        // Continue the loop to get the final response
        continue
      } else {
        // No tool calls, this is the final response
        finalContent = response.content || ''
        if (onStreamChunk && finalContent) {
          onStreamChunk(finalContent)
        }
        break
      }
    }

    // Return the final assistant message
    return {
      role: 'assistant',
      text: finalContent,
      processing_time_ms: Date.now(),
      provider: modelConfig.provider,
      model: modelConfig.model
    }
  }

  /**
   * Make a single API call to the model
   */
  private async callModel({
    messages,
    modelConfig,
    signal
  }: { 
    messages: OpenAIMessage[]
    modelConfig: ModelConfig
    signal?: AbortSignal
  }): Promise<{ 
    content?: string
    tool_calls?: Array<{ 
      id: string
      type: 'function'
      function: {
        name: string
        arguments: string
      }
    }> 
  }> {
    const isAnthropic = modelConfig.endpoint.includes('anthropic.com')
    
    // Build request payload
    const requestPayload = isAnthropic ? {
      model: modelConfig.model,
      messages,
      stream: false, // Function calling is easier with non-streaming for now
      max_tokens: modelConfig.maxTokens || 1024,
      ...(modelConfig.temperature !== undefined && { temperature: modelConfig.temperature }),
      ...(modelConfig.topP !== undefined && { top_p: modelConfig.topP }),
      ...(modelConfig.tools && modelConfig.tools.length > 0 && { tools: modelConfig.tools }),
    } : {
      model: modelConfig.model,
      messages,
      stream: false,
      ...(modelConfig.temperature !== undefined && { temperature: modelConfig.temperature }),
      ...(modelConfig.maxTokens !== undefined && { max_tokens: modelConfig.maxTokens }),
      ...(modelConfig.topP !== undefined && { top_p: modelConfig.topP }),
      ...(modelConfig.tools && modelConfig.tools.length > 0 && { tools: modelConfig.tools }),
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add authentication based on provider
    if (!modelConfig.isLocal && modelConfig.apiKey) {
      if (isAnthropic) {
        headers['x-api-key'] = modelConfig.apiKey
        headers['anthropic-version'] = '2023-06-01'
        headers['anthropic-dangerous-direct-browser-access'] = 'true'
      } else {
        headers['Authorization'] = `Bearer ${modelConfig.apiKey}`
      }
    }

    // Build endpoint URL
    const chatEndpoint = this.buildChatEndpoint(modelConfig.endpoint)

    // Make the API call
    const response = await fetch(chatEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
      signal
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Parse response based on provider
    if (isAnthropic) {
      // Anthropic format
      return {
        content: data.content?.[0]?.text || '',
        tool_calls: data.tool_calls
      }
    } else {
      // OpenAI format
      const message = data.choices?.[0]?.message
      return {
        content: message?.content || '',
        tool_calls: message?.tool_calls
      }
    }
  }

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
}

// Export singleton instance
export const functionCallingService = new FunctionCallingService()