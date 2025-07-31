const { app } = require('electron')
const path = require('path')
const fs = require('fs').promises
const crypto = require('crypto')

class ConversationManager {
  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'conversations')
    this.conversations = []
  }

  async initialize() {
    // Ensure directories exist
    await fs.mkdir(this.dataPath, { recursive: true })
    await fs.mkdir(path.join(this.dataPath, 'chats'), { recursive: true })
    await fs.mkdir(path.join(this.dataPath, 'images'), { recursive: true })
    await fs.mkdir(path.join(this.dataPath, 'audio'), { recursive: true })
    
    // Load existing conversations
    await this.loadConversations()
  }

  async loadConversations() {
    try {
      const chatDir = path.join(this.dataPath, 'chats')
      const files = await fs.readdir(chatDir)
      
      this.conversations = []
      const emptyConversationFiles = []
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(chatDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const conversation = JSON.parse(content)
          
          // Clean up empty conversations on startup
          if (conversation.messages.length === 0) {
            emptyConversationFiles.push(filePath)
          } else {
            this.conversations.push(conversation)
          }
        }
      }
      
      // Delete empty conversation files
      for (const filePath of emptyConversationFiles) {
        await fs.unlink(filePath).catch(() => {})
      }
      
      // Sort by updatedAt
      this.conversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    } catch (error) {
      console.error('Error loading conversations:', error)
      this.conversations = []
    }
  }

  async getAllConversations() {
    return this.conversations
  }

  async getConversation(conversationId) {
    return this.conversations.find(c => c.id === conversationId)
  }

  async createConversation(provider, model) {
    const conversation = {
      id: `conv-${crypto.randomBytes(8).toString('hex')}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provider,
      model,
      messages: []
    }
    
    this.conversations.unshift(conversation)
    await this.saveConversation(conversation)
    
    return conversation
  }

  async deleteConversation(conversationId) {
    const index = this.conversations.findIndex(c => c.id === conversationId)
    if (index === -1) return false
    
    // Remove from memory
    this.conversations.splice(index, 1)
    
    // Delete file
    const filePath = path.join(this.dataPath, 'chats', `${conversationId}.json`)
    await fs.unlink(filePath).catch(() => {})
    
    // Delete associated media files
    await this.deleteMediaFiles(conversationId)
    
    return true
  }

  async renameConversation(conversationId, newTitle) {
    const conversation = this.conversations.find(c => c.id === conversationId)
    if (!conversation) return null
    
    conversation.title = newTitle
    conversation.updatedAt = new Date().toISOString()
    
    await this.saveConversation(conversation)
    return conversation
  }

  async addMessage(conversationId, message) {
    const conversation = this.conversations.find(c => c.id === conversationId)
    if (!conversation) return null
    
    const newMessage = {
      id: `msg-${crypto.randomBytes(8).toString('hex')}`,
      ...message,
      timestamp: new Date().toISOString()
    }
    
    conversation.messages.push(newMessage)
    conversation.updatedAt = new Date().toISOString()
    
    // Auto-generate title from first message if still default
    if (conversation.title === 'New Conversation' && conversation.messages.length === 1) {
      conversation.title = this.generateTitle(message.content)
    }
    
    await this.saveConversation(conversation)
    return newMessage
  }

  async saveConversation(conversation) {
    const filePath = path.join(this.dataPath, 'chats', `${conversation.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2))
  }

  async deleteMediaFiles(conversationId) {
    const imagePath = path.join(this.dataPath, 'images', conversationId)
    const audioPath = path.join(this.dataPath, 'audio', conversationId)
    
    await fs.rmdir(imagePath, { recursive: true }).catch(() => {})
    await fs.rmdir(audioPath, { recursive: true }).catch(() => {})
  }

  generateTitle(content) {
    // Simple title generation - take first 50 chars
    const cleaned = content.replace(/\n/g, ' ').trim()
    if (cleaned.length <= 50) return cleaned
    return cleaned.substring(0, 47) + '...'
  }
}

module.exports = { ConversationManager }