import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react'
import { Send, Paperclip, Loader2, Square, Zap, DollarSign, X, FileText, Image, Volume2 } from 'lucide-react'
import clsx from 'clsx'
import { useSettingsStore } from '@/stores/settingsStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useUsageStats, useFileAttachments, useKeyboardShortcuts, usePlatformInfo } from '@/hooks'
import type { Message, ModelCapabilities } from '@/types/electron'

interface MessageInputProps {
  onSend: (message: string, attachments?: Array<{path: string, base64: string, mimeType: string, name: string, type: 'image' | 'audio' | 'file'}>) => void
  onCancel?: () => void
  disabled?: boolean
  isLoading?: boolean
  messages?: Message[]
  modelCapabilities?: ModelCapabilities
}

export interface MessageInputHandle {
  focus: () => void
  getQuickChatState?: () => { draftText: string; attachments: any[] }
  restoreQuickChatState?: (state: { draftText: string; attachments: any[] }) => void
}

const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  ({ onSend, onCancel, disabled = false, isLoading = false, messages = [], modelCapabilities }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { settings } = useSettingsStore()
    const { isStreaming } = useConversationStore()
    const [message, setMessage] = useState('')
    
    // Use custom hooks
    const { attachments, addAttachment, removeAttachment, clearAttachments, setAttachments } = useFileAttachments()
    const { handleKeyDown } = useKeyboardShortcuts()
    const { getModifierKeyLabel } = usePlatformInfo()

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus()
      },
      getQuickChatState: () => ({
        draftText: message,
        attachments: attachments
      }),
      restoreQuickChatState: (state) => {
        setMessage(state.draftText || '')
        setAttachments(state.attachments || [])
      }
    }))

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  const handleCancelOrSend = () => {
    if (isStreaming) {
      onCancel?.()
    } else {
      onSend(message, attachments.length > 0 ? attachments : undefined)
      setMessage('')
      clearAttachments()
    }
  }

  const handleKeyDownWrapper = (e: React.KeyboardEvent) => {
    handleKeyDown(e, {
      onSend: handleCancelOrSend,
      onCancel,
      disabled,
      isLoading
    })
  }

  const handleAttachFile = async () => {
    if (disabled) return
    await addAttachment(modelCapabilities)
  }

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image
      case 'audio':
        return Volume2
      default:
        return FileText
    }
  }

  const { totalTokens, totalPromptTokens, totalCompletionTokens, totalCost } = useUsageStats(messages)

  return (
    <div className="border-t border-border p-4 min-w-0">
      {/* File attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => {
            const Icon = getAttachmentIcon(attachment.type)
            return (
              <div
                key={index}
                className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 text-sm border border-border"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-32" title={attachment.name}>
                  {attachment.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                  title="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
      
      <div className="flex items-end gap-2 min-w-0">
        {/* Single attachment button with capability-based file filtering - only show if model has any attachment capabilities */}
        {(modelCapabilities?.vision || modelCapabilities?.audio || modelCapabilities?.files) && (
          <button
            onClick={handleAttachFile}
            className={clsx(
              'p-2 rounded-lg transition-all duration-200 hover:scale-105',
              disabled 
                ? 'text-muted-foreground cursor-not-allowed' 
                : 'hover:bg-accent'
            )}
            title="Attach file"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </button>
        )}
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => !disabled && !isLoading && setMessage(e.target.value)}
          onKeyDown={handleKeyDownWrapper}
          placeholder={
            disabled 
              ? "Add an AI provider to start chatting..." 
              : isLoading 
                ? "Waiting for response..." 
                : "Type a message..."
          }
          className={clsx(
            'flex-1 resize-none rounded-lg px-4 py-2 min-h-[40px] max-h-[200px] focus:outline-none transition-all duration-200 border',
            'scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground scrollbar-track-transparent',
            disabled || isLoading
              ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed border-border/50'
              : 'bg-secondary focus:ring-2 focus:ring-primary border-border hover:border-primary/30 focus:border-primary/50 shadow-sm'
          )}
          rows={1}
          disabled={disabled || isLoading}
        />
        
        <button
          onClick={handleCancelOrSend}
          disabled={disabled || (!isStreaming && (!message.trim() && attachments.length === 0) || isLoading)}
          className={clsx(
            'p-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm',
            disabled || (!isStreaming && (!message.trim() && attachments.length === 0) || isLoading)
              ? 'bg-secondary text-muted-foreground cursor-not-allowed'
              : isStreaming
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md'
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
      
      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">
          {settings?.keyboard?.sendMessage === 'cmd-enter' 
            ? `Press ${getModifierKeyLabel()}+Enter to send, Enter for new line`
            : 'Press Enter to send, Shift+Enter for new line'
          }
        </span>
        {(totalTokens > 0 || (totalCost > 0 && settings?.showPricing)) && (
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
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