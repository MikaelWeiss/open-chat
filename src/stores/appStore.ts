import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useMemo } from 'react'
import { conversationStore, type Conversation } from '../shared/conversationStore'
import { messageStore, type Message, type CreateMessageInput } from '../shared/messageStore'
import { settings, SETTINGS_KEYS } from '../shared/settingsStore'
import { type Provider } from '../types/provider'

// Pending conversation type (exists only in memory until first message)
export interface PendingConversation {
  title: string
  provider: string
  model: string
  system_prompt?: string
  created_at: string
  updated_at: string
}

// App state interface
interface AppState {
  // Conversations
  conversations: Conversation[]
  pendingConversation: PendingConversation | null
  selectedConversationId: number | 'pending' | null
  
  // Messages
  messagesByConversation: Map<number | 'pending', Message[]>
  streamingMessages: Map<number | 'pending', string>
  loadingConversations: Set<number>
  
  // Providers
  providers: Record<string, Provider>
  isProvidersLoaded: boolean
  
  // Error states
  errorStates: Map<number | 'pending', string>
  retryAttempts: Map<number | 'pending', number>
  
  // Actions - Conversations
  loadConversations: () => Promise<void>
  createPendingConversation: (title: string, provider: string, model: string, systemPrompt?: string) => void
  commitPendingConversation: () => Promise<number | null>
  updateConversation: (id: number | 'pending', updates: Partial<Conversation>) => Promise<void>
  deleteConversation: (id: number | 'pending') => Promise<void>
  toggleConversationFavorite: (id: number) => Promise<void>
  setSelectedConversation: (id: number | 'pending' | null) => void
  
  // Actions - Messages
  loadMessages: (conversationId: number) => Promise<void>
  addMessage: (conversationId: number | 'pending', message: CreateMessageInput) => Promise<void>
  setStreamingMessage: (conversationId: number | 'pending', content: string) => void
  clearStreamingMessage: (conversationId: number | 'pending') => void
  
  // Actions - Providers
  loadProviders: () => Promise<void>
  updateProviders: (providers: Record<string, Provider>) => void
  
  // Actions - Error handling
  setError: (conversationId: number | 'pending', error: string) => void
  clearError: (conversationId: number | 'pending') => void
  incrementRetryAttempt: (conversationId: number | 'pending') => void
  resetRetryAttempt: (conversationId: number | 'pending') => void
  
  // Helper methods
  getConversation: (id: number | 'pending') => Conversation | PendingConversation | null
  getAllConversations: () => (Conversation | (PendingConversation & { id: 'pending' }))[]
  getMessages: (conversationId: number | 'pending') => Message[]
  getStreamingMessage: (conversationId: number | 'pending') => string
  
