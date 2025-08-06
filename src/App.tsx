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
import { useConversations } from './hooks/useConversations'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const messageInputRef = useRef<MessageInputHandle>(null)
  
  // Initialize settings (theme will be applied in useSettings hook)
  useSettings()
  
  // Initialize conversations
  const { conversations, createConversation } = useConversations()
  
  // Create initial conversation when app starts and no conversation is selected
  useEffect(() => {
    const initializeApp = async () => {
      // Only create a new conversation if there's no selected conversation and no existing conversations
      if (!selectedConversationId && conversations.length === 0) {
        try {
          const id = await createConversation('New Conversation', '', '')
          setSelectedConversationId(id || null)
        } catch (err) {
          console.error('Failed to create initial conversation:', err)
        }
      }
    }
    
    initializeApp()
  }, [conversations, selectedConversationId, createConversation])

  // Keyboard shortcut handlers
  const handleNewChat = async () => {
    try {
      const id = await createConversation('New Conversation', '', '')
      setSelectedConversationId(id || null)
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

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onToggleSidebar: handleToggleSidebar,
    onToggleSettings: handleToggleSettings,
    onToggleShortcuts: handleToggleShortcuts,
    onSendFeedback: handleSendFeedback,
    onFocusInput: handleFocusInput,
    onCloseModal: handleCloseModal,
    settingsOpen,
    shortcutsOpen
  })

  return (
    <div className="flex h-screen bg-secondary text-foreground">
      <Sidebar
        isOpen={sidebarOpen}
        width={sidebarWidth}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onWidthChange={setSidebarWidth}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />
      
      <div className="flex-1 pr-2 pb-2 min-w-0 flex">
        <div className="flex-1 rounded-lg flex flex-col min-h-0 overflow-hidden">
          <ChatView 
            conversationId={selectedConversationId}
            onOpenSettings={() => setSettingsOpen(true)} 
            messageInputRef={messageInputRef}
          />
        </div>
      </div>
      
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
