const { ModelCapabilityDetector } = require('./src/main/services/modelCapabilityDetector.js');

async function testImplementation() {
  try {
    const detector = new ModelCapabilityDetector();
    
    // Test specific models that were showing no icons
    const testModels = [
      'grok-2-vision-1212',
      'grok-2-image-1212', 
      'gpt-4',
      'gpt-4o-audio-preview',
      'claude-3-5-sonnet-20241022',
      'models/gemini-2.5-pro',
      'davinci-002'
    ];
    
    console.log('Testing fuzzy matching implementation...\n');
    
    const capabilities = await detector.getCapabilitiesForModels(testModels);
    
    console.log('\n=== RESULTS ===');
    for (const [modelId, caps] of Object.entries(capabilities)) {
      console.log(`\n${modelId}:`);
      console.log(`  Vision: ${caps.vision}`);
      console.log(`  Audio: ${caps.audio}`); 
      console.log(`  Files: ${caps.files}`);
      console.log(`  Multimodal: ${caps.multimodal}`);
      console.log(`  Description: ${caps.description ? caps.description.substring(0, 60) + '...' : 'none'}`);
    }
    
  } catch (error) {
    console.error('Error testing implementation:', error);
  }
}

testImplementation();