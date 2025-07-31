import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send, Paperclip } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput, { MessageInputHandle } from './MessageInput'
import type { Conversation } from '@/types/electron'
import { useConversationStore } from '@/stores/conversationStore'
import clsx from 'clsx'

interface ChatViewProps {
  conversation: Conversation | null
  sidebarOpen: boolean
}

export interface ChatViewHandle {
  focusInput: () => void
}

const ChatView = forwardRef<ChatViewHandle, ChatViewProps>(
  ({ conversation, sidebarOpen }, ref) => {
  const [message, setMessage] = useState('')
  const { addMessage } = useConversationStore()
  const messageInputRef = useRef<MessageInputHandle>(null)

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      messageInputRef.current?.focus()
    }
  }))

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 100)
    }
  }, [conversation?.id])

  const handleSend = async () => {
    if (message.trim() && conversation) {
      await addMessage(conversation.id, {
        role: 'user',
        content: message.trim()
      })
      setMessage('')
      
      // TODO: Send to LLM and get response
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Welcome to Open Chat</h2>
          <p className="text-muted-foreground">
            Select a conversation from the sidebar or start a new one
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 drag-region">
        <h2 className="text-lg font-semibold no-drag">{conversation.title}</h2>
        <p className="text-sm text-muted-foreground no-drag">
          {conversation.provider} • {conversation.model}
        </p>
      </div>

      {/* Messages */}
      <MessageList messages={conversation.messages} />

      {/* Input */}
      <MessageInput
        ref={messageInputRef}
        value={message}
        onChange={setMessage}
        onSend={handleSend}
      />
    </div>
  )
})

ChatView.displayName = 'ChatView'

export default ChatView