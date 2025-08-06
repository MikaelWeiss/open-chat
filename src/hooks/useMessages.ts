import { useState, useEffect, useCallback } from 'react'
import { messageStore, type Message, type CreateMessageInput } from '../shared/messageStore'

export function useMessages(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const msgs = await messageStore.getMessages(conversationId)
      setMessages(msgs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
      console.error('Failed to load messages:', err)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  const addMessage = useCallback(async (message: CreateMessageInput) => {
    if (!conversationId) {
      throw new Error('No conversation selected')
    }

    try {
      setError(null)
      const id = await messageStore.addMessage(conversationId, message)
      await loadMessages() // Refresh the list
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add message'
      setError(message)
      console.error('Failed to add message:', err)
      throw new Error(message)
    }
  }, [conversationId, loadMessages])

  const updateMessage = useCallback(async (id: number, updates: Partial<CreateMessageInput>) => {
    try {
      setError(null)
      await messageStore.updateMessage(id, updates)
      await loadMessages() // Refresh the list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update message'
      setError(message)
      console.error('Failed to update message:', err)
      throw new Error(message)
    }
  }, [loadMessages])

  const deleteMessage = useCallback(async (id: number) => {
    try {
      setError(null)
      await messageStore.deleteMessage(id)
      await loadMessages() // Refresh the list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete message'
      setError(message)
      console.error('Failed to delete message:', err)
      throw new Error(message)
    }
  }, [loadMessages])

  const deleteAllMessages = useCallback(async () => {
    if (!conversationId) return

    try {
      setError(null)
      await messageStore.deleteMessagesFromConversation(conversationId)
      await loadMessages() // Refresh the list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete messages'
      setError(message)
      console.error('Failed to delete messages:', err)
      throw new Error(message)
    }
  }, [conversationId, loadMessages])

  const getMessage = useCallback(async (id: number) => {
    try {
      setError(null)
      return await messageStore.getMessage(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get message'
      setError(message)
      console.error('Failed to get message:', err)
      throw new Error(message)
    }
  }, [])

  // Calculate usage statistics from messages
  const usage = useCallback(() => {
    const totalInputTokens = messages.reduce((sum, msg) => sum + (msg.input_tokens || 0), 0)
    const totalOutputTokens = messages.reduce((sum, msg) => sum + (msg.output_tokens || 0), 0)
    const totalReasoningTokens = messages.reduce((sum, msg) => sum + (msg.reasoning_tokens || 0), 0)
    const totalCachedTokens = messages.reduce((sum, msg) => sum + (msg.cached_tokens || 0), 0)
    const totalTokens = totalInputTokens + totalOutputTokens + totalReasoningTokens
    const totalCost = messages.reduce((sum, msg) => sum + (msg.cost || 0), 0)

    return {
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalReasoningTokens,
      totalCachedTokens,
      totalCost,
      messageCount: messages.length
    }
  }, [messages])

  // Load messages when conversationId changes
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  return {
    messages,
    loading,
    error,
    addMessage,
    updateMessage,
    deleteMessage,
    deleteAllMessages,
    getMessage,
    usage: usage(),
    refresh: loadMessages,
  }
}