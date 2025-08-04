import { useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useConversationStore } from '@/stores/conversationStore'

interface UseKeyboardShortcutsReturn {
  handleKeyDown: (
    e: React.KeyboardEvent,
    options: {
      onSend: () => void
      onCancel?: () => void
      disabled?: boolean
      isLoading?: boolean
    }
  ) => void
}

export function useKeyboardShortcuts(): UseKeyboardShortcutsReturn {
  const { settings } = useSettingsStore()
  const { isStreaming, cancelStream } = useConversationStore()

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    options: {
      onSend: () => void
      onCancel?: () => void
      disabled?: boolean
      isLoading?: boolean
    }
  ) => {
    const { onSend, onCancel, disabled = false, isLoading = false } = options

    // Handle escape key for canceling streams
    if (e.key === 'Escape' && isStreaming) {
      e.preventDefault()
      cancelStream()
      onCancel?.()
      return
    }
    
    if (disabled || isLoading) return
    
    const sendKey = settings?.keyboard?.sendMessage || 'enter'
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey

    if (sendKey === 'enter') {
      // Enter sends, Shift+Enter for new line
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (isStreaming) {
          cancelStream()
          onCancel?.()
        } else {
          onSend()
        }
      }
    } else if (sendKey === 'cmd-enter') {
      // Cmd/Ctrl+Enter sends, Enter for new line
      if (e.key === 'Enter' && isCtrlOrCmd) {
        e.preventDefault()
        if (isStreaming) {
          cancelStream()
          onCancel?.()
        } else {
          onSend()
        }
      }
    }
  }, [settings?.keyboard?.sendMessage, isStreaming, cancelStream])

  return {
    handleKeyDown
  }
}