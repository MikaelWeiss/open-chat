/**
 * Model Capabilities Detection using OpenRouter API
 * No API key required for capability detection!
 */

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

class ModelCapabilityDetector {
  constructor() {
    this.modelsCache = null;
    this.cacheExpiration = null;
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Fetch fresh model data from OpenRouter API
   */
  async fetchModels() {
    try {
      const response = await fetch(OPENROUTER_MODELS_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching models from OpenRouter:', error);
      throw error;
    }
  }

  /**
   * Get models with caching
   */
  async getModels() {
    const now = Date.now();
    
    if (this.modelsCache && this.cacheExpiration && now < this.cacheExpiration) {
      return this.modelsCache;
    }
    
    this.modelsCache = await this.fetchModels();
    this.cacheExpiration = now + this.cacheTimeout;
    
    return this.modelsCache;
  }

  /**
   * Check if a specific model supports vision/image inputs
   */
  async supportsVision(modelId) {
    const models = await this.getModels();
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      return false;
    }
    
    const modality = model.architecture?.modality || '';
    const inputModalities = model.architecture?.input_modalities || [];
    
    return modality.includes('image') || inputModalities.includes('image');
  }

  /**
   * Check if a specific model supports audio inputs
   */
  async supportsAudio(modelId) {
    const models = await this.getModels();
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      return false;
    }
    
    const inputModalities = model.architecture?.input_modalities || [];
    return inputModalities.includes('audio');
  }

  /**
   * Check if a specific model supports file inputs
   */
  async supportsFiles(modelId) {
    const models = await this.getModels();
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      return false;
    }
    
