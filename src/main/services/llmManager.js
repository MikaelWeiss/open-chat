const { spawn } = require('child_process')

class LLMManager {
  constructor() {
    this.settingsManager = null
    this.localLLMProcess = null
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
      
      switch (providerId) {
        case 'openai':
        case 'groq':
        case 'openrouter':
          response = await fetch(`${config.endpoint}/models`, {
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json'
            }
          })
          break
          
        case 'anthropic':
          // Anthropic doesn't have a models endpoint, return known models
          return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022', 
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
          ]
          
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.data ? data.data.map(model => model.id) : []
      
    } catch (error) {
      console.error(`Error fetching models for ${providerId}:`, error)
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
        return await this.openAICompletion(config, model, messages)
      case 'anthropic':
        return await this.anthropicCompletion(config, model, messages)
      case 'local':
        return await this.localLLMCompletion(config, model, messages)
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  async streamCompletion(provider, model, messages, onChunk, onError, onEnd) {
    const config = this.settingsManager.getProviderConfig(provider)
    
    if (!config || !config.configured) {
      onError(new Error(`Provider ${provider} is not configured`))
      return
    }

    try {
      switch (provider) {
        case 'openai':
          await this.openAIStream(config, model, messages, onChunk, onError, onEnd)
          break
        case 'anthropic':
          await this.anthropicStream(config, model, messages, onChunk, onError, onEnd)
          break
        case 'local':
          await this.localLLMStream(config, model, messages, onChunk, onError, onEnd)
          break
        default:
          onError(new Error(`Unknown provider: ${provider}`))
      }
    } catch (error) {
      onError(error)
    }
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
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async openAIStream(config, model, messages, onChunk, onError, onEnd) {
    try {
      const response = await fetch(`${config.endpoint}/chat/completions`, {
        method: 'POST',
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
        throw new Error(`OpenAI API error: ${response.statusText}`)
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
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      onError(error)
    }
  }

  async anthropicCompletion(config, model, messages) {
    // Convert OpenAI format to Anthropic format
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))

    const response = await fetch(`${config.endpoint}/v1/messages`, {
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
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  async anthropicStream(config, model, messages, onChunk, onError, onEnd) {
    // Similar to anthropicCompletion but with streaming
    // Implementation would follow Anthropic's streaming API
    onError(new Error('Anthropic streaming not yet implemented'))
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
      throw new Error(`Local LLM API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async localLLMStream(config, model, messages, onChunk, onError, onEnd) {
    // Similar to openAIStream but for local endpoint
    onError(new Error('Local LLM streaming not yet implemented'))
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
}

module.exports = { LLMManager }