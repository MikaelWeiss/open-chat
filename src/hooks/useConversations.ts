import { useState, useEffect, useCallback } from 'react'
import { conversationStore, type Conversation } from '../shared/conversationStore'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const convs = await conversationStore.getConversations()
      setConversations(convs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createConversation = useCallback(async (
    title: string, 
    provider: string, 
    model: string, 
    systemPrompt?: string
  ) => {
    try {
      setError(null)
      const id = await conversationStore.createConversation(title, provider, model, systemPrompt)
      await loadConversations() // Refresh the list
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create conversation'
      setError(message)
      console.error('Failed to create conversation:', err)
      throw new Error(message)
    }
  }, [loadConversations])

  const updateConversation = useCallback(async (
    id: number, 
    updates: Partial<Pick<Conversation, 'title' | 'provider' | 'model' | 'system_prompt'>>
  ) => {
    try {
      setError(null)
      await conversationStore.updateConversation(id, updates)
      await loadConversations() // Refresh the list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update conversation'
      setError(message)
      console.error('Failed to update conversation:', err)
      throw new Error(message)
    }
  }, [loadConversations])

  const deleteConversation = useCallback(async (id: number) => {
    try {
      setError(null)
      await conversationStore.deleteConversation(id)
      await loadConversations() // Refresh the list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete conversation'
      setError(message)
      console.error('Failed to delete conversation:', err)
      throw new Error(message)
    }
  }, [loadConversations])

  const getConversation = useCallback(async (id: number) => {
    try {
      setError(null)
      return await conversationStore.getConversation(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get conversation'
      setError(message)
      console.error('Failed to get conversation:', err)
      throw new Error(message)
    }
  }, [])

  const touchConversation = useCallback(async (id: number) => {
    try {
      await conversationStore.touchConversation(id)
      await loadConversations() // Refresh to update timestamps
    } catch (err) {
      console.error('Failed to touch conversation:', err)
    }
  }, [loadConversations])

  // Load conversations on mount and subscribe to changes
  useEffect(() => {
    loadConversations()
    
    // Subscribe to conversation changes
    const unsubscribe = conversationStore.subscribe(() => {
      loadConversations()
    })
    
    return unsubscribe
  }, [loadConversations])

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    getConversation,
    touchConversation,
    refresh: loadConversations,
  }
}