import { emit, listen } from '@tauri-apps/api/event'

// Super simple message sync - just tells other windows to reload from DB
class MessageSync {
  private listener: (() => void) | null = null

  async notifyMessageUpdate(conversationId: number | 'pending') {
    // Skip pending conversations since they're not in DB
    if (conversationId === 'pending') return
    
    try {
      await emit('message-updated', { conversationId })
    } catch (error) {
      // Ignore errors - this is best effort
    }
  }

  async setupListener(onMessageUpdate: (conversationId: number) => void) {
    // Clean up existing listener
    if (this.listener) {
      this.listener()
      this.listener = null
    }

    // Listen for message updates from other windows
    this.listener = await listen<{ conversationId: number }>('message-updated', (event) => {
      if (typeof event.payload.conversationId === 'number') {
        onMessageUpdate(event.payload.conversationId)
      }
    })
  }

  cleanup() {
    if (this.listener) {
      this.listener()
      this.listener = null
    }
  }
}

export const messageSync = new MessageSync()