  // Cleanup
  cleanup: () => void
}

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000 // 1 second

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    conversations: [],
    pendingConversation: null,
    selectedConversationId: null,
    messagesByConversation: new Map(),
    streamingMessages: new Map(),
    loadingConversations: new Set(),
    providers: {},
    isProvidersLoaded: false,
    errorStates: new Map(),
    retryAttempts: new Map(),

    // Conversation actions
    loadConversations: async () => {
      try {
        const conversations = await conversationStore.getConversations()
        set({ conversations })
      } catch (error) {
        console.error('Failed to load conversations:', error)
        get().setError('system' as any, 'Failed to load conversations')
      }
    },

    createPendingConversation: (title: string, provider: string, model: string, systemPrompt?: string) => {
      const now = new Date().toISOString()
      
      // Clear any existing pending conversation and its messages
      get().cleanup()
      
      const pending: PendingConversation = {
        title,
        provider,
        model,
        system_prompt: systemPrompt,
        created_at: now,
        updated_at: now
      }

      set({ 
        pendingConversation: pending,
        selectedConversationId: 'pending'
      })
    },

    commitPendingConversation: async () => {
      const state = get()
      const pending = state.pendingConversation
      
      if (!pending) {
        console.error('No pending conversation to commit')
        return null
      }

      const conversationId = 'pending'
      const retryAttempt = state.retryAttempts.get(conversationId) || 0

      try {
        get().clearError(conversationId)
        
        // Create persistent conversation
        const persistentId = await conversationStore.createConversation(
          pending.title,
          pending.provider,
          pending.model,
          pending.system_prompt
        )

        if (persistentId) {
          // Move messages if any exist in memory
          const pendingMessages = state.messagesByConversation.get('pending')
          if (pendingMessages && pendingMessages.length > 0) {
            // Save messages to persistent storage
            for (const message of pendingMessages) {
              const messageInput: CreateMessageInput = {
                role: message.role,
                text: message.text || undefined,
                thinking: message.thinking || undefined,
                images: message.images || undefined,
                audio: message.audio || undefined,
                files: message.files || undefined,
                references: message.references || undefined,
                processing_time_ms: message.processing_time_ms || undefined
              }
              await messageStore.addMessage(persistentId, messageInput)
            }
            
            // Move messages to persistent conversation in memory
            const newMessagesByConversation = new Map(state.messagesByConversation)
            newMessagesByConversation.delete('pending')
            newMessagesByConversation.set(persistentId, pendingMessages)
            set({ messagesByConversation: newMessagesByConversation })
          }
          
          // Move streaming message if any
          const streamingMessage = state.streamingMessages.get('pending')
          if (streamingMessage) {
            const newStreamingMessages = new Map(state.streamingMessages)
            newStreamingMessages.delete('pending')
            newStreamingMessages.set(persistentId, streamingMessage)
            set({ streamingMessages: newStreamingMessages })
          }
          
          // Reload conversations and clear pending state
          await get().loadConversations()
          
          set({ 
            pendingConversation: null,
            selectedConversationId: persistentId
          })
          
          get().resetRetryAttempt('pending')
          return persistentId
        }
      } catch (error) {
        console.error('Failed to commit pending conversation:', error)
        get().setError(conversationId, `Failed to save conversation: ${error}`)
        get().incrementRetryAttempt(conversationId)
        
        // Auto-retry with exponential backoff
        if (retryAttempt < MAX_RETRY_ATTEMPTS) {
          setTimeout(() => {
            get().commitPendingConversation()
          }, RETRY_DELAY * Math.pow(2, retryAttempt))
        }
      }
      
      return null
    },

    updateConversation: async (id: number | 'pending', updates: Partial<Conversation>) => {
      if (id === 'pending') {
        // Update pending conversation
        const state = get()
        const pending = state.pendingConversation
        if (pending) {
          const updatedPending: PendingConversation = { 
            ...pending, 
            ...updates, 
            system_prompt: (updates.system_prompt !== undefined ? updates.system_prompt : pending.system_prompt) || undefined,
            updated_at: new Date().toISOString() 
          }
          set({ pendingConversation: updatedPending })
        }
      } else {
        // Update persistent conversation
        try {
          get().clearError(id)
          await conversationStore.updateConversation(id, updates)
          await get().loadConversations()
          get().resetRetryAttempt(id)
        } catch (error) {
          console.error('Failed to update conversation:', error)
          get().setError(id, `Failed to update conversation: ${error}`)
        }
      }
    },

    deleteConversation: async (id: number | 'pending') => {
      if (id === 'pending') {
        // Clear pending conversation and its messages
        get().cleanup()
        set({ selectedConversationId: null })
      } else {
        // Delete persistent conversation
        try {
          get().clearError(id)
          await conversationStore.deleteConversation(id)
          await get().loadConversations()
          
          // Remove messages from memory
          const newMessagesByConversation = new Map(get().messagesByConversation)
          newMessagesByConversation.delete(id)
          const newStreamingMessages = new Map(get().streamingMessages)
          newStreamingMessages.delete(id)
          
          set({ 
            messagesByConversation: newMessagesByConversation,
            streamingMessages: newStreamingMessages
          })
          
          get().resetRetryAttempt(id)
        } catch (error) {
          console.error('Failed to delete conversation:', error)
          get().setError(id, `Failed to delete conversation: ${error}`)
        }
      }
    },

    toggleConversationFavorite: async (id: number) => {
      try {
        get().clearError(id)
        await conversationStore.toggleConversationFavorite(id)
        await get().loadConversations()
        get().resetRetryAttempt(id)
      } catch (error) {
        console.error('Failed to toggle favorite:', error)
        get().setError(id, `Failed to toggle favorite: ${error}`)
      }
    },

    setSelectedConversation: (id: number | 'pending' | null) => {
      set({ selectedConversationId: id })
    },

    // Message actions
    loadMessages: async (conversationId: number) => {
      if (get().loadingConversations.has(conversationId)) {
        return // Already loading
      }

      try {
        const newLoadingConversations = new Set(get().loadingConversations)
        newLoadingConversations.add(conversationId)
        set({ loadingConversations: newLoadingConversations })

        get().clearError(conversationId)
        const messages = await messageStore.getMessages(conversationId)
        
        set((state) => ({
          messagesByConversation: new Map(state.messagesByConversation.set(conversationId, messages)),
          loadingConversations: new Set([...state.loadingConversations].filter(id => id !== conversationId))
        }))
        
        get().resetRetryAttempt(conversationId)
      } catch (error) {
        console.error('Failed to load messages:', error)
        get().setError(conversationId, `Failed to load messages: ${error}`)
        set((state) => ({
          loadingConversations: new Set([...state.loadingConversations].filter(id => id !== conversationId))
        }))
      }
    },

    addMessage: async (conversationId: number | 'pending', message: CreateMessageInput) => {
      if (conversationId === 'pending') {
        // Pending conversation - store in memory
        const state = get()
        const existingMessages = state.messagesByConversation.get('pending') || []
        const newMessage: Message = {
          id: Date.now(),
          conversation_id: 'pending' as any,
          role: message.role,
          text: message.text || '',
          thinking: message.thinking,
          images: message.images,
          audio: message.audio,
          files: message.files,
          references: message.references,
          input_tokens: message.input_tokens,
          output_tokens: message.output_tokens,
          reasoning_tokens: message.reasoning_tokens,
          cached_tokens: message.cached_tokens,
          cost: message.cost,
          processing_time_ms: message.processing_time_ms,
          created_at: new Date().toISOString()
        }
        
        set((state) => ({
          messagesByConversation: new Map(state.messagesByConversation.set('pending', [...existingMessages, newMessage]))
        }))
      } else {
        // Persistent conversation - save to database and update memory
        try {
          get().clearError(conversationId)
          await messageStore.addMessage(conversationId, message)
          await get().loadMessages(conversationId)
          get().resetRetryAttempt(conversationId)
        } catch (error) {
          console.error('Failed to add message:', error)
          get().setError(conversationId, `Failed to save message: ${error}`)
        }
      }
    },

    setStreamingMessage: (conversationId: number | 'pending', content: string) => {
      set((state) => {
        const currentContent = state.streamingMessages.get(conversationId) || ''
        return {
          streamingMessages: new Map(state.streamingMessages.set(conversationId, currentContent + content))
        }
      })
    },

    clearStreamingMessage: (conversationId: number | 'pending') => {
      set((state) => {
        const newStreamingMessages = new Map(state.streamingMessages)
        newStreamingMessages.delete(conversationId)
        return { streamingMessages: newStreamingMessages }
      })
    },

    // Provider actions
    loadProviders: async () => {
      try {
        const providers = await settings.get<Record<string, Provider>>(SETTINGS_KEYS.PROVIDERS) || {}
        set({ providers, isProvidersLoaded: true })
      } catch (error) {
        console.error('Failed to load providers:', error)
        set({ isProvidersLoaded: true })
      }
    },

    updateProviders: (providers: Record<string, Provider>) => {
      set({ providers })
    },

    // Error handling actions
    setError: (conversationId: number | 'pending', error: string) => {
      set((state) => ({
        errorStates: new Map(state.errorStates.set(conversationId, error))
      }))
    },

    clearError: (conversationId: number | 'pending') => {
      set((state) => {
        const newErrorStates = new Map(state.errorStates)
        newErrorStates.delete(conversationId)
        return { errorStates: newErrorStates }
      })
    },

    incrementRetryAttempt: (conversationId: number | 'pending') => {
      set((state) => {
        const currentAttempts = state.retryAttempts.get(conversationId) || 0
        return {
          retryAttempts: new Map(state.retryAttempts.set(conversationId, currentAttempts + 1))
        }
      })
    },

    resetRetryAttempt: (conversationId: number | 'pending') => {
      set((state) => {
        const newRetryAttempts = new Map(state.retryAttempts)
        newRetryAttempts.delete(conversationId)
        return { retryAttempts: newRetryAttempts }
      })
    },

    // Helper methods
    getConversation: (id: number | 'pending') => {
      const state = get()
      if (id === 'pending') {
        return state.pendingConversation
      } else {
        return state.conversations.find(conv => conv.id === id) || null
      }
    },

    getAllConversations: () => {
      const state = get()
      const allConversations: (Conversation | (PendingConversation & { id: 'pending' }))[] = [...state.conversations]
      
      if (state.pendingConversation) {
        allConversations.unshift({ ...state.pendingConversation, id: 'pending' })
      }
      
      // Sort by updated_at (most recent first)
      return allConversations.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    },

    getMessages: (conversationId: number | 'pending') => {
      return get().messagesByConversation.get(conversationId) || []
    },

    getStreamingMessage: (conversationId: number | 'pending') => {
      return get().streamingMessages.get(conversationId) || ''
    },

    // Cleanup method
    cleanup: () => {
      set((state) => {
        // Clean up pending conversation data
        const newMessagesByConversation = new Map(state.messagesByConversation)
        newMessagesByConversation.delete('pending')
        
        const newStreamingMessages = new Map(state.streamingMessages)
        newStreamingMessages.delete('pending')
        
        const newErrorStates = new Map(state.errorStates)
        newErrorStates.delete('pending')
        
        const newRetryAttempts = new Map(state.retryAttempts)
        newRetryAttempts.delete('pending')
        
        return {
          pendingConversation: null,
          messagesByConversation: newMessagesByConversation,
          streamingMessages: newStreamingMessages,
          errorStates: newErrorStates,
          retryAttempts: newRetryAttempts
        }
      })
    }
  }))
)

