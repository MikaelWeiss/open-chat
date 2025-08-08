import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useMemo } from 'react'
import { conversationStore, type Conversation } from '../shared/conversationStore'
import { messageStore, type Message, type CreateMessageInput } from '../shared/messageStore'
import { settings, SETTINGS_KEYS } from '../shared/settingsStore'
import { type Provider } from '../types/provider'

// Draft conversation type (exists only in memory)
export interface DraftConversation {
  id: string // temporary ID (UUID or timestamp)
  title: string
  provider: string
  model: string
  system_prompt?: string
  isDraft: true
  created_at: string
  updated_at: string
}

// Combined conversation type
export type ConversationWithDraft = Conversation | DraftConversation

// App state interface
interface AppState {
  // Conversations
  conversations: Conversation[]
  draftConversations: Map<string, DraftConversation>
  selectedConversationId: number | string | null
  
  // Messages
  messagesByConversation: Map<number | string, Message[]>
  streamingMessages: Map<number | string, string>
  loadingConversations: Set<number | string>
  
  // Providers
  providers: Record<string, Provider>
  isProvidersLoaded: boolean
  
  // Actions - Conversations
  loadConversations: () => Promise<void>
  createDraftConversation: (title: string, provider: string, model: string, systemPrompt?: string) => string
  promoteToPersistent: (draftId: string) => Promise<number | null>
  updateConversation: (id: number | string, updates: Partial<Conversation>) => Promise<void>
  deleteConversation: (id: number | string) => Promise<void>
  setSelectedConversation: (id: number | string | null) => void
  
  // Actions - Messages
  loadMessages: (conversationId: number | string) => Promise<void>
  addMessage: (conversationId: number | string, message: CreateMessageInput) => Promise<void>
  setStreamingMessage: (conversationId: number | string, content: string) => void
  clearStreamingMessage: (conversationId: number | string) => void
  
  // Actions - Providers
  loadProviders: () => Promise<void>
  updateProviders: (providers: Record<string, Provider>) => void
  
  // Helper methods
  getConversation: (id: number | string) => ConversationWithDraft | null
  getAllConversations: () => ConversationWithDraft[]
  getMessages: (conversationId: number | string) => Message[]
  getStreamingMessage: (conversationId: number | string) => string
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    conversations: [],
    draftConversations: new Map(),
    selectedConversationId: null,
    messagesByConversation: new Map(),
    streamingMessages: new Map(),
    loadingConversations: new Set(),
    providers: {},
    isProvidersLoaded: false,

    // Conversation actions
    loadConversations: async () => {
      try {
        const conversations = await conversationStore.getConversations()
        set({ conversations })
      } catch (error) {
        console.error('Failed to load conversations:', error)
      }
    },

    createDraftConversation: (title: string, provider: string, model: string, systemPrompt?: string) => {
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()
      
      const draft: DraftConversation = {
        id: draftId,
        title,
        provider,
        model,
        system_prompt: systemPrompt,
        isDraft: true,
        created_at: now,
        updated_at: now
      }

      set((state) => ({
        draftConversations: new Map(state.draftConversations.set(draftId, draft))
      }))

      return draftId
    },

