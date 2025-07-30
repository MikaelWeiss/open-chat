import { create } from 'zustand'
import type { Conversation, Message } from '@/types/electron'

interface ConversationStore {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  loading: boolean
  error: string | null
  
  // Actions
  loadConversations: () => Promise<void>
  selectConversation: (conversation: Conversation | null) => void
  createConversation: () => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  renameConversation: (conversationId: string, newTitle: string) => Promise<void>
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  selectedConversation: null,
  loading: false,
  error: null,
  
  loadConversations: async () => {
    set({ loading: true, error: null })
    try {
      const conversations = await window.electronAPI.conversations.getAll()
      set({ 
        conversations, 
        loading: false,
        // Select first conversation if none selected
        selectedConversation: get().selectedConversation || conversations[0] || null
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  selectConversation: (conversation) => {
    set({ selectedConversation: conversation })
  },
  
  createConversation: async () => {
    try {
      const newConversation = await window.electronAPI.conversations.create()
      set(state => ({
        conversations: [newConversation, ...state.conversations],
        selectedConversation: newConversation
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
          return {
            conversations: filtered,
            selectedConversation: state.selectedConversation?.id === conversationId 
              ? filtered[0] || null 
              : state.selectedConversation
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
      const newMessage = await window.electronAPI.conversations.addMessage(conversationId, message)
      if (newMessage) {
        set(state => ({
          conversations: state.conversations.map(c => {
            if (c.id === conversationId) {
              return {
                ...c,
                messages: [...c.messages, newMessage],
                updatedAt: new Date().toISOString()
              }
            }
            return c
          }),
          selectedConversation: state.selectedConversation?.id === conversationId
            ? {
                ...state.selectedConversation,
                messages: [...state.selectedConversation.messages, newMessage],
                updatedAt: new Date().toISOString()
              }
            : state.selectedConversation
        }))
      }
    } catch (error) {
      set({ error: error.message })
    }
  }
}))