import { create } from 'zustand'
import type { Settings } from '@/types/electron'

// Toast store
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }))
      }, duration)
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }))
  }
}))

// Settings store

interface CorruptionStatus {
  corrupted: boolean
  error: string | null
  settingsPath: string
}

interface SettingsStore {
  settings: Settings | null
  loading: boolean
  error: string | null
  corruptionStatus: CorruptionStatus | null
  
  // Actions
  loadSettings: () => Promise<void>
  updateSettings: (settings: Partial<Settings>) => Promise<void>
  checkCorruptionStatus: () => Promise<void>
  resetSettings: () => Promise<void>
  openSettingsInEditor: () => Promise<boolean>
  reloadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  error: null,
  corruptionStatus: null,
  
  loadSettings: async () => {
    set({ loading: true, error: null })
    try {
      const settings = await window.electronAPI.settings.get()
      const corruptionStatus = await window.electronAPI.settings.getCorruptionStatus()
      set({ settings, corruptionStatus, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  updateSettings: async (newSettings) => {
    try {
      const updated = await window.electronAPI.settings.update(newSettings)
      set({ settings: updated })
    } catch (error) {
      set({ error: error.message })
    }
  },

  checkCorruptionStatus: async () => {
    try {
      const corruptionStatus = await window.electronAPI.settings.getCorruptionStatus()
      set({ corruptionStatus })
    } catch (error) {
      console.error('Failed to check corruption status:', error)
    }
  },

  resetSettings: async () => {
    try {
      const settings = await window.electronAPI.settings.reset()
      const corruptionStatus = await window.electronAPI.settings.getCorruptionStatus()
      set({ settings, corruptionStatus })
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  openSettingsInEditor: async () => {
    try {
      return await window.electronAPI.settings.openInEditor()
    } catch (error) {
      console.error('Failed to open settings in editor:', error)
      return false
    }
  },

  reloadSettings: async () => {
    set({ loading: true, error: null })
    try {
      const result = await window.electronAPI.settings.reload()
      set({ 
        settings: result.settings, 
        corruptionStatus: result.corruptionStatus, 
        loading: false 
      })
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
}))