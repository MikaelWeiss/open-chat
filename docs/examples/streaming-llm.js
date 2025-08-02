/**
 * Streaming LLM Example
 * 
 * This example demonstrates how to work with the LLM Manager
 * for streaming responses, token counting, and cost calculation.
 * 
 * Usage: node examples/streaming-llm.js
 */

const { LLMManager } = require('../src/main/services/llmManager')
const { SettingsManager } = require('../src/main/services/settingsManager')

async function streamingLLMExample() {
  // Initialize managers
  const settingsManager = new SettingsManager()
  await settingsManager.initialize()
  
  const llmManager = new LLMManager()
  await llmManager.initialize(settingsManager)

  try {
    console.log('🤖 Streaming LLM Example\n')

    // Get available providers
    console.log('📋 Getting available providers...')
    const providers = await llmManager.getAvailableProviders()
    console.log('✅ Available providers:')
    providers.forEach(provider => {
      console.log(`   - ${provider.id}: ${provider.name} (${provider.models.length} models)`)
    })

    // Example messages for testing
    const testMessages = [
      {
        role: 'user',
        content: 'Hello! Can you explain what makes a good software architecture? Please provide a detailed explanation with examples.',
        timestamp: Date.now()
      }
    ]

    // Find a working provider (mock or configured)
    const workingProvider = providers.find(p => p.enabled) || providers[0]
    const testModel = workingProvider.models[0]
    
    console.log(`\n🎯 Using provider: ${workingProvider.name}`)
    console.log(`   Model: ${testModel.name}`)
    console.log(`   Capabilities: Vision=${testModel.capabilities.vision}, Audio=${testModel.capabilities.audio}, Streaming=${testModel.capabilities.streaming}`)

    // Calculate usage before sending
    console.log('\n📊 Calculating usage estimate...')
    try {
      const usageEstimate = await llmManager.calculateUsageForMessages(
        workingProvider.id,
        testModel.id,
        testMessages
      )
      
      console.log('✅ Usage estimate:')
      console.log(`   Input tokens: ${usageEstimate.inputTokens}`)
      console.log(`   Estimated output tokens: ${usageEstimate.estimatedOutputTokens}`)
      console.log(`   Estimated cost: $${usageEstimate.estimatedCost.toFixed(4)}`)
    } catch (error) {
      console.log('⚠️  Could not calculate usage estimate:', error.message)
    }

    // Example 1: Non-streaming completion
    console.log('\n📝 Testing non-streaming completion...')
    try {
      const completion = await llmManager.getCompletion(
        workingProvider.id,
        testModel.id,
        testMessages
      )
      
      console.log('✅ Non-streaming completion received:')
      console.log(`   Content length: ${completion.content.length} characters`)
      console.log(`   Tokens used: ${completion.usage?.totalTokens || 'unknown'}`)
      console.log(`   Cost: $${completion.cost?.toFixed(4) || 'unknown'}`)
      console.log(`   First 200 chars: "${completion.content.substring(0, 200)}..."`)
    } catch (error) {
      console.log('⚠️  Non-streaming completion failed:', error.message)
    }

    // Example 2: Streaming completion
    console.log('\n🌊 Testing streaming completion...')
    const conversationId = 'example-conversation-' + Date.now()
    
    let streamedContent = ''
    let chunkCount = 0
    
    try {
      await new Promise((resolve, reject) => {
        llmManager.streamCompletion(
          conversationId,
          workingProvider.id,
          testModel.id,
          testMessages,
          // onChunk callback
          (chunk) => {
            chunkCount++
            streamedContent += chunk
            process.stdout.write(chunk) // Real-time output
          },
          // onError callback
          (error) => {
            console.error('\n❌ Streaming error:', error)
            reject(error)
          },
          // onComplete callback
          (data) => {
            console.log('\n\n✅ Streaming completed:')
            console.log(`   Total chunks received: ${chunkCount}`)
            console.log(`   Total content length: ${streamedContent.length} characters`)
            console.log(`   Tokens used: ${data.totalTokens || 'unknown'}`)
            console.log(`   Cost: $${data.cost?.toFixed(4) || 'unknown'}`)
            resolve(data)
          }
        )
      })
    } catch (error) {
      console.log('⚠️  Streaming completion failed:', error.message)
    }

    // Example 3: Cancel streaming
    console.log('\n⏹️  Testing stream cancellation...')
    const cancelConversationId = 'cancel-test-' + Date.now()
    
    try {
      // Start a stream
      setTimeout(() => {
        const cancelled = llmManager.cancelStream(cancelConversationId)
        console.log(`   Stream cancellation ${cancelled ? 'successful' : 'failed'}`)
      }, 100) // Cancel after 100ms
      
      await new Promise((resolve, reject) => {
        llmManager.streamCompletion(
          cancelConversationId,
          workingProvider.id,
          testModel.id,
          [{ role: 'user', content: 'Tell me a very long story about space exploration...', timestamp: Date.now() }],
          (chunk) => {
            process.stdout.write('.')
          },
          (error) => {
            if (error.includes('cancelled') || error.includes('aborted')) {
              console.log('\n✅ Stream successfully cancelled')
              resolve()
            } else {
              reject(error)
            }
          },
          (data) => {
            console.log('\n⚠️  Stream completed before cancellation')
            resolve()
          }
        )
      })
    } catch (error) {
      console.log('⚠️  Stream cancellation test failed:', error.message)
    }

    // Example 4: Test with file attachment (if vision supported)
    if (testModel.capabilities.vision) {
      console.log('\n🖼️  Testing vision capabilities...')
      
      const messagesWithImage = [
        {
          role: 'user',
          content: 'What do you see in this image?',
          attachments: [
            {
              type: 'image',
              data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 red pixel
              mimeType: 'image/png',
              name: 'test-image.png'
            }
          ],
          timestamp: Date.now()
        }
      ]
      
      try {
        const visionUsage = await llmManager.calculateUsageForMessages(
          workingProvider.id,
          testModel.id,
          messagesWithImage
        )
        
        console.log('✅ Vision usage calculated:')
        console.log(`   Input tokens (with image): ${visionUsage.inputTokens}`)
        console.log(`   Image processing cost: $${visionUsage.estimatedCost.toFixed(4)}`)
      } catch (error) {
        console.log('⚠️  Vision usage calculation failed:', error.message)
      }
    }

    // Example 5: Pricing information
    console.log('\n💰 Provider pricing information:')
    providers.forEach(provider => {
      console.log(`\n   ${provider.name}:`)
      provider.models.forEach(model => {
        if (model.pricing) {
          console.log(`     ${model.name}:`)
          console.log(`       Input: $${model.pricing.inputTokens}/1K tokens`)
          console.log(`       Output: $${model.pricing.outputTokens}/1K tokens`)
        }
      })
    })

    // Example 6: Model capabilities summary
    console.log('\n🔧 Model capabilities summary:')
    providers.forEach(provider => {
      console.log(`\n   ${provider.name} models:`)
      provider.models.forEach(model => {
        const caps = model.capabilities
        const features = []
        if (caps.vision) features.push('Vision')
        if (caps.audio) features.push('Audio')
        if (caps.files) features.push('Files')
        if (caps.streaming) features.push('Streaming')
        
        console.log(`     ${model.name}: ${features.join(', ') || 'Text only'}`)
        console.log(`       Context: ${model.contextWindow?.toLocaleString() || 'unknown'} tokens`)
        console.log(`       Max output: ${model.maxOutputTokens?.toLocaleString() || 'unknown'} tokens`)
      })
    })

  } catch (error) {
    console.error('❌ Error in streaming LLM example:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Helper function to simulate streaming delay
function simulateTypingDelay(text, delayMs = 50) {
  return new Promise((resolve) => {
    let index = 0
    const interval = setInterval(() => {
      process.stdout.write(text[index])
      index++
      if (index >= text.length) {
        clearInterval(interval)
        resolve()
      }
    }, delayMs)
  })
}

// Helper function to format cost
function formatCost(cost) {
  if (cost === undefined || cost === null) return 'unknown'
  if (cost < 0.001) return `$${(cost * 1000).toFixed(3)}‰` // Per mille for very small costs
  return `$${cost.toFixed(4)}`
}

// Helper function to format token count
function formatTokens(tokens) {
  if (!tokens) return 'unknown'
  return tokens.toLocaleString()
}

// Run the example if this file is executed directly
if (require.main === module) {
  streamingLLMExample()
    .then(() => {
      console.log('\n✅ Streaming LLM example completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Streaming LLM example failed:', error)
      process.exit(1)
    })
}

module.exports = { 
  streamingLLMExample, 
  simulateTypingDelay, 
  formatCost, 
  formatTokens 
}