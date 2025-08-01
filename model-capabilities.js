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
   * Get all models that support specific capabilities
   */
  async getModelsByCapability(capability) {
    const models = await this.getModels();
    
    return models.filter(model => {
      const modality = model.architecture?.modality || '';
      const inputModalities = model.architecture?.input_modalities || [];
      
      switch (capability) {
        case 'vision':
          return modality.includes('image') || inputModalities.includes('image');
        case 'audio':
          return inputModalities.includes('audio');
        case 'files':
          return inputModalities.includes('file');
        case 'multimodal':
          return inputModalities.length > 1 || modality.includes('+');
        default:
          return false;
      }
    }).map(model => ({
      id: model.id,
      name: model.name,
      modality: model.architecture?.modality,
      inputModalities: model.architecture?.input_modalities,
      pricing: model.pricing
    }));
  }

  /**
   * Find the best free vision model
   */
  async getBestFreeVisionModel() {
    const visionModels = await this.getModelsByCapability('vision');
    
    // Filter for free models (either free in name or pricing)
    const freeVisionModels = visionModels.filter(model => 
      model.id.includes(':free') || 
      (model.pricing && model.pricing.prompt === "0" && model.pricing.completion === "0")
    );
    
    // Sort by some quality indicators (you could refine this)
    return freeVisionModels.sort((a, b) => {
      // Prefer models with more modalities
      const aModalities = a.inputModalities?.length || 0;
      const bModalities = b.inputModalities?.length || 0;
      
      if (aModalities !== bModalities) {
        return bModalities - aModalities;
      }
      
      // Prefer well-known providers
      const preferredProviders = ['openai', 'google', 'anthropic', 'mistralai'];
      const aProvider = preferredProviders.findIndex(p => a.id.includes(p));
      const bProvider = preferredProviders.findIndex(p => b.id.includes(p));
      
      if (aProvider !== -1 && bProvider !== -1) {
        return aProvider - bProvider;
      }
      
      return aProvider !== -1 ? -1 : (bProvider !== -1 ? 1 : 0);
    });
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
}

// Example usage
async function demonstrateUsage() {
  const detector = new ModelCapabilityDetector();
  
  console.log('🔍 Testing Model Capability Detection...\n');
  
  // Test specific models
  const testModels = [
    'openai/gpt-4o',
    'openai/gpt-4o-mini', 
    'google/gemini-2.5-flash',
    'anthropic/claude-3.5-sonnet',
    'mistralai/mistral-small-3.2-24b-instruct:free'
  ];
  
  for (const modelId of testModels) {
    const capabilities = await detector.getModelCapabilities(modelId);
    if (capabilities) {
      console.log(`📋 ${capabilities.name} (${modelId})`);
      console.log(`   Vision: ${capabilities.capabilities.vision ? '✅' : '❌'}`);
      console.log(`   Audio: ${capabilities.capabilities.audio ? '✅' : '❌'}`);
      console.log(`   Files: ${capabilities.capabilities.files ? '✅' : '❌'}`);
      console.log(`   Multimodal: ${capabilities.capabilities.multimodal ? '✅' : '❌'}`);
      console.log(`   Provider: ${capabilities.topProvider?.name || 'Unknown'}`);
      console.log('');
    }
  }
  
  // Find best free vision model
  console.log('🆓 Best Free Vision Models:');
  const freeVisionModels = await detector.getBestFreeVisionModel();
  freeVisionModels.slice(0, 5).forEach((model, index) => {
    console.log(`${index + 1}. ${model.name} (${model.id})`);
    console.log(`   Modalities: ${model.inputModalities?.join(', ') || 'unknown'}`);
  });
}

module.exports = { ModelCapabilityDetector };

// Run demo if called directly
if (typeof module !== 'undefined' && require.main === module) {
  demonstrateUsage()
    .then(() => console.log('\n✅ Demo completed!'))
    .catch(err => console.error('❌ Demo failed:', err));
}