// Initialize store by loading data
export const initializeAppStore = async () => {
  try {
    const store = useAppStore.getState()
    await Promise.all([
      store.loadConversations(),
      store.loadProviders()
    ])
  } catch (error) {
    console.error('Failed to initialize app store:', error)
  }
}

// Selector hooks for common patterns
export const useConversations = () => {
  const conversations = useAppStore((state) => state.conversations)
  const pendingConversation = useAppStore((state) => state.pendingConversation)
  const selectedConversationId = useAppStore((state) => state.selectedConversationId)
  const createPendingConversation = useAppStore((state) => state.createPendingConversation)
  const commitPendingConversation = useAppStore((state) => state.commitPendingConversation)
  const updateConversation = useAppStore((state) => state.updateConversation)
  const deleteConversation = useAppStore((state) => state.deleteConversation)
  const toggleConversationFavorite = useAppStore((state) => state.toggleConversationFavorite)
  const setSelectedConversation = useAppStore((state) => state.setSelectedConversation)
  const getConversation = useAppStore((state) => state.getConversation)

  // Memoize the combined conversations
  const allConversations = useMemo(() => {
    const combined: (Conversation | (PendingConversation & { id: 'pending' }))[] = [...conversations]
    
    if (pendingConversation) {
      combined.unshift({ ...pendingConversation, id: 'pending' })
    }
    
    // Sort by updated_at (most recent first)
    return combined.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }, [conversations, pendingConversation])

  return {
    conversations: allConversations,
    selectedConversationId,
    createPendingConversation,
    commitPendingConversation,
    updateConversation,
    deleteConversation,
    toggleConversationFavorite,
    setSelectedConversation,
    getConversation
  }
}