    const inputModalities = model.architecture?.input_modalities || [];
    return inputModalities.includes('file');
  }

  /**
   * Get comprehensive capabilities for a specific model
   */
  async getModelCapabilities(modelId) {
    const models = await this.getModels();
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      return null;
    }
    
    const modality = model.architecture?.modality || '';
    const inputModalities = model.architecture?.input_modalities || [];
    const outputModalities = model.architecture?.output_modalities || [];
    
    return {
      id: model.id,
      name: model.name,
      description: model.description,
      modality,
      inputModalities,
      outputModalities,
      capabilities: {
        vision: modality.includes('image') || inputModalities.includes('image'),
        audio: inputModalities.includes('audio'),
        files: inputModalities.includes('file'),
        textInput: inputModalities.includes('text'),
        textOutput: outputModalities.includes('text'),
        multimodal: inputModalities.length > 1 || modality.includes('+')
      },
      pricing: model.pricing,
      contextLength: model.context_length,
      topProvider: model.top_provider
    };
  }

  /**
   * Find best matching model using fuzzy matching
   */
  findBestMatch(targetModelId, openRouterModels) {
    const target = targetModelId.toLowerCase();
    
    // Try exact match first
    const exactMatch = openRouterModels.find(m => m.id.toLowerCase() === target);
    if (exactMatch) return exactMatch;
    
    // Define fuzzy matching rules
    const matchingRules = [
      // Grok models
      {
        pattern: /^grok[-_]?(\d+)[-_]?(vision|image|beta|mini)?/i,
        mapper: (match) => {
          const version = match[1];
          const variant = match[2];
          
          if (variant && (variant.includes('vision') || variant.includes('image'))) {
            return openRouterModels.find(m => m.id.includes('x-ai/grok') && m.architecture?.input_modalities?.includes('image'));
          }
          
          // Find latest Grok model
          return openRouterModels.find(m => m.id.includes('x-ai/grok-4')) || 
                 openRouterModels.find(m => m.id.includes('x-ai/grok-3')) ||
                 openRouterModels.find(m => m.id.includes('x-ai/grok'));
        }
      },
      
      // GPT-4 models
      {
        pattern: /^(openai\/)?gpt[-_]?4[o]?[-_]?(mini|turbo|vision|audio|realtime|search|preview)?/i,
        mapper: (match) => {
          const variant = match[2];
          
          if (variant?.includes('audio')) {
            // Look for GPT models with audio capabilities first
            const audioGPT = openRouterModels.find(m => 
              m.id.includes('openai/gpt-4') && 
              m.architecture?.input_modalities?.includes('audio')
            );
            if (audioGPT) return audioGPT;
            
            // Fallback to any GPT-4 model if no audio-specific one found
            return openRouterModels.find(m => m.id.includes('openai/gpt-4.1')) ||
                   openRouterModels.find(m => m.id.includes('openai/gpt-4'));
          }
          
          if (variant?.includes('vision')) {
            return openRouterModels.find(m => 
              m.id.includes('openai/gpt-4') && 
              m.architecture?.input_modalities?.includes('image')
            );
          }
          
          if (variant?.includes('mini')) {
            return openRouterModels.find(m => m.id.includes('openai/gpt-4') && m.id.includes('mini'));
          }
          
          // Default to latest GPT-4
          return openRouterModels.find(m => m.id.includes('openai/gpt-4.1')) ||
                 openRouterModels.find(m => m.id === 'openai/gpt-4o') ||
                 openRouterModels.find(m => m.id.includes('openai/gpt-4'));
        }
      },
      
      // Claude models
      {
        pattern: /^(anthropic\/)?claude[-_]?(\d)[-_]?(\d)?[-_]?(opus|sonnet|haiku)[-_]?(\d+)?/i,
        mapper: (match) => {
          const version = match[2];
          const subVersion = match[3];
          const model = match[4];
          const date = match[5];
          
          if (model?.includes('opus')) {
            return openRouterModels.find(m => m.id.includes('anthropic/claude') && m.id.includes('opus'));
          }
          
          if (model?.includes('sonnet')) {
            return openRouterModels.find(m => m.id.includes('anthropic/claude') && m.id.includes('sonnet')) ||
                   openRouterModels.find(m => m.id.includes('anthropic/claude-3.7-sonnet'));
          }
          
          if (model?.includes('haiku')) {
            return openRouterModels.find(m => m.id.includes('anthropic/claude') && m.id.includes('haiku'));
          }
          
          // Default to latest Claude
          return openRouterModels.find(m => m.id.includes('anthropic/claude-sonnet-4')) ||
                 openRouterModels.find(m => m.id.includes('anthropic/claude-3.7-sonnet'));
        }
      },
      
      // Gemini models
      {
        pattern: /^(google\/|models\/)?(gemini)[-_]?(\d+)[-_]?(\d+)?[-_]?(pro|flash|thinking|exp)?/i,
        mapper: (match) => {
          const version = match[3];
          const subVersion = match[4];
          const variant = match[5];
          
          if (variant?.includes('pro')) {
            return openRouterModels.find(m => m.id.includes('google/gemini') && m.id.includes('pro'));
          }
          
          if (variant?.includes('flash')) {
            return openRouterModels.find(m => m.id.includes('google/gemini') && m.id.includes('flash'));
          }
          
          // Default to latest Gemini
          return openRouterModels.find(m => m.id.includes('google/gemini-2.0-flash-exp')) ||
                 openRouterModels.find(m => m.id.includes('google/gemini') && m.id.includes('pro'));
        }
      }
    ];
    
    // Try fuzzy matching rules
    for (const rule of matchingRules) {
      const match = target.match(rule.pattern);
      if (match) {
        const result = rule.mapper(match);
        if (result) return result;
      }
    }
    
    // Fallback: partial string matching
    const partialMatches = openRouterModels.filter(m => {
      const modelId = m.id.toLowerCase();
      const modelName = m.name.toLowerCase();
      
      // Extract key terms
      const targetTerms = target.split(/[-_\/\s]+/).filter(t => t.length > 1);
      const modelTerms = [...modelId.split(/[-_\/\s]+/), ...modelName.split(/[-_\/\s]+/)].filter(t => t.length > 1);
      
      // Check if target terms match model terms
      return targetTerms.some(term => 
        modelTerms.some(modelTerm => 
          modelTerm.includes(term) || term.includes(modelTerm)
        )
      );
    });
    
    if (partialMatches.length > 0) {
      // Sort by how many capabilities the model has (prefer multimodal)
      return partialMatches.sort((a, b) => {
        const aModalities = a.architecture?.input_modalities?.length || 0;
        const bModalities = b.architecture?.input_modalities?.length || 0;
        return bModalities - aModalities;
      })[0];
    }
    
    return null;
  }

  /**
   * Get capabilities for multiple models at once
   */
  async getCapabilitiesForModels(modelIds) {
    const models = await this.getModels();
    const capabilities = {};
    
    for (const modelId of modelIds) {
      const model = this.findBestMatch(modelId, models);
      
      if (model) {
        const modality = model.architecture?.modality || '';
        const inputModalities = model.architecture?.input_modalities || [];
        
        capabilities[modelId] = {
          vision: modality.includes('image') || inputModalities.includes('image'),
          audio: inputModalities.includes('audio'),
          files: inputModalities.includes('file'),
          multimodal: inputModalities.length > 1 || modality.includes('+'),
          description: model.description,
          contextLength: model.context_length
        };
      } else {
        // Default capabilities if model not found in OpenRouter
        capabilities[modelId] = {
          vision: false,
          audio: false,
          files: false,
          multimodal: false,
          description: null,
          contextLength: null
        };
      }
    }
    
    return capabilities;
  }

  /**
   * Test if OpenRouter is available
   */
  async isAvailable() {
    try {
      const response = await fetch(OPENROUTER_MODELS_URL, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear the cache (useful for testing or forcing refresh)
   */
  clearCache() {
    this.modelsCache = null;
    this.cacheExpiration = null;
  }
}

module.exports = { ModelCapabilityDetector };