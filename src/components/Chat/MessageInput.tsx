import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send, Paperclip } from 'lucide-react'
import clsx from 'clsx'
import { useSettingsStore } from '@/stores/settingsStore'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
}

export interface MessageInputHandle {
  focus: () => void
}

const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  ({ value, onChange, onSend }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { settings } = useSettingsStore()

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus()
      }
    }))

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const sendKey = settings?.keyboard?.sendMessage || 'enter'
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey

    if (sendKey === 'enter') {
      // Enter sends, Shift+Enter for new line
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onSend()
      }
    } else if (sendKey === 'cmd-enter') {
      // Cmd/Ctrl+Enter sends, Enter for new line
      if (e.key === 'Enter' && isCtrlOrCmd) {
        e.preventDefault()
        onSend()
      }
    }
  }

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <button
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 resize-none bg-secondary rounded-lg px-4 py-2 min-h-[40px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary"
          rows={1}
        />
        
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            value.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          )}
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        {settings?.keyboard?.sendMessage === 'cmd-enter' 
          ? `Press ${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'}+Enter to send, Enter for new line`
          : 'Press Enter to send, Shift+Enter for new line'
        }
      </p>
    </div>
  )
})

MessageInput.displayName = 'MessageInput'

export default MessageInput