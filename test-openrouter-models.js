/**
 * Test script to fetch model capabilities from OpenRouter API
 * No API key required for this endpoint!
 */

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

async function fetchModelCapabilities() {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.data.length} models`);
    
    // Filter for multimodal models
    const multimodalModels = data.data.filter(model => {
      const modalities = model.architecture?.modality || '';
      const inputModalities = model.architecture?.input_modalities || [];
      
      // Look for models that support images or other non-text inputs
      return modalities.includes('image') || 
             inputModalities.includes('image') || 
             inputModalities.includes('audio') ||
             inputModalities.includes('file');
    });
    
    console.log(`\nFound ${multimodalModels.length} multimodal models:`);
    
    multimodalModels.forEach(model => {
      const modality = model.architecture?.modality || 'unknown';
      const inputMods = model.architecture?.input_modalities?.join(', ') || 'unknown';
      const outputMods = model.architecture?.output_modalities?.join(', ') || 'unknown';
      
      console.log(`\n${model.name} (${model.id})`);
      console.log(`  Modality: ${modality}`);
      console.log(`  Inputs: ${inputMods}`);
      console.log(`  Outputs: ${outputMods}`);
      if (model.description) {
        console.log(`  Description: ${model.description}`);
      }
    });
    
    // Function to check if a specific model supports vision
    function supportsVision(modelId) {
      const model = data.data.find(m => m.id === modelId);
      if (!model) return false;
      
      const modality = model.architecture?.modality || '';
      const inputModalities = model.architecture?.input_modalities || [];
      
      return modality.includes('image') || inputModalities.includes('image');
    }
    
    // Function to check if a specific model supports audio
    function supportsAudio(modelId) {
      const model = data.data.find(m => m.id === modelId);
      if (!model) return false;
      
      const inputModalities = model.architecture?.input_modalities || [];
      return inputModalities.includes('audio');
    }
    
    // Test some specific models
    console.log('\n=== Testing specific models ===');
    const testModels = [
      'openai/gpt-4o',
      'openai/gpt-4o-mini', 
      'google/gemini-2.5-flash',
      'anthropic/claude-3.5-sonnet'
    ];
    
    testModels.forEach(modelId => {
      const vision = supportsVision(modelId);
      const audio = supportsAudio(modelId);
      console.log(`${modelId}: Vision=${vision}, Audio=${audio}`);
    });
    
    return {
      allModels: data.data,
      multimodalModels,
      supportsVision,
      supportsAudio
    };
    
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

// Run the test
if (typeof module !== 'undefined' && require.main === module) {
  fetchModelCapabilities()
    .then(() => console.log('\n✅ Test completed successfully!'))
    .catch(err => console.error('❌ Test failed:', err));
}

module.exports = { fetchModelCapabilities };