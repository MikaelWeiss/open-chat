const { get_encoding } = require('tiktoken')
const { countTokens } = require('@anthropic-ai/tokenizer')

class TokenCounter {
  constructor() {
    // Cache encodings to avoid recreating them
    this.encodings = new Map()
  }

  /**
   * Get the appropriate encoding for a model
   * @param {string} provider - The provider name
   * @param {string} model - The model name
   * @returns {Object} The encoding object
   */
  getEncoding(provider, model) {
    const key = `${provider}-${model}`
    
    if (this.encodings.has(key)) {
      return this.encodings.get(key)
    }

    let encoding
    
    switch (provider) {
      case 'openai':
        if (model.includes('gpt-4') || model.includes('gpt-3.5')) {
          encoding = get_encoding('cl100k_base')
        } else {
          encoding = get_encoding('cl100k_base') // Default for OpenAI
        }
        break
      case 'anthropic':
        // Anthropic uses their own tokenizer
        encoding = 'anthropic'
        break
      default:
        // For other providers, use cl100k_base as a reasonable approximation
        encoding = get_encoding('cl100k_base')
    }

    this.encodings.set(key, encoding)
    return encoding
  }

  /**
   * Count tokens in text for a specific provider/model
   * @param {string} text - The text to count tokens for
   * @param {string} provider - The provider name
   * @param {string} model - The model name
   * @returns {number} Number of tokens
   */
  countTokens(text, provider, model) {
    if (!text) return 0

    switch (provider) {
      case 'anthropic':
        return countTokens(text)
      
      default:
        const encoding = this.getEncoding(provider, model)
        return encoding.encode(text).length
    }
  }

  /**
   * Count tokens in messages array (OpenAI format)
   * @param {Array} messages - Array of message objects
   * @param {string} provider - The provider name
   * @param {string} model - The model name
   * @returns {number} Total token count including message formatting
   */
  countMessageTokens(messages, provider, model) {
    if (!messages || messages.length === 0) return 0

    let totalTokens = 0

    for (const message of messages) {
      // Count tokens in the message content
      totalTokens += this.countTokens(message.content || '', provider, model)
      
      // Add overhead for message formatting
      // This varies by provider but we'll use OpenAI's approach as baseline
      totalTokens += 4 // for role, content wrapping
      
      if (message.role) {
        totalTokens += this.countTokens(message.role, provider, model)
      }
    }

    // Add overhead for the messages array structure
    totalTokens += 2

    return totalTokens
  }

  /**
   * Estimate tokens for streaming responses (approximate)
   * @param {string} text - The partial text received so far
   * @param {string} provider - The provider name
   * @param {string} model - The model name
   * @returns {number} Estimated token count
   */
  estimateStreamingTokens(text, provider, model) {
    // For streaming, we can only estimate based on what we've received
    return this.countTokens(text, provider, model)
  }

  /**
   * Parse token usage from API response
   * @param {Object} response - API response object
   * @param {string} provider - The provider name
   * @returns {{promptTokens: number, completionTokens: number, totalTokens: number} | null}
   */
  parseUsageFromResponse(response, provider) {
    if (!response) return null

    switch (provider) {
      case 'openai':
      case 'groq':
      case 'openrouter':
      case 'deepinfra':
        if (response.usage) {
          return {
            promptTokens: response.usage.prompt_tokens || 0,
            completionTokens: response.usage.completion_tokens || 0,
            totalTokens: response.usage.total_tokens || 0
          }
        }
        break

      case 'anthropic':
        if (response.usage) {
          return {
            promptTokens: response.usage.input_tokens || 0,
            completionTokens: response.usage.output_tokens || 0,
            totalTokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0)
          }
        }
        break

      case 'google-gemini':
        if (response.usage) {
          return {
            promptTokens: response.usage.promptTokenCount || 0,
            completionTokens: response.usage.candidatesTokenCount || 0,
            totalTokens: response.usage.totalTokenCount || 0
          }
        }
        break
    }

    return null
  }

  /**
   * Clean up cached encodings
   */
  dispose() {
    for (const encoding of this.encodings.values()) {
      if (encoding && typeof encoding.free === 'function') {
        encoding.free()
      }
    }
    this.encodings.clear()
  }
}

module.exports = { TokenCounter }