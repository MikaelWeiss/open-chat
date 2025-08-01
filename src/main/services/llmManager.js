const { spawn } = require('child_process')
const { TokenCounter } = require('./tokenCounter')
const { PricingManager } = require('./pricingManager')
const { ModelCapabilityDetector } = require('./modelCapabilityDetector')

class LLMManager {
  constructor() {
    this.settingsManager = null
    this.localLLMProcess = null
    this.activeStreamControllers = new Map()
    this.tokenCounter = new TokenCounter()
    this.pricingManager = new PricingManager()
    this.capabilityDetector = new ModelCapabilityDetector()
  }

  async parseApiError(response, providerName) {
    // Start with enhanced status-based message as fallback
    let errorMessage = `${providerName} API error: ${response.statusText}`
    
    // Enhance status-based messages immediately
    if (response.status === 404) {
      errorMessage = `${providerName} API error: Resource not found (404) - This usually means the model doesn't exist or isn't available`
    } else if (response.status === 401) {
      errorMessage = `${providerName} API error: Unauthorized (401) - Please check your API key`
    } else if (response.status === 403) {
      errorMessage = `${providerName} API error: Forbidden (403) - API key may lack required permissions`
    } else if (response.status === 429) {
      errorMessage = `${providerName} API error: Rate limited (429) - Please wait before trying again`
    } else if (response.status >= 500) {
      errorMessage = `${providerName} API error: Server error (${response.status}) - The service may be temporarily unavailable`
    }
    
    try {
      // Try to get more detailed error info from response body
      const responseClone = response.clone()
      const errorText = await responseClone.text()
      
      if (errorText && errorText.trim()) {
        // Try to parse as JSON
        try {
          const errorBody = JSON.parse(errorText)
          
          // Parse different error formats
          if (errorBody.error) {
            if (typeof errorBody.error === 'string') {
              errorMessage = `${providerName} API error: ${errorBody.error}`
            } else if (errorBody.error.message) {
              errorMessage = `${providerName} API error: ${errorBody.error.message}`
            } else if (errorBody.error.code && errorBody.error.message) {
              errorMessage = `${providerName} API error (${errorBody.error.code}): ${errorBody.error.message}`
            }
          } else if (errorBody.message) {
            errorMessage = `${providerName} API error: ${errorBody.message}`
          } else if (errorBody.detail) {
            errorMessage = `${providerName} API error: ${errorBody.detail}`
          }
        } catch (jsonError) {
          // If not JSON, use the text directly (truncated)
          if (errorText.length > 100) {
            errorMessage = `${providerName} API error: ${errorText.substring(0, 200)}...`
          } else {
            errorMessage = `${providerName} API error: ${errorText}`
          }
        }
      }
      
      // Add helpful context for common error patterns
      if (errorMessage.toLowerCase().includes('model') && errorMessage.toLowerCase().includes('does not exist')) {
        errorMessage += ' - Please check if the model name is correct and available'
      } else if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('quota')) {
        errorMessage += ' - Please wait before trying again or check your usage limits'
      } else if (errorMessage.toLowerCase().includes('authentication') || errorMessage.toLowerCase().includes('unauthorized')) {
        errorMessage += ' - Please check your API key is valid and has proper permissions'
      }
      
    } catch (parseError) {
      // If all parsing fails, we already have the enhanced status message
      console.warn('Failed to parse API error response:', parseError)
    }
    
