import { create } from 'zustand'
import type { Conversation, Message } from '@/types/electron'

interface ConversationStore {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  loading: boolean
  error: string | null
  isStreaming: boolean
  streamingConversationId: string | null
  
  // Actions
  loadConversations: () => Promise<void>
  selectConversation: (conversation: Conversation | null) => void
  createConversation: (provider?: string, model?: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  renameConversation: (conversationId: string, newTitle: string) => Promise<void>
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>
  setStreaming: (conversationId: string | null) => void
  cancelStream: () => Promise<void>
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  selectedConversation: null,
  loading: false,
  error: null,
  isStreaming: false,
  streamingConversationId: null,
  
  loadConversations: async () => {
    const currentSelectedId = get().selectedConversation?.id
    set({ loading: true, error: null })
    try {
      const conversations = await window.electronAPI.conversations.getAll()
      
      // Filter out empty conversations (conversations with no messages)
      const nonEmptyConversations = conversations.filter(conv => conv.messages.length > 0)
      
      // Check if the currently selected conversation still exists
      let selectedConversation = null
      if (currentSelectedId) {
        // If it's a temporary conversation, keep it
        if (currentSelectedId.startsWith('temp-')) {
          selectedConversation = get().selectedConversation
        } else {
          // Find the conversation in the new list
          selectedConversation = nonEmptyConversations.find(conv => conv.id === currentSelectedId)
        }
      }
      
      // If no selection or previous selection doesn't exist, create a new temporary conversation
      if (!selectedConversation) {
        // Get the last used model from the most recent conversation
        const lastConversation = nonEmptyConversations[0]
        const lastProvider = lastConversation?.provider || ''
        const lastModel = lastConversation?.model || ''
        
        selectedConversation = {
          id: `temp-${Date.now()}`,
          title: 'New Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          provider: lastProvider,
          model: lastModel,
          messages: [],
          isTemporary: true
        }
      }
      
      set({ 
        conversations: nonEmptyConversations, 
        loading: false,
        selectedConversation
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  selectConversation: (conversation) => {
    set({ selectedConversation: conversation })
  },
  
  createConversation: async (provider, model) => {
    try {
      const state = get()
      
      // Don't create a new conversation if current one is already empty
      if (state.selectedConversation && state.selectedConversation.messages.length === 0) {
        return
      }
      
      // Create a temporary conversation that hasn't been saved yet
      const tempConversation = {
        id: `temp-${Date.now()}`,
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        provider: provider || '',
        model: model || '',
        messages: [],
        isTemporary: true
      }
      
      set(state => ({
        selectedConversation: tempConversation
      }))
    } catch (error) {
      set({ error: error.message })
    }
  },
  
  deleteConversation: async (conversationId) => {
    try {
      const success = await window.electronAPI.conversations.delete(conversationId)
      if (success) {
        set(state => {
          const filtered = state.conversations.filter(c => c.id !== conversationId)
          let newSelectedConversation = state.selectedConversation
          
          // If the deleted conversation was selected, create a new temporary conversation
          if (state.selectedConversation?.id === conversationId) {
            // Get the last used model from the most recent conversation
            const lastConversation = filtered[0]
            const lastProvider = lastConversation?.provider || ''
            const lastModel = lastConversation?.model || ''
            
            newSelectedConversation = {
              id: `temp-${Date.now()}`,
              title: 'New Conversation',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              provider: lastProvider,
              model: lastModel,
              messages: [],
              isTemporary: true
            }
          }
          
          return {
            conversations: filtered,
            selectedConversation: newSelectedConversation
          }
        })
      }
    } catch (error) {
      set({ error: error.message })
    }
  },
  
  renameConversation: async (conversationId, newTitle) => {
    try {
      const updated = await window.electronAPI.conversations.rename(conversationId, newTitle)
      if (updated) {
        set(state => ({
          conversations: state.conversations.map(c => 
            c.id === conversationId ? updated : c
          ),
          selectedConversation: state.selectedConversation?.id === conversationId 
            ? updated 
            : state.selectedConversation
        }))
      }
    } catch (error) {
      set({ error: error.message })
    }
  },
  
  addMessage: async (conversationId, message) => {
    try {
      const state = get()
      let actualConversationId = conversationId
      let actualConversation = state.selectedConversation
      
      // If this is a temporary conversation, create it in the backend first
      if (state.selectedConversation?.isTemporary) {
        const newConversation = await window.electronAPI.conversations.create(
          state.selectedConversation.provider, 
          state.selectedConversation.model
        )
        actualConversationId = newConversation.id
        actualConversation = newConversation
      }
      
      const newMessage = await window.electronAPI.conversations.addMessage(actualConversationId, message)
      if (newMessage) {
        // After adding the message, get the updated conversation to get any title changes
        const updatedConversations = await window.electronAPI.conversations.getAll()
        const updatedConversation = updatedConversations.find(c => c.id === actualConversationId)
        
        set(state => {
          const wasTemporary = state.selectedConversation?.isTemporary
          
          return {
            conversations: wasTemporary 
              ? [updatedConversation, ...state.conversations]
              : state.conversations.map(c => {
                  if (c.id === actualConversationId) {
                    return updatedConversation
                  }
                  return c
                }),
            selectedConversation: {
              ...updatedConversation,
              isTemporary: false
            }
          }
        })
      }
    } catch (error) {
      set({ error: error.message })
    }
  },
  
  setStreaming: (conversationId) => {
    set({ 
      isStreaming: conversationId !== null, 
      streamingConversationId: conversationId 
    })
  },
  
  cancelStream: async () => {
    const state = get()
    if (state.streamingConversationId) {
      try {
        await window.electronAPI.llm.cancelStream(state.streamingConversationId)
        set({ isStreaming: false, streamingConversationId: null })
      } catch (error) {
        console.error('Failed to cancel stream:', error)
      }
    }
  }
}))