import { useState, useEffect } from 'react'
import { database, Conversation, Message } from '../shared/chatStore'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id)
    } else {
      setMessages([])
    }
  }, [currentConversation])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const result = await database.getConversations()
      setConversations(result as Conversation[])
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (conversationId: number) => {
    try {
      const result = await database.getMessages(conversationId)
      setMessages(result as Message[])
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const createConversation = async (title: string) => {
    try {
      const id = await database.createConversation(title)
      await loadConversations()
      
      // Find and set the new conversation as current
      const newConversation = conversations.find(c => c.id === id)
      if (newConversation) {
        setCurrentConversation(newConversation)
      }
      
      return id
    } catch (error) {
      console.error('Failed to create conversation:', error)
      throw error
    }
  }

  const updateConversation = async (id: number, title: string) => {
    try {
      await database.updateConversation(id, title)
      await loadConversations()
      
      // Update current conversation if it's the one being updated
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => prev ? { ...prev, title } : null)
      }
    } catch (error) {
      console.error('Failed to update conversation:', error)
      throw error
    }
  }

  const deleteConversation = async (id: number) => {
    try {
      await database.deleteConversation(id)
      await loadConversations()
      
      // Clear current conversation if it was deleted
      if (currentConversation?.id === id) {
        setCurrentConversation(null)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      throw error
    }
  }

  const addMessage = async (role: 'user' | 'assistant' | 'system', content: string) => {
    if (!currentConversation) {
      throw new Error('No conversation selected')
    }

    try {
      const messageId = await database.addMessage(currentConversation.id, role, content)
      await loadMessages(currentConversation.id)
      return messageId
    } catch (error) {
      console.error('Failed to add message:', error)
      throw error
    }
  }

  const deleteMessage = async (messageId: number) => {
    try {
      await database.deleteMessage(messageId)
      if (currentConversation) {
        await loadMessages(currentConversation.id)
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
  }

  const selectConversation = (conversation: Conversation | null) => {
    setCurrentConversation(conversation)
  }

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    createConversation,
    updateConversation,
    deleteConversation,
    selectConversation,
    addMessage,
    deleteMessage,
    reloadConversations: loadConversations,
  }
}