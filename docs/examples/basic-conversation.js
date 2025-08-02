/**
 * Basic Conversation Example
 * 
 * This example demonstrates how to create a conversation,
 * add messages, and interact with the conversation manager.
 * 
 * Usage: node examples/basic-conversation.js
 */

const { ConversationManager } = require('../src/main/services/conversationManager')

async function basicConversationExample() {
  // Initialize conversation manager
  const conversationManager = new ConversationManager()
  await conversationManager.initialize()

  try {
    console.log('🚀 Creating a new conversation...')
    
    // Create a new conversation
    const conversation = await conversationManager.createConversation(
      'anthropic',  // provider
      'claude-3-sonnet-20240229'  // model
    )
    
    console.log('✅ Conversation created:', conversation.id)
    console.log('   Title:', conversation.title)
    console.log('   Provider:', conversation.provider)
    console.log('   Model:', conversation.model)

    // Add a user message
    console.log('\n💬 Adding user message...')
    const userMessage = {
      role: 'user',
      content: 'Hello! Can you help me understand how Open Chat works?',
      timestamp: Date.now()
    }

    await conversationManager.addMessage(conversation.id, userMessage)
    console.log('✅ User message added')

    // Add an assistant response (simulated)
    console.log('\n🤖 Adding assistant response...')
    const assistantMessage = {
      role: 'assistant',
      content: 'Hello! I\'d be happy to help you understand Open Chat. Open Chat is a desktop application built with Electron that provides a rich interface for interacting with various AI providers like Anthropic and OpenAI. It offers features like conversation management, file attachments, and streaming responses.',
      timestamp: Date.now()
    }

    await conversationManager.addMessage(conversation.id, assistantMessage)
    console.log('✅ Assistant message added')

    // Retrieve the updated conversation
    console.log('\n📋 Retrieving conversation details...')
    const conversations = await conversationManager.getAllConversations()
    const updatedConversation = conversations.find(c => c.id === conversation.id)
    
    console.log('✅ Conversation retrieved:')
    console.log('   Messages count:', updatedConversation.messages.length)
    console.log('   Last updated:', new Date(updatedConversation.updatedAt).toLocaleString())

    // Display conversation messages
    console.log('\n💬 Conversation Messages:')
    updatedConversation.messages.forEach((message, index) => {
      const timestamp = new Date(message.timestamp).toLocaleTimeString()
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant'
      console.log(`\n${index + 1}. ${role} (${timestamp}):`)
      console.log(`   ${message.content}`)
    })

    // Rename the conversation
    console.log('\n✏️  Renaming conversation...')
    await conversationManager.renameConversation(conversation.id, 'Introduction to Open Chat')
    console.log('✅ Conversation renamed')

    // Final conversation state
    const finalConversations = await conversationManager.getAllConversations()
    const finalConversation = finalConversations.find(c => c.id === conversation.id)
    console.log('\n🎉 Final conversation state:')
    console.log('   ID:', finalConversation.id)
    console.log('   Title:', finalConversation.title)
    console.log('   Messages:', finalConversation.messages.length)
    console.log('   Created:', new Date(finalConversation.createdAt).toLocaleString())
    console.log('   Updated:', new Date(finalConversation.updatedAt).toLocaleString())

  } catch (error) {
    console.error('❌ Error in conversation example:', error.message)
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  basicConversationExample()
    .then(() => {
      console.log('\n✅ Example completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Example failed:', error)
      process.exit(1)
    })
}

module.exports = { basicConversationExample }