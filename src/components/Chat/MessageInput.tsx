import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send, Paperclip, Loader2, Square, Zap, DollarSign } from 'lucide-react'
import clsx from 'clsx'
import { useSettingsStore } from '@/stores/settingsStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useUsageStats } from '@/hooks/useUsageStats'
import type { Message } from '@/types/electron'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onCancel?: () => void
  disabled?: boolean
  isLoading?: boolean
  messages?: Message[]
}

export interface MessageInputHandle {
  focus: () => void
}

const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  ({ value, onChange, onSend, onCancel, disabled = false, isLoading = false, messages = [] }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { settings } = useSettingsStore()
    const { isStreaming, cancelStream } = useConversationStore()

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
    // Handle escape key for canceling streams
    if (e.key === 'Escape' && isStreaming) {
      e.preventDefault()
      handleCancelOrSend()
      return
    }
    
    if (disabled || isLoading) return
    
    const sendKey = settings?.keyboard?.sendMessage || 'enter'
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey

    if (sendKey === 'enter') {
      // Enter sends, Shift+Enter for new line
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleCancelOrSend()
      }
    } else if (sendKey === 'cmd-enter') {
      // Cmd/Ctrl+Enter sends, Enter for new line
      if (e.key === 'Enter' && isCtrlOrCmd) {
        e.preventDefault()
        handleCancelOrSend()
      }
    }
  }

  const handleCancelOrSend = () => {
    if (isStreaming) {
      cancelStream()
      onCancel?.()
    } else {
      onSend()
    }
  }

  const { totalTokens, totalPromptTokens, totalCompletionTokens, totalCost } = useUsageStats(messages)

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <button
          className={clsx(
            'p-2 rounded-lg transition-colors',
            disabled 
              ? 'text-muted-foreground cursor-not-allowed' 
              : 'hover:bg-accent'
          )}
          title="Attach file"
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </button>
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => !disabled && !isLoading && onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled 
              ? "Add an AI provider to start chatting..." 
              : isLoading 
                ? "Waiting for response..." 
                : "Type a message..."
          }
          className={clsx(
            'flex-1 resize-none rounded-lg px-4 py-2 min-h-[40px] max-h-[200px] focus:outline-none',
            disabled || isLoading
              ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
              : 'bg-secondary focus:ring-2 focus:ring-primary'
          )}
          rows={1}
          disabled={disabled || isLoading}
        />
        
        <button
          onClick={handleCancelOrSend}
          disabled={disabled || (!isStreaming && (!value.trim() || isLoading))}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            disabled || (!isStreaming && (!value.trim() || isLoading))
              ? 'bg-secondary text-muted-foreground cursor-not-allowed'
              : isStreaming
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          title={
            isStreaming 
              ? "Stop generation (Esc)" 
              : isLoading 
                ? "Generating response..." 
                : "Send message"
          }
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isStreaming ? (
            <Square className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {settings?.keyboard?.sendMessage === 'cmd-enter' 
            ? `Press ${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'}+Enter to send, Enter for new line`
            : 'Press Enter to send, Shift+Enter for new line'
          }
        </span>
        {(totalTokens > 0 || (totalCost > 0 && settings?.showPricing)) && (
          <div className="flex items-center gap-3">
            {totalTokens > 0 && (
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>{totalTokens.toLocaleString()}</span>
                {totalPromptTokens > 0 && totalCompletionTokens > 0 && (
                  <span className="text-muted-foreground/70">
                    ({totalPromptTokens.toLocaleString()} in, {totalCompletionTokens.toLocaleString()} out)
                  </span>
                )}
              </div>
            )}
            {totalCost > 0 && settings?.showPricing && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>${totalCost.toFixed(4)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

MessageInput.displayName = 'MessageInput'

export default MessageInput