    return errorMessage
  }

  async initialize(settingsManager) {
    this.settingsManager = settingsManager
  }

  async getAvailableProviders() {
    const settings = await this.settingsManager.getSettings()
    const providers = []
    
    for (const [key, config] of Object.entries(settings.providers)) {
      if (config.configured) {
        providers.push({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          models: config.models || []
        })
      }
    }
    
    return providers
  }

  async fetchModelsFromProvider(providerId) {
    const settings = await this.settingsManager.getSettings()
    const config = settings.providers[providerId]
    
    if (!config || !config.configured) {
      throw new Error(`Provider ${providerId} is not configured`)
    }

    try {
      let response
      let modelIds = []
      
      switch (providerId) {
        case 'openai':
        case 'groq':
        case 'openrouter':
        case 'google-gemini':
        case 'inceptionlabs':
          response = await fetch(`${config.endpoint}/models`, {
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json'
            }
          })
          break
          
        case 'anthropic':
          response = await fetch(`${config.endpoint}/models`, {
            headers: {
              'x-api-key': config.apiKey,
              'anthropic-version': '2023-06-01'
            }
          })
          break
          
        case 'deepinfra':
          // Return predefined models for DeepInfra instead of making API call
          modelIds = [
            // Latest Featured Models
            'zai-org/GLM-4.5',
            'zai-org/GLM-4.5-Air',
            'moonshotai/Kimi-K2-Instruct',
            
            // DeepSeek Models
            'deepseek-ai/DeepSeek-V3-0324',
            'deepseek-ai/DeepSeek-V3-0324-Turbo',
            'deepseek-ai/DeepSeek-V3',
            'deepseek-ai/DeepSeek-R1-0528',
            'deepseek-ai/DeepSeek-R1-0528-Turbo',
            'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
            
            // Qwen Models
            'Qwen/Qwen3-Coder-480B-A35B-Instruct',
            'Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo',
            'Qwen/Qwen3-235B-A22B-Thinking-2507',
            'Qwen/Qwen3-235B-A22B-Instruct-2507',
            'Qwen/Qwen3-32B',
            'Qwen/Qwen3-30B-A3B',
            'Qwen/Qwen3-14B',
            'Qwen/QwQ-32B',
            
            // Meta Llama Models
            'meta-llama/Llama-4-Maverick-17B-128E-Instruct-Turbo',
            'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
            'meta-llama/Llama-4-Scout-17B-16E-Instruct',
            'meta-llama/Llama-3.3-70B-Instruct',
            'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            'meta-llama/Llama-Guard-4-12B',
            
            // Mistral Models
            'mistralai/Mistral-Small-3.2-24B-Instruct-2506',
            'mistralai/Devstral-Small-2507',
            'mistralai/Mixtral-8x7B-Instruct-v0.1',
            
            // Google Models
            'google/gemini-2.5-flash',
            'google/gemini-2.5-pro',
            'google/gemma-3-27b-it',
            'google/gemma-3-12b-it',
            'google/gemma-3-4b-it',
            
            // Anthropic Models
            'anthropic/claude-4-opus',
            'anthropic/claude-4-sonnet',
            
            // Microsoft Models
            'microsoft/phi-4',
            
            // Other Popular Models
            'Gryphe/MythoMax-L2-13b'
          ]
          break
          
        case 'local':
          response = await fetch(`${config.endpoint}/v1/models`, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
          break
          
        default:
          // For custom providers, try OpenAI-compatible endpoint
          response = await fetch(`${config.endpoint}/models`, {
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json'
            }
          })
      }
      
      // Extract model IDs from response if we made an API call
      if (response) {
        if (!response.ok) {
          const errorMessage = await this.parseApiError(response, providerId.charAt(0).toUpperCase() + providerId.slice(1))
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        modelIds = data.data ? data.data.map(model => model.id) : []
      }
      
      // Fetch capabilities for all models from OpenRouter
      let freshModelCapabilities = {}
      try {
        freshModelCapabilities = await this.capabilityDetector.getCapabilitiesForModels(modelIds)
      } catch (error) {
        // Continue without capabilities data - we'll just show models without capability icons
        freshModelCapabilities = {}
      }
      
      // Update settings with both models and capabilities, preserving manual overrides
      const currentSettings = await this.settingsManager.getSettings()
      const existingCapabilities = currentSettings.providers[providerId]?.modelCapabilities || {}
      
      // Merge fresh capabilities with existing manual overrides
      const mergedCapabilities = {}
      for (const modelId of modelIds) {
        const freshCaps = freshModelCapabilities[modelId]
        const existingCaps = existingCapabilities[modelId]
        
        if (freshCaps) {
          mergedCapabilities[modelId] = {
            ...freshCaps,
            // Apply manual overrides if they exist
            ...(existingCaps?.manualOverrides && {
              vision: existingCaps.manualOverrides.vision !== undefined ? existingCaps.manualOverrides.vision : freshCaps.vision,
              audio: existingCaps.manualOverrides.audio !== undefined ? existingCaps.manualOverrides.audio : freshCaps.audio,
              files: existingCaps.manualOverrides.files !== undefined ? existingCaps.manualOverrides.files : freshCaps.files,
              manualOverrides: existingCaps.manualOverrides
            })
          }
        }
      }
      
      const updatedProviders = {
        ...currentSettings.providers,
        [providerId]: {
          ...currentSettings.providers[providerId],
          models: modelIds,
          modelCapabilities: mergedCapabilities,
          lastCapabilityUpdate: new Date().toISOString()
        }
      }
      
      await this.settingsManager.updateSettings({ providers: updatedProviders })
      
      return modelIds
      
    } catch (error) {
      throw error
    }
  }

  async getCompletion(provider, model, messages) {
    const config = this.settingsManager.getProviderConfig(provider)
    
    if (!config || !config.configured) {
      throw new Error(`Provider ${provider} is not configured`)
    }

    switch (provider) {
      case 'openai':
      case 'groq':
      case 'openrouter':
      case 'xai':
      case 'deepinfra':
      case 'fireworks':
      case 'together':
      case 'inceptionlabs':
        return await this.openAICompletion(config, model, messages)
      case 'anthropic':
        return await this.anthropicCompletion(config, model, messages)
      case 'google-gemini':
        return await this.googleGeminiCompletion(config, model, messages)
      case 'ollama':
      case 'vllm':
      case 'llamacpp':
      case 'local':
        return await this.localLLMCompletion(config, model, messages)
      default:
        // For custom providers, try OpenAI-compatible API
        return await this.openAICompletion(config, model, messages)
    }
  }

  async streamCompletion(conversationId, provider, model, messages, onChunk, onError, onEnd) {
    const config = this.settingsManager.getProviderConfig(provider)
    
    if (!config || !config.configured) {
      onError(new Error(`Provider ${provider} is not configured`))
      return
    }

    const controller = new AbortController()
    this.activeStreamControllers.set(conversationId, controller)

    try {
      switch (provider) {
        case 'openai':
        case 'groq':
        case 'openrouter':
        case 'xai':
        case 'deepinfra':
        case 'fireworks':
        case 'together':
        case 'inceptionlabs':
          await this.openAIStream(config, model, messages, controller.signal, onChunk, onError, onEnd)
          break
        case 'anthropic':
          await this.anthropicStream(config, model, messages, controller.signal, onChunk, onError, onEnd)
          break
        case 'google-gemini':
          await this.googleGeminiStream(config, model, messages, controller.signal, onChunk, onError, onEnd)
          break
        case 'ollama':
        case 'vllm':
        case 'llamacpp':
        case 'local':
          await this.localLLMStream(config, model, messages, controller.signal, onChunk, onError, onEnd)
          break
        default:
          // For custom providers, try OpenAI-compatible streaming
          await this.openAIStream(config, model, messages, controller.signal, onChunk, onError, onEnd)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Stream was cancelled, this is expected
        return
      }
      onError(error)
    } finally {
      this.activeStreamControllers.delete(conversationId)
    }
  }

  cancelStream(conversationId) {
    const controller = this.activeStreamControllers.get(conversationId)
    if (controller) {
      controller.abort()
      this.activeStreamControllers.delete(conversationId)
      return true
    }
    return false
  }

  async openAICompletion(config, model, messages) {
    const response = await fetch(`${config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorMessage = await this.parseApiError(response, 'OpenAI')
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    // Extract usage information
    const usage = this.tokenCounter.parseUsageFromResponse(data, 'openai')
    const cost = usage ? this.pricingManager.calculateCost('openai', model, usage.promptTokens, usage.completionTokens) : null
    
    return {
      content: data.choices[0].message.content,
      usage,
      cost
    }
  }

  async openAIStream(config, model, messages, signal, onChunk, onError, onEnd) {
    try {
      // Count input tokens
      const inputTokens = this.tokenCounter.countMessageTokens(messages, 'openai', model)
      let outputTokens = 0
      let accumulatedContent = ''

      const response = await fetch(`${config.endpoint}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          stream: true
        })
      })

      if (!response.ok) {
        const errorMessage = await this.parseApiError(response, 'OpenAI')
        throw new Error(errorMessage)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              // Calculate final usage and cost
              outputTokens = this.tokenCounter.countTokens(accumulatedContent, 'openai', model)
              const cost = this.pricingManager.calculateCost('openai', model, inputTokens, outputTokens)
              
              onEnd({
                usage: { promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens },
                cost
              })
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                accumulatedContent += content
                onChunk(content)
              }
              
              // Some providers send usage in the final chunk
              if (parsed.usage) {
                const usage = this.tokenCounter.parseUsageFromResponse(parsed, 'openai')
                if (usage) {
                  const cost = this.pricingManager.calculateCost('openai', model, usage.promptTokens, usage.completionTokens)
                  onEnd({ usage, cost })
                  return
                }
              }
            } catch (e) {
              console.warn('Failed to parse streaming JSON chunk:', data, e)
              // Continue processing other chunks
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Stream was cancelled, don't call onError - this is handled by the cancel handler
        return
      }
      onError(error)
    }
  }

  async anthropicCompletion(config, model, messages) {
    // Convert OpenAI format to Anthropic format
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))

    const response = await fetch(`${config.endpoint}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages: anthropicMessages,
        max_tokens: 1024
      })
    })

    if (!response.ok) {
      const errorMessage = await this.parseApiError(response, 'Anthropic')
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    // Extract usage information
    const usage = this.tokenCounter.parseUsageFromResponse(data, 'anthropic')
    const cost = usage ? this.pricingManager.calculateCost('anthropic', model, usage.promptTokens, usage.completionTokens) : null
    
    return {
      content: data.content[0].text,
      usage,
      cost
    }
  }

  async anthropicStream(config, model, messages, signal, onChunk, onError, onEnd) {
    try {
      // Convert OpenAI format to Anthropic format
      const anthropicMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))

      // Count input tokens
      const inputTokens = this.tokenCounter.countMessageTokens(messages, 'anthropic', model)
      let accumulatedContent = ''
      let finalUsage = null

      const response = await fetch(`${config.endpoint}/messages`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          messages: anthropicMessages,
          max_tokens: 1024,
          stream: true
        })
      })

      if (!response.ok) {
        const errorMessage = await this.parseApiError(response, 'Anthropic')
        throw new Error(errorMessage)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Add new chunk to buffer
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete lines from buffer
        const lines = buffer.split('\n')
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.trim() === '') continue
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              const outputTokens = this.tokenCounter.countTokens(accumulatedContent, 'anthropic', model)
              const cost = this.pricingManager.calculateCost('anthropic', model, inputTokens, outputTokens)
              
              onEnd({
                usage: finalUsage || { promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens },
                cost
              })
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                accumulatedContent += parsed.delta.text
                onChunk(parsed.delta.text)
              } else if (parsed.type === 'message_stop') {
                const outputTokens = this.tokenCounter.countTokens(accumulatedContent, 'anthropic', model)
                const cost = this.pricingManager.calculateCost('anthropic', model, inputTokens, outputTokens)
                
                onEnd({
                  usage: finalUsage || { promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens },
                  cost
                })
                return
              } else if (parsed.type === 'message_delta' && parsed.usage) {
                // Anthropic provides usage info in message_delta events
                finalUsage = this.tokenCounter.parseUsageFromResponse({ usage: parsed.usage }, 'anthropic')
              } else if (parsed.type === 'message_start' && parsed.message?.usage) {
                // Extract usage from message_start event
                finalUsage = this.tokenCounter.parseUsageFromResponse({ usage: parsed.message.usage }, 'anthropic')
              } else if (parsed.type === 'error') {
                console.error('Anthropic streaming error:', parsed.error)
                onError(new Error(parsed.error?.message || 'Streaming error'))
                return
              }
            } catch (e) {
              // Only log if it's not just an incomplete JSON chunk
              if (data.length > 10) {
                console.warn('Failed to parse Anthropic streaming JSON chunk:', data.substring(0, 100) + '...', e.message)
              }
              // Continue processing other chunks
            }
          }
        }
      }
      
      // Process any remaining data in buffer
      if (buffer.trim() && buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim()
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'message_delta' && parsed.usage) {
              finalUsage = this.tokenCounter.parseUsageFromResponse({ usage: parsed.usage }, 'anthropic')
            }
          } catch (e) {
            // Ignore final buffer parsing errors
          }
        }
      }
      
      const outputTokens = this.tokenCounter.countTokens(accumulatedContent, 'anthropic', model)
      const cost = this.pricingManager.calculateCost('anthropic', model, inputTokens, outputTokens)
      
      onEnd({
        usage: finalUsage || { promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens },
        cost
      })
    } catch (error) {
      if (error.name === 'AbortError') {
        // Stream was cancelled, don't call onError - this is handled by the cancel handler
        return
      }
      onError(error)
    }
  }

  async googleGeminiCompletion(config, model, messages) {
    // Google Gemini uses OpenAI-compatible format
    const response = await fetch(`${config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorMessage = await this.parseApiError(response, 'Google Gemini')
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async googleGeminiStream(config, model, messages, signal, onChunk, onError, onEnd) {
    try {
      const response = await fetch(`${config.endpoint}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          stream: true
        })
      })

      if (!response.ok) {
        const errorMessage = await this.parseApiError(response, 'Google Gemini')
        throw new Error(errorMessage)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onEnd()
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.choices?.[0]?.delta?.content) {
                onChunk(parsed.choices[0].delta.content)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      onEnd()
    } catch (error) {
      if (error.name === 'AbortError') {
        // Stream was cancelled, don't call onError - this is handled by the cancel handler
        return
      }
      onError(error)
    }
  }

  async localLLMCompletion(config, model, messages) {
    // Start local LLM if needed
    await this.ensureLocalLLMRunning(config)

    // Make request to local endpoint
    const response = await fetch(`${config.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorMessage = await this.parseApiError(response, 'Local LLM')
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async localLLMStream(config, model, messages, signal, onChunk, onError, onEnd) {
    try {
      // Start local LLM if needed
      await this.ensureLocalLLMRunning(config)

      const response = await fetch(`${config.endpoint}/v1/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          stream: true
        })
      })

      if (!response.ok) {
        const errorMessage = await this.parseApiError(response, 'Local LLM')
        throw new Error(errorMessage)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onEnd()
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                onChunk(parsed.choices[0].delta.content)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      onEnd()
    } catch (error) {
      if (error.name === 'AbortError') {
        // Stream was cancelled, don't call onError - this is handled by the cancel handler
        return
      }
      onError(error)
    }
  }

  async ensureLocalLLMRunning(config) {
    if (!config.startCommand) return

    // Check if already running
    try {
      const response = await fetch(`${config.endpoint}/health`)
      if (response.ok) return
    } catch (e) {
      // Not running, start it
    }

    // Start the local LLM
    this.localLLMProcess = spawn(config.startCommand, [], {
      shell: true,
      detached: true
    })

    // Wait for it to be ready
    let attempts = 0
    while (attempts < 30) {
      try {
        const response = await fetch(`${config.endpoint}/health`)
        if (response.ok) return
      } catch (e) {
        // Still starting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }

    throw new Error('Failed to start local LLM')
  }

  /**
   * Calculate usage and cost for a set of messages
   * @param {string} provider - The provider name
   * @param {string} model - The model name
   * @param {Array} messages - Array of message objects
   * @returns {Promise<{usage: {promptTokens: number, completionTokens: number, totalTokens: number}, cost: number}>}
   */
  async calculateUsageForMessages(provider, model, messages) {
    let totalPromptTokens = 0
    let totalCompletionTokens = 0
    let totalCost = 0

    for (const message of messages) {
      if (message.role === 'user' || message.role === 'system') {
        // Count input tokens
        const tokens = this.tokenCounter.countTokens(message.content || '', provider, model)
        totalPromptTokens += tokens
        
        // Calculate input cost
        const cost = this.pricingManager.calculateCost(provider, model, tokens, 0)
        if (cost !== null) {
          totalCost += cost
        }
      } else if (message.role === 'assistant') {
        // Count output tokens
        const tokens = this.tokenCounter.countTokens(message.content || '', provider, model)
        totalCompletionTokens += tokens
        
        // Calculate output cost
        const cost = this.pricingManager.calculateCost(provider, model, 0, tokens)
        if (cost !== null) {
          totalCost += cost
        }
      }
    }

    const totalTokens = totalPromptTokens + totalCompletionTokens

    return {
      usage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens
      },
      cost: totalCost
    }
  }
}

module.exports = { LLMManager }