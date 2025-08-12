import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, FileText, Image, Volume2 } from 'lucide-react'
import clsx from 'clsx'
import React, { useState, useEffect } from 'react'
import { type Message } from '../../shared/messageStore'
import { useSettings } from '../../hooks/useSettings'
import Lottie from 'lottie-react'
import spinnerAnimation from '../../assets/spinner.json'
import EmptyState from '../EmptyState/EmptyState'

interface MessageListProps {
  messages?: Message[]
  isLoading?: boolean
  streamingMessage?: string
  streamingMessagesByModel?: Map<string, string>
}

interface CodeBlockProps {
  children: string
  className?: string
  isDark: boolean
}

function CodeBlock({ children, className, isDark }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-xl glass-effect border border-border/20 opacity-0 group-hover:opacity-100 transition-all duration-200 elegant-hover text-muted-foreground hover:text-primary"
        title="Copy code"
      >
        {copied ? (
          <Check className="h-3 w-3 text-primary" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={language}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          border: '1px solid hsl(var(--border))',
          overflowX: 'hidden',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

function AttachmentDisplay({ attachments }: { attachments: { type: string; path: string; mimeType: string }[] | null }) {
  if (!attachments || attachments.length === 0) return null

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

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {attachments.map((attachment, index) => {
        const Icon = getAttachmentIcon(attachment.type)
        const fileName = attachment.path.split('/').pop() || 'Unknown file'
        
        return (
          <div
            key={index}
            className="flex items-center gap-2 glass-effect border border-border/20 rounded-xl px-3 py-2 text-sm shadow-elegant"
          >
            <Icon className="h-4 w-4 text-primary" />
            <span className="truncate max-w-32 text-foreground/90" title={fileName}>
              {fileName}
            </span>
          </div>
        )
      })}
    </div>
  )
}


export default function MessageList({ messages = [], isLoading = false, streamingMessage = '', streamingMessagesByModel }: MessageListProps) {
  const [loadingMessage, setLoadingMessage] = useState('Assembling')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const { userName } = useSettings()
  
  // Group messages by their relationships for side-by-side display
  const groupedMessages = React.useMemo(() => {
    const groups: Array<{ type: 'single' | 'parallel', messages: Message[], timestamp: string }> = []
    const processedIds = new Set<number>()
    
    for (const message of messages) {
      if (processedIds.has(message.id)) continue
      
      // Check if this message has siblings (same previous_message_id)
      const siblings = messages.filter(m => 
        m.previous_message_id === message.previous_message_id &&
        m.previous_message_id !== null &&
        m.role === 'assistant' // Only group assistant responses
      )
      
      if (siblings.length > 1) {
        // This is a parallel response group - sort by created_at to ensure consistent order
        const sortedSiblings = siblings.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        groups.push({
          type: 'parallel',
          messages: sortedSiblings,
          timestamp: sortedSiblings[0].created_at
        })
        siblings.forEach(sibling => processedIds.add(sibling.id))
      } else {
        // This is a single message
        groups.push({
          type: 'single',
          messages: [message],
          timestamp: message.created_at
        })
        processedIds.add(message.id)
      }
    }
    
    // Sort groups by timestamp to maintain chronological order
    return groups.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [messages])
  
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }
  
  // Detect if we're in dark mode
  const isDark = document.documentElement.classList.contains('dark')
  
  useEffect(() => {
    if (!isLoading) return

    const verbs = [
      'Architecting', 'Assembling', 'Brewing', 'Calculating', 'Calibrating', 'Cerebrating', 'Channeling', 'Coalescing', 'Composing', 'Conceptualizing', 'Conjuring', 'Contemplating', 'Crafting', 'Crystallizing', 'Cultivating', 'Curating', 'Deciphering', 'Deliberating', 'Discovering', 'Distilling', 'Emanating', 'Envisioning', 'Exploring', 'Extrapolating', 'Forging', 'Forming', 'Germinating', 'Harmonizing', 'Herding', 'Imagining', 'Incubating', 'Inferring', 'Innovating', 'Manifesting', 'Materializing', 'Musing', 'Orchestrating', 'Parsing', 'Percolating', 'Philosophizing', 'Pioneering', 'Pondering', 'Puttering', 'Rationalizing', 'Refining', 'Sculpting', 'Stewing', 'Strategizing', 'Sussing', 'Synthesizing', 'Theorizing', 'Untangling', 'Unveiling', 'Weaving', 'Working'
    ]

    const pickRandom = () => {
      const next = verbs[Math.floor(Math.random() * verbs.length)]
      setLoadingMessage(next)
    }

    // Pick immediately, then at interval
    pickRandom()
    const interval = setInterval(pickRandom, 2500)
    return () => clearInterval(interval)
  }, [isLoading])
  
  const markdownComponents = {
    code: ({ inline, className, children }: any) => {
      // Force inline rendering for short code snippets without newlines
      const codeText = String(children)
      const isActuallyInline = inline || (!className && !codeText.includes('\n') && codeText.length < 100)
      
      if (isActuallyInline) {
        return (
          <code className="glass-effect border border-border/20 px-2 py-1 rounded-lg text-sm shadow-elegant font-mono text-primary/90">
            {children}
          </code>
        )
      }
      
      return (
        <CodeBlock className={className} isDark={isDark}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      )
    },
    // Enhanced styling for other markdown elements
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold mb-4 pb-2 border-b border-border">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-bold mb-3 pb-1 border-b border-border">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-semibold mb-2">{children}</h3>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-secondary/50 rounded-r">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="my-4 overflow-hidden">
        <table className="w-full border border-border rounded-lg table-auto">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="border border-border px-3 py-2 bg-secondary font-semibold text-left break-words">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border border-border px-3 py-2 break-words">{children}</td>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-outside my-2 space-y-1 ml-6">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="ml-2">{children}</li>
    ),
  }
  
  // Show empty state if no messages and not loading
  if (groupedMessages.length === 0 && !isLoading && !streamingMessage) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <EmptyState
          type="empty-chat"
          title="Start a conversation"
          description="Type a message below to begin chatting with AI"
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 min-w-0 elegant-scrollbar">
      {groupedMessages.map((group, groupIndex) => {
        if (group.type === 'single') {
          const message = group.messages[0]
          return (
            <div key={message.id} className="w-full max-w-[950px] mx-auto elegant-fade-in">
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-semibold text-foreground/95">
                    {message.role === 'user' ? (userName || 'You') : 'Assistant'}
                  </span>
                  {message.provider && message.model && message.role === 'assistant' && (
                    <span className="text-xs px-2 py-1 glass-effect border border-border/20 rounded-lg text-muted-foreground font-medium">
                      {message.provider}/{message.model}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground/70 font-medium">
                    {format(new Date(message.created_at), 'h:mm a')}
                  </span>
                </div>
                
                {/* Show file attachments */}
                <AttachmentDisplay attachments={
                  message.images?.map(img => ({ type: 'image', path: img.file_path || img.url || '', mimeType: img.mime_type || 'image/*' })) ||
                  message.audio?.map(audio => ({ type: 'audio', path: audio.file_path || audio.url || '', mimeType: audio.mime_type || 'audio/*' })) ||
                  message.files?.map(file => ({ type: 'file', path: file.path, mimeType: file.type })) ||
                  null
                } />
                
                <div className={clsx(
                  'prose prose-sm dark:prose-invert max-w-none break-words selection:bg-primary/20 p-4 rounded-2xl relative group',
                  message.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant'
                )}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {message.text || ''}
                  </ReactMarkdown>
                  
                  <button
                    onClick={() => copyToClipboard(message.text || '', message.id.toString())}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary p-1.5 rounded-lg elegant-hover"
                    title="Copy message"
                  >
                  {copiedMessageId === message.id.toString() ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                  </button>
                </div>
              </div>
            </div>
          )
        } else {
          // Parallel responses - display side by side
          const firstMessage = group.messages[0]
          return (
            <div key={`group-${groupIndex}`} className="w-full max-w-[1200px] mx-auto elegant-fade-in">
              <div className="space-y-3">
                <div className="parallel-responses-header">
                  <span className="font-semibold text-foreground/95">Assistant</span>
                  <span className="parallel-count-badge">
                    {group.messages.length} models
                  </span>
                  <span className="text-xs text-muted-foreground/70 font-medium ml-auto">
                    {format(new Date(firstMessage.created_at), 'h:mm a')}
                  </span>
                </div>
                
                {/* Side by side responses */}
                <div className="comparison-grid" style={{ 
                  gridTemplateColumns: `repeat(${Math.min(group.messages.length, 3)}, 1fr)` 
                }}>
                  {group.messages.slice(0, 3).map((message) => (
                    <div key={message.id} className="comparison-response min-w-0">
                      <div className="flex items-center gap-2 p-3 pb-0">
                        <span className="model-badge truncate">
                          {message.provider}/{message.model}
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words selection:bg-primary/20 p-3 pt-2 relative group">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {message.text || ''}
                        </ReactMarkdown>
                        
                        <button
                          onClick={() => copyToClipboard(message.text || '', message.id.toString())}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary p-1.5 rounded-lg elegant-hover"
                          title="Copy message"
                        >
                        {copiedMessageId === message.id.toString() ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Show remaining responses if more than 3 */}
                {group.messages.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{group.messages.length - 3} more response{group.messages.length - 3 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )
        }
      })}
      
      {/* Streaming messages */}
      {streamingMessagesByModel && streamingMessagesByModel.size > 0 && (
        <div className="w-full max-w-[1200px] mx-auto elegant-fade-in">
          <div className="space-y-3">
            <div className="parallel-responses-header">
              <span className="font-semibold text-foreground/95">Assistant</span>
              <span className="parallel-count-badge">
                {streamingMessagesByModel.size} {streamingMessagesByModel.size === 1 ? 'model' : 'models'}
              </span>
              <span className="text-xs text-muted-foreground/70 font-medium ml-auto">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            {streamingMessagesByModel.size > 1 ? (
              /* Multiple streaming responses - display side by side */
              <div className="comparison-grid" style={{ 
                gridTemplateColumns: `repeat(${Math.min(streamingMessagesByModel.size, 3)}, 1fr)` 
              }}>
                {Array.from(streamingMessagesByModel.entries()).slice(0, 3).map(([modelId, content]) => {
                  const [provider, model] = modelId.split(':')
                  return (
                    <div key={modelId} className="comparison-response min-w-0">
                      <div className="flex items-center gap-2 p-3 pb-0">
                        <span className="model-badge truncate">
                          {provider}/{model}
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words selection:bg-primary/20 p-3 pt-2 relative group">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {content}
                        </ReactMarkdown>
                        <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 rounded-full" />
                        
                        <button
                          onClick={() => copyToClipboard(content, `streaming-${modelId}`)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary p-1.5 rounded-lg elegant-hover"
                          title="Copy message"
                        >
                        {copiedMessageId === `streaming-${modelId}` ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Single streaming response - use traditional layout */
              Array.from(streamingMessagesByModel.entries()).map(([modelId, content]) => {
                return (
                  <div key={modelId} className="message-bubble-assistant prose prose-sm dark:prose-invert max-w-none break-words selection:bg-primary/20 p-4 rounded-2xl relative group">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {content}
                    </ReactMarkdown>
                    <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 rounded-full" />
                    
                    <button
                      onClick={() => copyToClipboard(content, `streaming-${modelId}`)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary p-1.5 rounded-lg elegant-hover"
                      title="Copy message"
                    >
                    {copiedMessageId === `streaming-${modelId}` ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
      
      {/* Fallback: Old single streaming message for backward compatibility */}
      {streamingMessage && (!streamingMessagesByModel || streamingMessagesByModel.size === 0) && (
        <div className="w-full max-w-[950px] mx-auto elegant-fade-in">
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="font-semibold text-foreground/95">Assistant</span>
              <span className="text-xs text-muted-foreground/70 font-medium">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className="message-bubble-assistant prose prose-sm dark:prose-invert max-w-none break-words selection:bg-primary/20 p-4 rounded-2xl relative group">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {streamingMessage}
              </ReactMarkdown>
              <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 rounded-full" />
              
              <button
                onClick={() => copyToClipboard(streamingMessage, 'streaming')}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary p-1.5 rounded-lg elegant-hover"
                title="Copy message"
              >
                {copiedMessageId === 'streaming' ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading indicator - show when loading and no streaming started yet */}
      {isLoading && !streamingMessage && (!streamingMessagesByModel || streamingMessagesByModel.size === 0) && (
        <div className="w-full max-w-[950px] mx-auto elegant-fade-in">
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="font-semibold text-foreground/95">Assistant</span>
            </div>
            
            <div className="message-bubble-assistant p-4 rounded-2xl flex items-center gap-3">
              <Lottie
                animationData={spinnerAnimation}
                loop
                autoplay
                style={{ width: 22, height: 22 }}
              />
              <span className="text-sm text-foreground/80 animate-pulse font-medium">{loadingMessage}...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}