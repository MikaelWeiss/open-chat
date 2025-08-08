import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react'
import { ArrowUp, Paperclip, Square, Zap, DollarSign, X, FileText, Image, Volume2, Settings } from 'lucide-react'
import clsx from 'clsx'
import { useSettings } from '../../hooks/useSettings'
import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'

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
      if (isLoading) {
        onCancel?.()
      } else {
        console.log('Sending message:', message, attachments)
        onSend(message, attachments.length > 0 ? attachments : undefined)
        setMessage('')
        setAttachments([])
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // ESC key cancels request if loading
      if (e.key === 'Escape' && isLoading) {
        e.preventDefault()
        onCancel?.()
        return
      }
      
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
      
      try {
        // Build file filters based on model capabilities - only include what the model actually supports
        const filters = []
        const supportedExtensions: string[] = []
        
        if (modelCapabilities?.vision) {
          const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']
          supportedExtensions.push(...imageExtensions)
          filters.push({
            name: 'Images',
            extensions: imageExtensions
          })
        }
        
        if (modelCapabilities?.audio) {
          const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']
          supportedExtensions.push(...audioExtensions)
          filters.push({
            name: 'Audio',
            extensions: audioExtensions
          })
        }
        
        if (modelCapabilities?.files) {
          const documentExtensions = ['txt', 'md', 'pdf', 'doc', 'docx', 'rtf', 'csv', 'json', 'xml', 'html']
          supportedExtensions.push(...documentExtensions)
          filters.push({
            name: 'Documents',
            extensions: documentExtensions
          })
        }
        
        // Only show "All supported files" if there are actually multiple types supported
        if (filters.length > 1) {
          filters.unshift({
            name: 'All Supported Files',
            extensions: supportedExtensions
          })
        }
        
        // If no capabilities are supported, don't show file dialog
        if (filters.length === 0) {
          console.log('No file capabilities available for this model')
          return
        }
        
        // Open file dialog
        const selected = await open({
          multiple: true,
          filters: filters
        })
        
        if (!selected) return
        
        // Handle both single file and multiple files
        const selectedFiles = Array.isArray(selected) ? selected : [selected]
        
        // Process each selected file
        const newAttachments: FileAttachment[] = []
        
        for (const filePath of selectedFiles) {
          try {
            // Read the file
            const fileBytes = await readFile(filePath)
            const fileName = filePath.split(/[/\\]/).pop() || 'unknown'
            const fileExtension = fileName.split('.').pop()?.toLowerCase() || ''
            
            // Determine file type and validate against model capabilities
            let fileType: 'image' | 'audio' | 'file' = 'file'
            let mimeType = 'application/octet-stream'
            
            // Image types - only allow if model supports vision
            if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(fileExtension)) {
              if (!modelCapabilities?.vision) {
                console.error('Model does not support vision - skipping image:', fileName)
                continue
              }
              fileType = 'image'
              mimeType = fileExtension === 'jpg' ? 'image/jpeg' : `image/${fileExtension}`
            }
            // SVG is special case for images
            else if (fileExtension === 'svg') {
              if (!modelCapabilities?.vision) {
                console.error('Model does not support vision - skipping SVG image:', fileName)
                continue
              }
              fileType = 'image'
              mimeType = 'image/svg+xml'
            }
            // Audio types - only allow if model supports audio
            else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(fileExtension)) {
              if (!modelCapabilities?.audio) {
                console.error('Model does not support audio - skipping audio file:', fileName)
                continue
              }
              fileType = 'audio'
              mimeType = fileExtension === 'mp3' ? 'audio/mpeg' : `audio/${fileExtension}`
            }
            // Document types - only allow if model supports files
            else if (['txt', 'md', 'pdf', 'doc', 'docx', 'rtf', 'csv', 'json', 'xml', 'html'].includes(fileExtension)) {
              if (!modelCapabilities?.files) {
                console.error('Model does not support files - skipping document:', fileName)
                continue
              }
              // Set specific mime types for documents
              if (fileExtension === 'txt') {
                mimeType = 'text/plain'
              } else if (fileExtension === 'md') {
                mimeType = 'text/markdown'
              } else if (fileExtension === 'pdf') {
                mimeType = 'application/pdf'
              } else if (fileExtension === 'json') {
                mimeType = 'application/json'
              } else if (fileExtension === 'xml') {
                mimeType = 'application/xml'
              } else if (fileExtension === 'html') {
                mimeType = 'text/html'
              } else if (fileExtension === 'csv') {
                mimeType = 'text/csv'
              } else {
                mimeType = 'application/octet-stream'
              }
            }
            else {
              console.error('Unsupported file type:', fileExtension, '- skipping file:', fileName)
              continue
            }
            
            // Check file size limits
            const fileSizeLimit = 20 * 1024 * 1024 // 20MB limit for attachments
            if (fileBytes.length > fileSizeLimit) {
              console.error(`File too large: ${fileName} (${(fileBytes.length / 1024 / 1024).toFixed(1)}MB). Maximum size is 20MB.`)
              continue
            }

            // Convert to base64 (handle large files by processing in chunks)
            let binaryString = ''
            const chunkSize = 8192 // Process in 8KB chunks
            for (let i = 0; i < fileBytes.length; i += chunkSize) {
              const chunk = fileBytes.slice(i, i + chunkSize)
              binaryString += String.fromCharCode(...chunk)
            }
            const base64 = btoa(binaryString)
            
            // Create attachment object
            const attachment: FileAttachment = {
              path: filePath,
              base64,
              mimeType,
              name: fileName,
              type: fileType
            }
            
            newAttachments.push(attachment)
          } catch (error) {
            console.error('Failed to process file:', filePath, error)
          }
        }
        
        // Add all new attachments
        if (newAttachments.length > 0) {
          setAttachments([...attachments, ...newAttachments])
        }
        
      } catch (error) {
        console.error('Failed to attach file:', error)
      }
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
      <div className="border-t border-border/10 p-4 w-full glass-nav backdrop-blur-strong">
        {/* File attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => {
              const Icon = getAttachmentIcon(attachment.type)
              return (
                <div
                  key={`${attachment.name}-${attachment.path}-${index}`}
                  className="flex items-center gap-2 glass-effect border border-border/20 rounded-xl px-3 py-2 text-sm shadow-elegant"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="truncate max-w-32 text-foreground/90" title={attachment.name}>
                    {attachment.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="p-0.5 elegant-hover rounded-lg text-muted-foreground hover:text-destructive transition-all"
                    title="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Horizontal input container with all controls in one row */}
        <div className="flex items-center gap-2">
          {/* Left side buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Single attachment button with capability-based file filtering - only show if model has any attachment capabilities */}
            {(modelCapabilities?.vision || modelCapabilities?.audio || modelCapabilities?.files) && (
              <button
                onClick={handleAttachFile}
                className={clsx(
                  'p-2 rounded-xl transition-all duration-200 hover:scale-105',
                  disabled 
                    ? 'text-muted-foreground cursor-not-allowed' 
                    : 'elegant-hover text-muted-foreground hover:text-primary'
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
                  'p-2 rounded-xl transition-all duration-200 hover:scale-105',
                  disabled 
                    ? 'text-muted-foreground cursor-not-allowed' 
                    : 'elegant-hover text-muted-foreground hover:text-primary'
                )}
                title="Conversation settings"
                disabled={disabled}
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Textarea container */}
          <div className="flex-1 elegant-input-container">
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
                    : "Message Open Chat..."
              }
              className={clsx(
                'w-full resize-none bg-transparent px-4 py-2.5 min-h-[48px] max-h-[200px] focus:outline-none text-foreground',
                'elegant-scrollbar font-medium placeholder:text-muted-foreground flex items-center',
                disabled && 'text-muted-foreground cursor-not-allowed'
              )}
              rows={1}
              disabled={disabled}
            />
          </div>
          
          {/* Right side buttons and stats */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Token and cost stats - show inline if there's space */}
            {(totalTokens > 0 || (totalCost > 0 && appSettings?.showPricing)) && (
              <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground/80">
                {totalTokens > 0 && (
                  <div className="flex items-center gap-1.5 text-primary/80">
                    <Zap className="h-3 w-3" />
                    <span className="font-medium">{totalTokens.toLocaleString()}</span>
                  </div>
                )}
                {totalCost > 0 && appSettings?.showPricing && (
                  <div className="flex items-center gap-1.5 text-primary/80">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium">${totalCost.toFixed(4)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Send button */}
            <button
              onClick={handleCancelOrSend}
              disabled={disabled || (!isLoading && (!message.trim() && attachments.length === 0))}
              className={clsx(
                'w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center bg-primary hover:bg-primary/90',
                disabled || (!isLoading && (!message.trim() && attachments.length === 0))
                  ? 'opacity-40 cursor-not-allowed'
                  : isLoading
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                    : 'text-white'
              )}
              title={
                isLoading 
                  ? "Stop generation (Esc)" 
                  : "Send message"
              }
            >
              {isLoading ? (
                <Square className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* Footer info - keyboard shortcut and mobile stats */}
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground/80">
          <span className="truncate font-medium">
            {appSettings?.sendMessage === 'cmd-enter' 
              ? `Press ${getModifierKeyLabel()}+Enter to send, Enter for new line`
              : 'Press Enter to send, Shift+Enter for new line'
            }
          </span>
          {/* Show stats on mobile/smaller screens */}
          {(totalTokens > 0 || (totalCost > 0 && appSettings?.showPricing)) && (
            <div className="flex lg:hidden items-center gap-4 flex-shrink-0">
              {totalTokens > 0 && (
                <div className="flex items-center gap-1.5 text-primary/80">
                  <Zap className="h-3 w-3" />
                  <span className="font-medium">{totalTokens.toLocaleString()}</span>
                  {totalInputTokens > 0 && totalOutputTokens > 0 && (
                    <span className="text-muted-foreground/60 text-[10px]">
                      ({totalInputTokens.toLocaleString()} in, {totalOutputTokens.toLocaleString()} out)
                    </span>
                  )}
                </div>
              )}
              {totalCost > 0 && appSettings?.showPricing && (
                <div className="flex items-center gap-1.5 text-primary/80">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium">${totalCost.toFixed(4)}</span>
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