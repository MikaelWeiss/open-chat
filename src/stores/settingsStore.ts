import { create } from 'zustand'
import type { Settings } from '@/types/electron'

interface SettingsStore {
  settings: Settings | null
  loading: boolean
  error: string | null
  
  // Actions
  loadSettings: () => Promise<void>
  updateSettings: (settings: Partial<Settings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: false,
  error: null,
  
  loadSettings: async () => {
    set({ loading: true, error: null })
    try {
      const settings = await window.electronAPI.settings.get()
      set({ settings, loading: false })
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
  }
}))