import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatView from './components/Chat/ChatView'
import SettingsModal from './components/Settings/SettingsModal'
import { useConversationStore } from './stores/conversationStore'
import { useSettingsStore } from './stores/settingsStore'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  const { 
    conversations, 
    selectedConversation, 
    loadConversations, 
    selectConversation,
    createConversation
  } = useConversationStore()
  
  const { loadSettings } = useSettingsStore()

  useEffect(() => {
    // Load initial data
    loadConversations()
    loadSettings()
  }, [loadConversations, loadSettings])

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
        conversation={selectedConversation}
        sidebarOpen={sidebarOpen}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

export default App