    promoteToPersistent: async (draftId: string) => {
      const state = get()
      const draft = state.draftConversations.get(draftId)
      
      if (!draft) {
        console.error('Draft conversation not found:', draftId)
        return null
      }

      try {
        // Create persistent conversation
        const persistentId = await conversationStore.createConversation(
          draft.title,
          draft.provider,
          draft.model,
          draft.system_prompt
        )

        if (persistentId) {
          // Remove from drafts
          const newDrafts = new Map(state.draftConversations)
          newDrafts.delete(draftId)
          
          // Move messages if any exist in memory
          const draftMessages = state.messagesByConversation.get(draftId)
          if (draftMessages && draftMessages.length > 0) {
            // Save messages to persistent storage
            for (const message of draftMessages) {
              // Convert Message to CreateMessageInput by handling null text
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
            
            // Update messages map
            const newMessagesByConversation = new Map(state.messagesByConversation)
            newMessagesByConversation.delete(draftId)
            newMessagesByConversation.set(persistentId, draftMessages)
            
            set({ messagesByConversation: newMessagesByConversation })
          }
          
          // Reload conversations to get the new persistent one
          await get().loadConversations()
          
          set({ 
            draftConversations: newDrafts,
            selectedConversationId: persistentId
          })

          return persistentId
        }
      } catch (error) {
        console.error('Failed to promote draft to persistent:', error)
      }
      
      return null
    },

    updateConversation: async (id: number | string, updates: Partial<Conversation>) => {
      if (typeof id === 'string') {
        // Update draft conversation
        const state = get()
        const draft = state.draftConversations.get(id)
        if (draft) {
          const updatedDraft: DraftConversation = { 
            ...draft, 
            ...updates, 
            id: draft.id, // Ensure id stays string
            system_prompt: (updates.system_prompt !== undefined ? updates.system_prompt : draft.system_prompt) || undefined,
            isDraft: true,
            updated_at: new Date().toISOString() 
          }
          set((state) => ({
            draftConversations: new Map(state.draftConversations.set(id, updatedDraft))
          }))
        }
      } else {
        // Update persistent conversation
        try {
          await conversationStore.updateConversation(id, updates)
          await get().loadConversations()
        } catch (error) {
          console.error('Failed to update conversation:', error)
        }
      }
    },

    deleteConversation: async (id: number | string) => {
      if (typeof id === 'string') {
        // Delete draft conversation
        const state = get()
        const newDrafts = new Map(state.draftConversations)
        newDrafts.delete(id)
        
        // Also remove any messages
        const newMessagesByConversation = new Map(state.messagesByConversation)
        newMessagesByConversation.delete(id)
        
        set({ 
          draftConversations: newDrafts,
          messagesByConversation: newMessagesByConversation
        })
      } else {
        // Delete persistent conversation
        try {
          await conversationStore.deleteConversation(id)
          await get().loadConversations()
          
          // Remove messages from memory
          const newMessagesByConversation = new Map(get().messagesByConversation)
          newMessagesByConversation.delete(id)
          set({ messagesByConversation: newMessagesByConversation })
        } catch (error) {
          console.error('Failed to delete conversation:', error)
        }
      }
    },

    setSelectedConversation: (id: number | string | null) => {
      set({ selectedConversationId: id })
    },

    // Message actions
    loadMessages: async (conversationId: number | string) => {
      if (typeof conversationId === 'string') {
        // Draft conversation - messages only exist in memory
        return
      }

      const state = get()
      if (state.loadingConversations.has(conversationId)) {
        return // Already loading
      }

      try {
        const newLoadingConversations = new Set(state.loadingConversations)
        newLoadingConversations.add(conversationId)
        set({ loadingConversations: newLoadingConversations })

        const messages = await messageStore.getMessages(conversationId)
        
        set((state) => ({
          messagesByConversation: new Map(state.messagesByConversation.set(conversationId, messages)),
          loadingConversations: new Set([...state.loadingConversations].filter(id => id !== conversationId))
        }))
      } catch (error) {
        console.error('Failed to load messages:', error)
        set((state) => ({
          loadingConversations: new Set([...state.loadingConversations].filter(id => id !== conversationId))
        }))
      }
    },

    addMessage: async (conversationId: number | string, message: CreateMessageInput) => {
      if (typeof conversationId === 'string') {
        // Draft conversation - store in memory
        const state = get()
        const existingMessages = state.messagesByConversation.get(conversationId) || []
        const newMessage: Message = {
          id: Date.now(),
          conversation_id: conversationId as any,
          role: message.role,
          text: message.text || '',
          images: message.images,
          audio: message.audio,
          files: message.files,
          processing_time_ms: message.processing_time_ms,
          created_at: new Date().toISOString()
        }
        
        set((state) => ({
          messagesByConversation: new Map(state.messagesByConversation.set(conversationId, [...existingMessages, newMessage]))
        }))
      } else {
        // Persistent conversation - save to database and update memory
        try {
          await messageStore.addMessage(conversationId, message)
          await get().loadMessages(conversationId) // Reload to get the saved message with ID
        } catch (error) {
          console.error('Failed to add message:', error)
        }
      }
    },

    setStreamingMessage: (conversationId: number | string, content: string) => {
      set((state) => ({
        streamingMessages: new Map(state.streamingMessages.set(conversationId, content))
      }))
    },

    clearStreamingMessage: (conversationId: number | string) => {
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

    // Helper methods
    getConversation: (id: number | string) => {
      const state = get()
      if (typeof id === 'string') {
        return state.draftConversations.get(id) || null
      } else {
        return state.conversations.find(conv => conv.id === id) || null
      }
    },

    getAllConversations: () => {
      const state = get()
      const allConversations: ConversationWithDraft[] = [
        ...state.conversations,
        ...Array.from(state.draftConversations.values())
      ]
      
      // Sort by updated_at (most recent first)
      return allConversations.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    },

    getMessages: (conversationId: number | string) => {
      return get().messagesByConversation.get(conversationId) || []
    },

    getStreamingMessage: (conversationId: number | string) => {
      return get().streamingMessages.get(conversationId) || ''
    }
  }))
)

// Initialize store by loading data
export const initializeAppStore = async () => {
  const store = useAppStore.getState()
  await Promise.all([
    store.loadConversations(),
    store.loadProviders()
  ])
}

// Selector hooks for common patterns
export const useConversations = () => {
  // Use separate selectors to avoid object recreation
  const persistentConversations = useAppStore((state) => state.conversations)
  const draftConversations = useAppStore((state) => state.draftConversations)
  const selectedConversationId = useAppStore((state) => state.selectedConversationId)
  const createDraftConversation = useAppStore((state) => state.createDraftConversation)
  const promoteToPersistent = useAppStore((state) => state.promoteToPersistent)
  const updateConversation = useAppStore((state) => state.updateConversation)
  const deleteConversation = useAppStore((state) => state.deleteConversation)
  const setSelectedConversation = useAppStore((state) => state.setSelectedConversation)
  const getConversation = useAppStore((state) => state.getConversation)

  // Memoize the combined conversations
  const conversations = useMemo(() => {
    const allConversations: ConversationWithDraft[] = [
      ...persistentConversations,
      ...Array.from(draftConversations.values())
    ]
    
    // Sort by updated_at (most recent first)
    return allConversations.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }, [persistentConversations, draftConversations.size, Array.from(draftConversations.keys()).join(',')])

  return {
    conversations,
    selectedConversationId,
    createDraftConversation,
    promoteToPersistent,
    updateConversation,
    deleteConversation,
    setSelectedConversation,
    getConversation
  }
}

export const useMessages = (conversationId: number | string | null) => {
  // Get raw data from store and memoize the results
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
    return conversationId ? loadingConversations.has(conversationId) : false
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