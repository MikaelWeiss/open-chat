import { emit, listen } from '@tauri-apps/api/event'

// Super simple sync - tells other windows to reload from storage
class MessageSync {
  private messageListener: (() => void) | null = null
  private settingsListener: (() => void) | null = null

  async notifyMessageUpdate(conversationId: number | 'pending') {
    // Skip pending conversations since they're not in DB
    if (conversationId === 'pending') return
    
    try {
      await emit('message-updated', { conversationId })
    } catch (error) {
      // Ignore errors - this is best effort
    }
  }

  async notifySettingsUpdate() {
    try {
      await emit('settings-updated', {})
    } catch (error) {
      // Ignore errors - this is best effort
    }
  }

  async setupListeners(
    onMessageUpdate: (conversationId: number) => void,
    onSettingsUpdate: () => void
  ) {
    // Clean up existing listeners
    if (this.messageListener) {
      this.messageListener()
      this.messageListener = null
    }
    if (this.settingsListener) {
      this.settingsListener()
      this.settingsListener = null
    }

    // Listen for message updates from other windows
    this.messageListener = await listen<{ conversationId: number }>('message-updated', (event) => {
      if (typeof event.payload.conversationId === 'number') {
        onMessageUpdate(event.payload.conversationId)
      }
    })

    // Listen for settings updates from other windows
    this.settingsListener = await listen('settings-updated', () => {
      onSettingsUpdate()
    })
  }

  cleanup() {
    if (this.messageListener) {
      this.messageListener()
      this.messageListener = null
    }
    if (this.settingsListener) {
      this.settingsListener()
      this.settingsListener = null
    }
  }
}

export const messageSync = new MessageSync()