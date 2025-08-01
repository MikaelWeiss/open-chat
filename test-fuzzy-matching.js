// Use built-in fetch (Node 18+)

async function testFuzzyMatching() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    const data = await response.json();
    
    console.log('Total models:', data.data.length);
    
    // Look for models that might match the ones showing no icons
    const testIds = [
      'grok-2-vision-1212',
      'grok-2-image-1212', 
      'gpt-4',
      'gpt-4o-audio-preview',
      'claude-3-5-sonnet-20241022'
    ];
    
    testIds.forEach(testId => {
      const exact = data.data.find(m => m.id === testId);
      console.log(`\nLooking for: ${testId}`);
      console.log('Exact match:', exact ? 'FOUND' : 'NOT FOUND');
      
      if (!exact) {
        // Look for partial matches
        const partials = data.data.filter(m => {
          const modelBase = m.id.split('/').pop() || m.id;
          const testBase = testId;
          
          return modelBase.includes(testBase.split('-')[0]) || 
                 testBase.includes(modelBase.split('-')[0]) ||
                 modelBase.toLowerCase().includes(testBase.toLowerCase()) ||
                 testBase.toLowerCase().includes(modelBase.toLowerCase());
        }).slice(0, 5);
        
        console.log('Potential matches:');
        partials.forEach(p => {
          console.log(`  - ${p.id} (${p.name})`);
          if (p.architecture) {
            console.log(`    Input modalities: ${p.architecture.input_modalities?.join(', ') || 'none'}`);
            console.log(`    Modality: ${p.architecture.modality || 'none'}`);
          }
        });
      } else {
        console.log(`  Found exact match with modalities: ${exact.architecture?.input_modalities?.join(', ') || 'none'}`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

testFuzzyMatching();