export const useMessages = (conversationId: number | 'pending' | null) => {
  const messagesByConversation = useAppStore((state) => state.messagesByConversation)
  const streamingMessages = useAppStore((state) => state.streamingMessages)
  const loadingConversations = useAppStore((state) => state.loadingConversations)
  const loadMessages = useAppStore((state) => state.loadMessages)
  const addMessage = useAppStore((state) => state.addMessage)
  const setStreamingMessage = useAppStore((state) => state.setStreamingMessage)
  const clearStreamingMessage = useAppStore((state) => state.clearStreamingMessage)

  // Memoize derived values
  const messages = useMemo(() => {
    return conversationId ? (messagesByConversation.get(conversationId) || []) : []
  }, [conversationId, messagesByConversation])

  const streamingMessage = useMemo(() => {
    return conversationId ? (streamingMessages.get(conversationId) || '') : ''
  }, [conversationId, streamingMessages])

  const isLoading = useMemo(() => {
    return conversationId && typeof conversationId === 'number' ? loadingConversations.has(conversationId) : false
  }, [conversationId, loadingConversations])

  return {
    messages,
    streamingMessage,
    isLoading,
    loadMessages,
    addMessage,
    setStreamingMessage,
    clearStreamingMessage
  }
}

export const useProviders = () => {
  const providers = useAppStore((state) => state.providers)
  const isProvidersLoaded = useAppStore((state) => state.isProvidersLoaded)
  const loadProviders = useAppStore((state) => state.loadProviders)
  const updateProviders = useAppStore((state) => state.updateProviders)

  return {
    providers,
    isProvidersLoaded,
    loadProviders,
    updateProviders
  }
}

export const useErrors = () => {
  const errorStates = useAppStore((state) => state.errorStates)
  const retryAttempts = useAppStore((state) => state.retryAttempts)
  const setError = useAppStore((state) => state.setError)
  const clearError = useAppStore((state) => state.clearError)
  const resetRetryAttempt = useAppStore((state) => state.resetRetryAttempt)
  
  return {
    errorStates,
    retryAttempts,
    setError,
    clearError,
    resetRetryAttempt,
    getError: (id: number | 'pending') => errorStates.get(id) || null,
    getRetryAttempts: (id: number | 'pending') => retryAttempts.get(id) || 0
  }
}