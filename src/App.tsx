import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatView, { ChatViewHandle } from './components/Chat/ChatView'
import SettingsModal from './components/Settings/SettingsModal'
import SettingsErrorModal from './components/Settings/SettingsErrorModal'
import ShortcutsModal from './components/Shortcuts/ShortcutsModal'
import ToastContainer from './components/Toast/Toast'
import { useConversationStore } from './stores/conversationStore'
import { useSettingsStore } from './stores/settingsStore'
import { DEFAULT_SIDEBAR_WIDTH } from './shared/constants'
import { applyTheme, setupSystemThemeListener } from './shared/theme'

function App() {
  // Check if we're in quick chat mode
  const searchParams = new URLSearchParams(window.location.search)
  const isQuickChat = searchParams.get('mode') === 'quickchat'
  
  const [sidebarOpen, setSidebarOpen] = useState(!isQuickChat)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const chatViewRef = useRef<ChatViewHandle>(null)
  
  const { 
    conversations, 
    selectedConversation, 
    loadConversations, 
    selectConversation,
    createConversation,
    deleteConversation,
    toggleStarConversation
  } = useConversationStore()
  
  const { 
    settings, 
    corruptionStatus, 
    loadSettings, 
    resetSettings, 
    openSettingsInEditor,
    reloadSettings
  } = useSettingsStore()

  const handleOpenFeedback = async () => {
    const subject = 'Feedback for Open Chat'
    const body = 'Hi,\n\nI wanted to share some feedback about Open Chat:\n\n'
    const mailtoUrl = `mailto:support@weisssolutions.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    try {
      await window.electronAPI.shell.openExternal(mailtoUrl)
    } catch (error) {
      console.error('Failed to open mail client:', error)
    }
  }

  useEffect(() => {
    // Load initial data
    loadConversations()
    loadSettings()
  }, [loadConversations, loadSettings])

  // Global hotkey handler for new conversation
  useEffect(() => {
    const handleTriggerNewConversation = () => {
      createConversation()
    }

    // @ts-ignore - electronAPI is available in Electron context
    if (window.electronAPI?.app?.onTriggerNewConversation) {
      // @ts-ignore
      window.electronAPI.app.onTriggerNewConversation(handleTriggerNewConversation)
    }

    return () => {
      // @ts-ignore
      if (window.electronAPI?.app?.removeAppListeners) {
        // @ts-ignore
        window.electronAPI.app.removeAppListeners()
      }
    }
  }, [createConversation])

  // Listen for conversation updates from other windows
  useEffect(() => {
    const handleConversationUpdate = async (data: { conversationId?: string, action: string }) => {
      const currentId = selectedConversation?.id
      const store = useConversationStore.getState()
      
      // Skip the 'created' broadcast if we already have this conversation in our list
      // This prevents duplicates when we create a conversation locally
      if (data.action === 'created' && data.conversationId) {
        const existingConversation = store.conversations.find(c => c.id === data.conversationId)
        if (existingConversation) {
          return // Skip reload, we already have this conversation
        }
      }
      
      if (data.action === 'message_added' && data.conversationId === currentId) {
        // If a message was added to our current conversation from another window,
        // we need to refresh the conversation to get the new messages
        try {
          const updatedConversations = await window.electronAPI.conversations.getAll()
          const updatedConversation = updatedConversations.find(c => c.id === currentId)
          
          if (updatedConversation) {
            // Update both the conversations list and selected conversation
            const nonEmptyConversations = updatedConversations.filter(conv => conv.messages.length > 0)
            useConversationStore.getState().selectConversation(updatedConversation)
            // Update the conversations list in the store manually
            useConversationStore.setState(state => ({
              ...state,
              conversations: nonEmptyConversations.map(c => 
                c.id === currentId ? updatedConversation : c
              )
            }))
          }
        } catch (error) {
          console.error('Failed to update conversation:', error)
          // Fallback to full reload
          loadConversations()
        }
        return
      }
      
      // For all other cases (new conversations, deletions, etc), reload
      loadConversations()
    }

    // @ts-ignore - electronAPI is available in Electron context
    if (window.electronAPI?.app?.onConversationUpdated) {
      // @ts-ignore
      window.electronAPI.app.onConversationUpdated(handleConversationUpdate)
    }

    return () => {
      // Cleanup is handled by removeAppListeners
    }
  }, [loadConversations, selectedConversation?.id])

  // Theme handling
  useEffect(() => {
    if (settings?.theme) {
      applyTheme(settings.theme)
    }

    // Listen for system theme changes when using system theme
    if (settings?.theme === 'system') {
      const cleanup = setupSystemThemeListener(settings.theme)
      return cleanup || undefined
    }
  }, [settings?.theme])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl + N - New chat
      if (isCtrlOrCmd && e.key === 'n') {
        e.preventDefault()
        createConversation()
      }
      
      // Cmd/Ctrl + T - New chat (alternative)
      if (isCtrlOrCmd && e.key === 't') {
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
    <div className={`flex h-screen bg-background text-foreground ${isQuickChat ? 'quick-chat-mode' : ''}`}>
      {!isQuickChat && (
        <Sidebar
          isOpen={sidebarOpen}
          width={sidebarWidth}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onWidthChange={setSidebarWidth}
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={selectConversation}
          onOpenSettings={() => setSettingsOpen(true)}
          onNewConversation={createConversation}
          onDeleteConversation={deleteConversation}
          onToggleStarConversation={toggleStarConversation}
          onOpenFeedback={handleOpenFeedback}
        />
      )}
      
      <ChatView
        ref={chatViewRef}
        conversation={selectedConversation}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {!isQuickChat && (
        <>
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />

          <ShortcutsModal
            isOpen={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
          />

          <SettingsErrorModal
            isOpen={corruptionStatus?.corrupted || false}
            onClose={() => {}} // Don't allow closing this modal - they must fix the issue
            corruptionStatus={corruptionStatus || { corrupted: false, error: null, settingsPath: '' }}
            onReset={resetSettings}
            onOpenInEditor={openSettingsInEditor}
            onRefresh={reloadSettings}
          />
        </>
      )}

      <ToastContainer />
    </div>
  )
}

export default App