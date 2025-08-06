import { ChevronDown, Copy } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput, { MessageInputHandle } from './MessageInput'
import { useRef, RefObject, useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useMessages } from '../../hooks/useMessages'
import { useConversations } from '../../hooks/useConversations'
import { type Conversation } from '../../shared/conversationStore'

interface ChatViewProps {
  conversationId?: number | null
  onOpenSettings?: () => void
  messageInputRef?: RefObject<MessageInputHandle>
}

export default function ChatView({ conversationId, messageInputRef: externalMessageInputRef }: ChatViewProps) {
  const internalMessageInputRef = useRef<MessageInputHandle>(null)
  const messageInputRef = externalMessageInputRef || internalMessageInputRef
  const [isLoading, setIsLoading] = useState(false)
  
  const { messages, addMessage } = useMessages(conversationId ?? null)
  const { getConversation } = useConversations()
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  
  // Load current conversation details
  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        try {
          const conv = await getConversation(conversationId)
          setCurrentConversation(conv)
        } catch (err) {
          console.error('Failed to load conversation:', err)
        }
      } else {
        setCurrentConversation(null)
      }
    }
    loadConversation()
  }, [conversationId, getConversation])
  
  const handleSend = async (message: string) => {
    if (!conversationId || !message.trim()) return
    
    try {
      setIsLoading(true)
      
      // Add user message
      await addMessage({
        role: 'user',
        text: message,
        // TODO: Handle attachments properly
      })
      
      // TODO: Send to AI provider and add assistant response
      
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartDrag = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const window = getCurrentWindow()
      await window.startDragging()
    } catch (error) {
      console.error('Failed to start dragging:', error)
    }
  }

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Window title bar - draggable area */}
      <div 
        className="h-6 flex-shrink-0 rounded-t-lg select-none" 
        onMouseDown={handleStartDrag}
      />
      
      {/* Header - now properly below the title bar */}
      <div className="border-b border-border px-4 py-3 min-w-0 backdrop-blur-sm bg-background/80 flex-shrink-0 rounded-t-lg">
        <div className="flex items-center justify-between min-w-0 gap-4">
          <div 
            className="min-w-0 flex-1 select-none" 
            onMouseDown={handleStartDrag}
          >
            <h2 className="text-lg font-semibold truncate">
              {currentConversation?.title || 'New Conversation'}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {currentConversation?.provider || 'No Provider'} • {currentConversation?.model || 'No Model'}
            </p>
          </div>
          
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Copy conversation button */}
            <button
              onClick={() => console.log('Copy conversation')}
              className="p-2 bg-secondary hover:bg-accent rounded-lg transition-all duration-200 hover:scale-105 shadow-sm border border-border hover:border-primary/30"
              title="Copy conversation"
            >
              <Copy className="h-4 w-4" />
            </button>
            
            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => console.log('Show model selector')}
                className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-accent rounded-lg transition-all duration-200 hover:scale-105 text-sm shadow-sm border border-border hover:border-primary/30"
              >
                <span>{currentConversation?.model || 'No Model'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-background/80">
        {/* Messages - this should be the scrollable area */}
      <div className="flex-1 min-h-0">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
        />
      </div>

      {/* Input - fixed at bottom */}
      <div className="flex-shrink-0">
        <MessageInput
          ref={messageInputRef}
          onSend={handleSend}
          onCancel={() => {
            // Additional cancel logic if needed
          }}
          disabled={!conversationId || isLoading}
          isLoading={isLoading}
          noProvider={!currentConversation?.provider}
          messages={messages}
          modelCapabilities={{
            vision: true, // TODO: Get from provider config
            audio: true,  // TODO: Get from provider config
            files: true   // TODO: Get from provider config
          }}
          onOpenConversationSettings={() => console.log('Open conversation settings')}
          onAttachmentsChange={() => {}}
        />
      </div>
      </div>
    </div>
  )
}