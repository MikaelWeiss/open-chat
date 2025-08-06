import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onNewChat: () => void
  onToggleSidebar: () => void
  onToggleSettings: () => void
  onToggleShortcuts: () => void
  onSendFeedback: () => void
  onFocusInput: () => void
  onCloseModal: () => void
  settingsOpen: boolean
  shortcutsOpen: boolean
}

export const useKeyboardShortcuts = ({
  onNewChat,
  onToggleSidebar,
  onToggleSettings,
  onToggleShortcuts,
  onSendFeedback,
  onFocusInput,
  onCloseModal,
  settingsOpen,
  shortcutsOpen
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field or textarea
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
      
      // Handle Escape key - should work even in input fields when modals are open
      if (event.key === 'Escape' && (settingsOpen || shortcutsOpen)) {
        event.preventDefault()
        onCloseModal()
        return
      }
      
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? event.metaKey : event.ctrlKey
      
      // Only proceed if the appropriate modifier key is pressed
      if (!modifierKey) return
      
      switch (event.key.toLowerCase()) {
        case 'n':
          // Cmd/Ctrl + N - New chat
          event.preventDefault()
          onNewChat()
          break
          
        case 't':
          // Cmd/Ctrl + T - New chat (alternative)
          event.preventDefault()
          onNewChat()
          break
          
        case 's':
          // Cmd/Ctrl + S - Toggle sidebar
          event.preventDefault()
          onToggleSidebar()
          break
          
        case ',':
          // Cmd/Ctrl + , - Toggle settings
          event.preventDefault()
          onToggleSettings()
          break
          
        case '/':
          // Cmd/Ctrl + / - Toggle keyboard shortcuts
          event.preventDefault()
          onToggleShortcuts()
          break
          
        case 'f':
          // Cmd/Ctrl + Shift + F - Send feedback
          if (event.shiftKey) {
            event.preventDefault()
            onSendFeedback()
          }
          break
          
        case 'l':
          // Cmd/Ctrl + L - Focus message input
          event.preventDefault()
          onFocusInput()
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    onNewChat,
    onToggleSidebar,
    onToggleSettings,
    onToggleShortcuts,
    onSendFeedback,
    onFocusInput,
    onCloseModal,
    settingsOpen,
    shortcutsOpen
  ])
}