import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react'
import { Send, Paperclip, Loader2, Square, Zap, DollarSign, X, FileText, Image, Volume2, Settings } from 'lucide-react'
import clsx from 'clsx'
import { useSettings } from '../../hooks/useSettings'

interface FileAttachment {
  path: string
  base64: string
  mimeType: string
  name: string
  type: 'image' | 'audio' | 'file'
}

interface MessageInputProps {
  onSend: (message: string, attachments?: Array<{path: string, base64: string, mimeType: string, name: string, type: 'image' | 'audio' | 'file'}>) => void
  onCancel?: () => void
  disabled?: boolean
  isLoading?: boolean
  messages?: any[]
  modelCapabilities?: {
    vision?: boolean
    audio?: boolean
    files?: boolean
  }
  noProvider?: boolean
  onOpenConversationSettings?: () => void
  onAttachmentsChange?: (capabilities: { vision: boolean; audio: boolean; files: boolean }) => void
}

export interface MessageInputHandle {
  focus: () => void
  getQuickChatState?: () => { draftText: string; attachments: any[] }
  restoreQuickChatState?: (state: { draftText: string; attachments: any[] }) => void
}

const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  ({ onSend, onCancel, disabled = false, isLoading = false, messages = [], modelCapabilities, noProvider = false, onOpenConversationSettings, onAttachmentsChange }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [message, setMessage] = useState('')
    const [attachments, setAttachments] = useState<FileAttachment[]>([])
    const [isStreaming, setIsStreaming] = useState(false)
    
    const { settings: appSettings } = useSettings()

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

    // Function to calculate required capabilities based on current attachments
    const calculateRequiredCapabilities = (currentAttachments: FileAttachment[]) => {
      const capabilities = { vision: false, audio: false, files: false }
      
      currentAttachments.forEach(attachment => {
        switch (attachment.type) {
          case 'image':
            capabilities.vision = true
            break
          case 'audio':
            capabilities.audio = true
            break
          case 'file':
            capabilities.files = true
            break
        }
      })
      
      return capabilities
    }

    // Notify parent when attachments change
    useEffect(() => {
      if (onAttachmentsChange) {
        const requiredCapabilities = calculateRequiredCapabilities(attachments)
        onAttachmentsChange(requiredCapabilities)
      }
    }, [attachments, onAttachmentsChange])

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
      }
    }, [message])

    const handlePaste = async (e: React.ClipboardEvent) => {
      if (disabled || isLoading) return
      
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        
        // Check if the item is an image
        if (item.type.startsWith('image/')) {
          // Only allow image pasting if the model supports vision
          if (!modelCapabilities?.vision) {
            console.log('Image paste blocked: model does not support vision')
            return
          }
          
          e.preventDefault()
          
          const file = item.getAsFile()
          if (!file) continue

          try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string
                // Remove the data URL prefix to get just the base64 data
                const base64Data = result.split(',')[1]
                resolve(base64Data)
              }
              reader.onerror = reject
              reader.readAsDataURL(file)
            })

            // Create attachment object
            const attachment: FileAttachment = {
              path: '', // No file path for pasted images
              base64,
              mimeType: file.type,
              name: `pasted-image-${Date.now()}.${file.type.split('/')[1]}`,
              type: 'image'
            }

            setAttachments([...attachments, attachment])
          } catch (error) {
            console.error('Failed to process pasted image:', error)
          }
          
          break // Only process the first image found
        }
      }
    }

    const handleCancelOrSend = () => {
      if (isStreaming) {
        onCancel?.()
        setIsStreaming(false)
      } else {
        console.log('Sending message:', message, attachments)
        onSend(message, attachments.length > 0 ? attachments : undefined)
        setMessage('')
        setAttachments([])
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (appSettings?.sendMessage === 'cmd-enter') {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          if (!disabled && !isLoading && (message.trim() || attachments.length > 0)) {
            handleCancelOrSend()
          }
        }
      } else {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          if (!disabled && !isLoading && (message.trim() || attachments.length > 0)) {
            handleCancelOrSend()
          }
        }
      }
    }

    const handleAttachFile = async () => {
      if (disabled) return
      console.log('Attach file clicked')
      // TODO: Implement file attachment
    }

    const removeAttachment = (index: number) => {
      setAttachments(attachments.filter((_, i) => i !== index))
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

    const getModifierKeyLabel = () => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      return isMac ? '⌘' : 'Ctrl'
    }

    // Calculate real usage stats from messages
    const totalInputTokens = messages?.reduce((sum, msg) => sum + (msg.input_tokens || 0), 0) || 0
    const totalOutputTokens = messages?.reduce((sum, msg) => sum + (msg.output_tokens || 0), 0) || 0
    const totalReasoningTokens = messages?.reduce((sum, msg) => sum + (msg.reasoning_tokens || 0), 0) || 0
    const totalTokens = totalInputTokens + totalOutputTokens + totalReasoningTokens
    const totalCost = messages?.reduce((sum, msg) => sum + (msg.cost || 0), 0) || 0

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
        
        {/* Input container with integrated buttons */}
        <div className={clsx(
          'flex items-end rounded-lg border transition-all duration-200 shadow-sm',
          disabled
            ? 'bg-secondary/50 border-border/50'
            : 'bg-secondary border-border hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary'
        )}>
          {/* Left side buttons */}
          <div className="flex items-center pl-3 pr-2 py-2">
            {/* Single attachment button with capability-based file filtering - only show if model has any attachment capabilities */}
            {(modelCapabilities?.vision || modelCapabilities?.audio || modelCapabilities?.files) && (
              <button
                onClick={handleAttachFile}
                className={clsx(
                  'p-1.5 rounded-md transition-all duration-200 hover:scale-105',
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
            
            {/* Conversation settings button - only show if enabled in settings */}
            {appSettings?.showConversationSettings && (
              <button
                onClick={onOpenConversationSettings}
                className={clsx(
                  'p-1.5 rounded-md transition-all duration-200 hover:scale-105',
                  disabled 
                    ? 'text-muted-foreground cursor-not-allowed' 
                    : 'hover:bg-accent'
                )}
                title="Conversation settings"
                disabled={disabled}
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => !disabled && !isLoading && setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              noProvider
                ? "Add an AI provider or select a model to start chatting..." 
                : isLoading 
                  ? "Waiting for response..." 
                  : "Type a message..."
            }
            className={clsx(
              'flex-1 resize-none bg-transparent px-3 py-2 min-h-[40px] max-h-[200px] focus:outline-none',
              'scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground scrollbar-track-transparent',
              disabled && 'text-muted-foreground cursor-not-allowed'
            )}
            rows={1}
            disabled={disabled}
          />
          
          {/* Right side send button */}
          <div className="flex items-center pl-2 pr-3 py-2">
            <button
              onClick={handleCancelOrSend}
              disabled={disabled || (!isStreaming && (!message.trim() && attachments.length === 0)) || isLoading}
              className={clsx(
                'p-1.5 rounded-md transition-all duration-200 hover:scale-105',
                disabled || (!isStreaming && (!message.trim() && attachments.length === 0)) || isLoading
                  ? 'text-muted-foreground cursor-not-allowed'
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isStreaming ? (
                <Square className="h-3.5 w-3.5" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">
            {appSettings?.sendMessage === 'cmd-enter' 
              ? `Press ${getModifierKeyLabel()}+Enter to send, Enter for new line`
              : 'Press Enter to send, Shift+Enter for new line'
            }
          </span>
          {(totalTokens > 0 || (totalCost > 0 && appSettings?.showPricing)) && (
            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              {totalTokens > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{totalTokens.toLocaleString()}</span>
                  {totalInputTokens > 0 && totalOutputTokens > 0 && (
                    <span className="text-muted-foreground/70">
                      ({totalInputTokens.toLocaleString()} in, {totalOutputTokens.toLocaleString()} out)
                    </span>
                  )}
                </div>
              )}
              {totalCost > 0 && appSettings?.showPricing && (
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