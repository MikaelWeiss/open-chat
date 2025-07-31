import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatView, { ChatViewHandle } from './components/Chat/ChatView'
import SettingsModal from './components/Settings/SettingsModal'
import ShortcutsModal from './components/Shortcuts/ShortcutsModal'
import ToastContainer from './components/Toast/Toast'
import { useConversationStore } from './stores/conversationStore'
import { useSettingsStore } from './stores/settingsStore'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const chatViewRef = useRef<ChatViewHandle>(null)
  
  const { 
    conversations, 
    selectedConversation, 
    loadConversations, 
    selectConversation,
    createConversation
  } = useConversationStore()
  
  const { settings, loadSettings } = useSettingsStore()

  useEffect(() => {
    // Load initial data
    loadConversations()
    loadSettings()
  }, [loadConversations, loadSettings])

  // Theme handling
  useEffect(() => {
    const applyTheme = (theme: string) => {
      const root = document.documentElement
      
      if (theme === 'system') {
        // Use system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (systemPrefersDark) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      } else if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    if (settings?.theme) {
      applyTheme(settings.theme)
    }

    // Listen for system theme changes when using system theme
    if (settings?.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }

      mediaQuery.addEventListener('change', handleSystemThemeChange)
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [settings?.theme])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl + N - New chat
      if (isCtrlOrCmd && e.key === 'n') {
        e.preventDefault()
        createConversation()
      }
      
      // Cmd/Ctrl + , - Toggle Settings
      if (isCtrlOrCmd && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(!settingsOpen)
      }
      
      // Cmd/Ctrl + / - Keyboard shortcuts
      if (isCtrlOrCmd && e.key === '/') {
        e.preventDefault()
        setShortcutsOpen(true)
      }
      
      // Cmd/Ctrl + L - Focus input field
      if (isCtrlOrCmd && e.key === 'l') {
        e.preventDefault()
        chatViewRef.current?.focusInput()
      }
      
      // Cmd/Ctrl + S - Toggle sidebar
      if (isCtrlOrCmd && e.key === 's') {
        e.preventDefault()
        setSidebarOpen(!sidebarOpen)
      }
      
      // ESC - Close modals
      if (e.key === 'Escape') {
        if (settingsOpen) {
          e.preventDefault()
          setSettingsOpen(false)
        } else if (shortcutsOpen) {
          e.preventDefault()
          setShortcutsOpen(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createConversation, settingsOpen, shortcutsOpen, sidebarOpen])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={selectConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        onNewConversation={createConversation}
      />
      
      <ChatView
        ref={chatViewRef}
        conversation={selectedConversation}
        sidebarOpen={sidebarOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <ToastContainer />
    </div>
  )
}

export default App