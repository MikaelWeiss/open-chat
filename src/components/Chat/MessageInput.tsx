import { useRef, useEffect } from 'react'
import { Send, Paperclip } from 'lucide-react'
import clsx from 'clsx'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
}

export default function MessageInput({ value, onChange, onSend }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
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
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}