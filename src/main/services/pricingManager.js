// Pricing data for various LLM providers
// Prices are per 1,000 tokens (input/output)
const PRICING_DATA = {
  'openai': {
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-3.5-turbo-instruct': { input: 0.0015, output: 0.002 }
  },
  'anthropic': {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-5-haiku-20241022': { input: 0.001, output: 0.005 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
  },
  'google-gemini': {
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
    'gemini-1.0-pro': { input: 0.0005, output: 0.0015 }
  },
  'groq': {
    'llama-3.1-405b-reasoning': { input: 0.0005, output: 0.0008 },
    'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
    'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
    'mixtral-8x7b-32768': { input: 0.00024, output: 0.00024 },
    'gemma-7b-it': { input: 0.00007, output: 0.00007 }
  },
  'deepinfra': {
    // DeepInfra typically has lower rates
    'meta-llama/Llama-3.1-405B-Instruct': { input: 0.0027, output: 0.0027 },
    'meta-llama/Llama-3.1-70B-Instruct': { input: 0.00052, output: 0.00075 },
    'meta-llama/Llama-3.1-8B-Instruct': { input: 0.000055, output: 0.000055 },
    'anthropic/claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'google/gemini-2.0-flash-exp': { input: 0.000075, output: 0.0003 }
  },
  'openrouter': {
    // OpenRouter has dynamic pricing, these are estimates
    'openai/gpt-4o': { input: 0.005, output: 0.015 },
    'anthropic/claude-3.5-sonnet': { input: 0.003, output: 0.015 },
    'meta-llama/llama-3.1-405b-instruct': { input: 0.0027, output: 0.0027 }
  }
}

class PricingManager {
  constructor() {
    this.pricingData = PRICING_DATA
  }

  /**
   * Get pricing for a specific provider and model
   * @param {string} provider - The provider name
   * @param {string} model - The model name
   * @returns {{input: number, output: number} | null} Pricing per 1k tokens or null if not found
   */
  getPricing(provider, model) {
    const providerPricing = this.pricingData[provider]
    if (!providerPricing) {
      return null
    }

    // Direct model match
    if (providerPricing[model]) {
      return providerPricing[model]
    }

    // Try to match model variants (e.g., gpt-4o-2024-08-06 -> gpt-4o)
    // First try exact prefix matching for model families
    for (const [modelKey, pricing] of Object.entries(providerPricing)) {
      if (model.startsWith(modelKey) || model.startsWith(modelKey.replace('-', ''))) {
        return pricing
      }
    }
    
    // Then try more flexible matching for complex model names
    const modelBase = model.split('-')[0] + (model.split('-')[1] || '')
    for (const [modelKey, pricing] of Object.entries(providerPricing)) {
      const keyBase = modelKey.split('-')[0] + (modelKey.split('-')[1] || '')
      if (modelBase === keyBase) {
        return pricing
      }
    }

    return null
  }

  /**
   * Calculate cost for token usage
   * @param {string} provider - The provider name
   * @param {string} model - The model name
   * @param {number} inputTokens - Number of input tokens
   * @param {number} outputTokens - Number of output tokens
   * @returns {number | null} Total cost in dollars or null if pricing unavailable
   */
  calculateCost(provider, model, inputTokens, outputTokens) {
    const pricing = this.getPricing(provider, model)
    if (!pricing) {
      return null
    }

    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output
    
    return inputCost + outputCost
  }

  /**
   * Get all available providers with pricing
   * @returns {string[]} Array of provider names
   */
  getAvailableProviders() {
    return Object.keys(this.pricingData)
  }

  /**
   * Get all models for a provider
   * @param {string} provider - The provider name
   * @returns {string[]} Array of model names
   */
  getModelsForProvider(provider) {
    const providerPricing = this.pricingData[provider]
    return providerPricing ? Object.keys(providerPricing) : []
  }

  /**
   * Update pricing for a model (for dynamic pricing updates)
   * @param {string} provider - The provider name
   * @param {string} model - The model name
   * @param {{input: number, output: number}} pricing - New pricing data
   */
  updatePricing(provider, model, pricing) {
    if (!this.pricingData[provider]) {
      this.pricingData[provider] = {}
    }
    this.pricingData[provider][model] = pricing
  }
}

module.exports = { PricingManager }