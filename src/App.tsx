import { useState, useRef, useEffect } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatView from './components/Chat/ChatView'
import SettingsModal from './components/Settings/SettingsModal'
import ShortcutsModal from './components/Shortcuts/ShortcutsModal'
import ToastContainer from './components/Toast/Toast'
import OnboardingModal from './components/Onboarding/OnboardingModal'
import { DEFAULT_SIDEBAR_WIDTH, TELEMETRY_CONFIG } from './shared/constants'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { MessageInputHandle } from './components/Chat/MessageInput'
import { useSettings } from './hooks/useSettings'
import { useConversations, useAppStore } from './stores/appStore'
import { initializeAppStore } from './stores/appStore'
import { messageSync } from './utils/messageSync'
import { telemetryService } from './services/telemetryService'
import { ollamaService } from './services/ollamaService'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { getCurrentWindow } from '@tauri-apps/api/window'

function App() {
  // Check if we're in mini window mode
  const isMiniWindow = new URLSearchParams(window.location.search).get('window') === 'mini'
  
  const [sidebarOpen, setSidebarOpen] = useState(!isMiniWindow) // Hide sidebar in mini window
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<'general' | 'models' | 'about'>('general')
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  
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
  const { handleThemeChange, theme, hasCompletedOnboarding, isLoading: settingsLoading } = useSettings()
  
  // Initialize Zustand store and message sync
  useEffect(() => {
    const initialize = async () => {
      // Initialize TelemetryDeck (non-blocking)
      telemetryService.initialize({
        appID: TELEMETRY_CONFIG.APP_ID,
        testMode: TELEMETRY_CONFIG.TEST_MODE,
      }).then(() => {
        // Track app launch after initialization
        telemetryService.trackAppLaunched()
      }).catch(error => {
        console.warn('Telemetry initialization failed:', error)
      })
      
      // Initialize store
      await initializeAppStore()
      
      // Auto-start Ollama (non-blocking)
      ollamaService.autoStartOllama().then(result => {
        if (result.success) {
          console.log('Ollama auto-start:', result.message)
        } else {
          console.warn('Ollama auto-start failed:', result.message)
        }
      }).catch(error => {
        console.warn('Ollama auto-start error:', error)
      })
      
      // Set up sync listeners
      await messageSync.setupListeners(
        (conversationId) => {
          // Reload messages for the updated conversation
          useAppStore.getState().loadMessages(conversationId)
        },
        () => {
          // Reload all settings when settings change
          const store = useAppStore.getState()
          store.loadProviders()
          
          // Also reload settings from the hook (this will apply theme)
          window.dispatchEvent(new CustomEvent('reloadSettings'))
        }
      )
    }
    
    initialize()
    
    // Cleanup on unmount
    return () => {
      messageSync.cleanup()
    }
  }, [])

  // Setup cleanup handler for app shutdown
  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setupCleanup = async () => {
      try {
        const appWindow = getCurrentWindow()
        
        // Listen for the window close event
        unlisten = await appWindow.onCloseRequested(async () => {
          console.log('App close requested, stopping Ollama...')
          
          // Stop Ollama completely (this automatically unloads all models)
          try {
            const result = await ollamaService.stopOllama()
            if (result.success) {
              console.log('Ollama cleanup completed:', result.message)
            } else {
              console.warn('Ollama cleanup warning:', result.message)
            }
          } catch (error) {
            console.warn('Failed to stop Ollama:', error)
          }
          
          // Allow the window to close after cleanup
          // Don't prevent the close, just clean up first
        })
      } catch (error) {
        console.warn('Failed to setup cleanup handler:', error)
      }
    }
    
    setupCleanup()
    
    // Cleanup the listener when component unmounts
    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [])  // No dependencies needed - this is a one-time setup

  // Check for app updates on startup
  useEffect(() => {
    // Don't check for updates in mini window mode
    if (isMiniWindow) {
      return
    }

    const checkForUpdates = async () => {
      const update = await check();
      if (update) {
        console.log(
          `found update ${update.version} from ${update.date} with notes ${update.body}`
        );
        let downloaded = 0;
        let contentLength = 0;
        // alternatively we could also call update.download() and update.install() separately
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength || 0;
              console.log(`started downloading ${event.data.contentLength || 0} bytes`);
              break;
            case 'Progress':
              downloaded += event.data.chunkLength || 0;
              console.log(`downloaded ${downloaded} from ${contentLength}`);
              break;
            case 'Finished':
              console.log('download finished');
              break;
          }
        });
      
        console.log('update installed');
        await relaunch();
      }
    }

    checkForUpdates();
  }, [isMiniWindow])
  
  // Reload state when window gains focus
  useEffect(() => {
    const handleFocus = async () => {
      const store = useAppStore.getState()
      
      // Reload providers from settings.json
      await store.loadProviders()
      
      // Reload conversations from SQLite
      await store.loadConversations()
    }
    
    // Load on focus
    window.addEventListener('focus', handleFocus)
    
    // Also reload when window becomes visible (for mini window toggle)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleFocus()
      }
    })
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
  
  // Listen for custom event to open settings to a specific section
  useEffect(() => {
    const handleOpenSettings = (event: CustomEvent) => {
      const section = event.detail?.section
      if (section === 'providers') {
        setSettingsSection('models')
        setSettingsOpen(true)
        telemetryService.trackSettingsOpened('models')
      } else if (section === 'general' || section === 'models' || section === 'about') {
        setSettingsSection(section)
        setSettingsOpen(true)
        telemetryService.trackSettingsOpened(section)
      } else {
        setSettingsOpen(true)
        telemetryService.trackSettingsOpened('general')
      }
    }
    
    window.addEventListener('openSettings' as any, handleOpenSettings)
    return () => {
      window.removeEventListener('openSettings' as any, handleOpenSettings)
    }
  }, [])
  
  // Show onboarding if not completed
  useEffect(() => {
    if (!settingsLoading && !hasCompletedOnboarding && !isMiniWindow) {
      setOnboardingOpen(true)
    }
  }, [settingsLoading, hasCompletedOnboarding, isMiniWindow])

  // Listen for restart onboarding event
  useEffect(() => {
    const handleRestartOnboarding = () => {
      setOnboardingOpen(true)
    }
    
    window.addEventListener('restartOnboarding', handleRestartOnboarding)
    return () => {
      window.removeEventListener('restartOnboarding', handleRestartOnboarding)
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
    if (!settingsOpen) {
      telemetryService.trackSettingsOpened('general')
    }
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
    telemetryService.trackThemeChanged(newTheme)
  }

  // Add escape key handler for mini window
  useEffect(() => {
    if (isMiniWindow) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          window.close()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMiniWindow])
  
  // Initialize keyboard shortcuts (disabled in mini window for certain shortcuts)
  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onToggleSidebar: isMiniWindow ? () => {} : handleToggleSidebar,
    onToggleSettings: isMiniWindow ? () => {} : handleToggleSettings,
    onToggleShortcuts: isMiniWindow ? () => {} : handleToggleShortcuts,
    onSendFeedback: handleSendFeedback,
    onFocusInput: handleFocusInput,
    onCloseModal: handleCloseModal,
    onToggleTheme: handleToggleTheme,
    settingsOpen,
    shortcutsOpen
  })

  return (
    <div className={`flex h-screen bg-background text-foreground overflow-hidden ${isMiniWindow ? 'mini-window' : ''}`}>
      {!isMiniWindow && (
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
      )}
      
      <div className={`flex-1 min-w-0 flex ${!sidebarOpen ? '' : ''}`}>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">
          <ChatView 
            conversationId={selectedConversationId}
            onOpenSettings={isMiniWindow ? () => {} : () => setSettingsOpen(true)} 
            messageInputRef={messageInputRef}
            onSelectConversation={setSelectedConversation}
            isMiniWindow={isMiniWindow}
          />
        </div>
      </div>
      
      {!isMiniWindow && (
        <>
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            initialSection={settingsSection}
          />
          
          <ShortcutsModal
            isOpen={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
          />
          
          <OnboardingModal
            isOpen={onboardingOpen}
            onClose={() => setOnboardingOpen(false)}
          />
        </>
      )}

      <ToastContainer />
    </div>
  )
}

export default App
