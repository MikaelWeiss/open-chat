import { ChevronDown, Copy } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput, { MessageInputHandle } from './MessageInput'
import { useRef, RefObject } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface ChatViewProps {
  onOpenSettings?: () => void
  messageInputRef?: RefObject<MessageInputHandle>
}

export default function ChatView({ messageInputRef: externalMessageInputRef }: ChatViewProps) {
  const internalMessageInputRef = useRef<MessageInputHandle>(null)
  const messageInputRef = externalMessageInputRef || internalMessageInputRef
  
  const handleSend = (message: string, attachments?: any[]) => {
    console.log('Send message:', message, attachments)
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
            <h2 className="text-lg font-semibold truncate">Help with React Components</h2>
            <p className="text-sm text-muted-foreground truncate">
              Anthropic • claude-3-sonnet
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
                <span>claude-3-sonnet</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-background/80">
        {/* Messages - this should be the scrollable area */}
      <div className="flex-1 min-h-0">
        <MessageList />
      </div>

      {/* Input - fixed at bottom */}
      <div className="flex-shrink-0">
        <MessageInput
          ref={messageInputRef}
          onSend={handleSend}
          onCancel={() => {
            // Additional cancel logic if needed
          }}
          disabled={false}
          isLoading={false}
          noProvider={false}
          messages={[]} // Mock empty messages array
          modelCapabilities={{
            vision: true,
            audio: true,
            files: true
          }}
          onOpenConversationSettings={() => console.log('Open conversation settings')}
          onAttachmentsChange={() => {}}
        />
      </div>
      </div>
    </div>
  )
}