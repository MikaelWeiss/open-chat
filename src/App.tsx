import { useState, useRef, useEffect } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatView from './components/Chat/ChatView'
import SettingsModal from './components/Settings/SettingsModal'
import ShortcutsModal from './components/Shortcuts/ShortcutsModal'
import ToastContainer from './components/Toast/Toast'
import { DEFAULT_SIDEBAR_WIDTH } from './shared/constants'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { MessageInputHandle } from './components/Chat/MessageInput'
import { useSettings } from './hooks/useSettings'
import { useConversations, useAppStore } from './stores/appStore'
import { initializeAppStore } from './stores/appStore'
import { checkForUpdatesOnStartup } from './utils/updater'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<'general' | 'models' | 'about'>('general')
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  
  // Use Zustand store for conversations
  const { 
    conversations, 
    selectedConversationId, 
    setSelectedConversation,
    createPendingConversation,
    deleteConversation: deleteConversationFromStore
  } = useConversations()
  const messageInputRef = useRef<MessageInputHandle>(null)
  
  // Initialize settings (theme will be applied in useSettings hook)
  const { handleThemeChange, theme } = useSettings()
  
  // Initialize Zustand store
  useEffect(() => {
    initializeAppStore()
    
    // Check for updates on startup (desktop only)
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      checkForUpdatesOnStartup()
    }
  }, [])
  
  // Listen for custom event to open settings to a specific section
  useEffect(() => {
    const handleOpenSettings = (event: CustomEvent) => {
      const section = event.detail?.section
      if (section === 'providers') {
        setSettingsSection('models')
        setSettingsOpen(true)
      } else if (section === 'general' || section === 'models' || section === 'about') {
        setSettingsSection(section)
        setSettingsOpen(true)
      } else {
        setSettingsOpen(true)
      }
    }
    
    window.addEventListener('openSettings' as any, handleOpenSettings)
    return () => {
      window.removeEventListener('openSettings' as any, handleOpenSettings)
    }
  }, [])
  
  
  
  // Create initial pending conversation when app starts and no conversation is selected
  useEffect(() => {
    // Only create a new pending conversation if there's no selected conversation and no existing conversations
    if (!selectedConversationId && conversations.length === 0) {
      createPendingConversation('New Conversation', '', '')
    }
  }, [conversations.length, selectedConversationId, createPendingConversation])

  // Handle when a conversation is deleted
  const handleConversationDeleted = async (deletedId: number | 'pending') => {
    // Delete from store
    await deleteConversationFromStore(deletedId)
    
    // If the deleted conversation was the currently selected one, create a new pending chat
    if (selectedConversationId === deletedId) {
      try {
        // Get the last conversation's model to inherit it (if any)
        let provider = ''
        let model = ''
        
        if (conversations.length > 1) { // More than 1 because we haven't removed the deleted one from the array yet
          const lastConversation = conversations.find(conv => conv.id !== deletedId) || conversations[0]
          provider = lastConversation.provider || ''
          model = lastConversation.model || ''
        }
        
        // Create a new pending conversation
        createPendingConversation('New Conversation', provider, model)
        
        // Focus the message input after creating new conversation
        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 100)
      } catch (err) {
        console.error('Failed to create new pending conversation after deletion:', err)
      }
    }
  }

  // Keyboard shortcut handlers
  const handleNewChat = () => {
    if (!selectedConversationId) {
      return
    }
    
    // Check if current conversation has messages
    const messages = useAppStore.getState().getMessages(selectedConversationId)
    if (messages.length < 1) {
      return // Don't create new chat if current one is empty
    }
    
    try {
      // Get the last conversation to use its model
      let provider = ''
      let model = ''
      
      if (conversations.length > 0) {
        const lastConversation = conversations[0] // conversations are sorted by most recent
        provider = lastConversation.provider || ''
        model = lastConversation.model || ''
      }
      
      // Create a new pending conversation
      createPendingConversation('New Conversation', provider, model)
      
      // Focus the message input after a short delay
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 100)
    } catch (err) {
      console.error('Failed to create conversation via keyboard shortcut:', err)
    }
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleToggleSettings = () => {
    setSettingsOpen(!settingsOpen)
  }

  const handleToggleShortcuts = () => {
    setShortcutsOpen(!shortcutsOpen)
  }

  const handleSendFeedback = () => {
    console.log('Send feedback triggered via keyboard shortcut')
    // Implementation would open feedback dialog or action
  }

  const handleFocusInput = () => {
    messageInputRef.current?.focus()
  }

  const handleCloseModal = () => {
    if (settingsOpen) {
      setSettingsOpen(false)
    } else if (shortcutsOpen) {
      setShortcutsOpen(false)
    }
  }

  const handleToggleTheme = () => {
    // Toggle between light and dark only
    const newTheme = theme === 'light' ? 'dark' : 'light'
    handleThemeChange(newTheme)
  }

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onToggleSidebar: handleToggleSidebar,
    onToggleSettings: handleToggleSettings,
    onToggleShortcuts: handleToggleShortcuts,
    onSendFeedback: handleSendFeedback,
    onFocusInput: handleFocusInput,
    onCloseModal: handleCloseModal,
    onToggleTheme: handleToggleTheme,
    settingsOpen,
    shortcutsOpen
  })

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        width={sidebarWidth}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onWidthChange={setSidebarWidth}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversation}
        onDeleteConversation={handleConversationDeleted}
      />
      
      <div className={`flex-1 min-w-0 flex ${!sidebarOpen ? '' : ''}`}>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">
          <ChatView 
            conversationId={selectedConversationId}
            onOpenSettings={() => setSettingsOpen(true)} 
            messageInputRef={messageInputRef}
            onSelectConversation={setSelectedConversation}
          />
        </div>
      </div>
      
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialSection={settingsSection}
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
