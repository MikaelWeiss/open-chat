import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { User, Bot, Copy, Check, FileText, Image, Volume2 } from 'lucide-react'
import clsx from 'clsx'
import { useState, useEffect } from 'react'
import { type Message } from '../../shared/messageStore'
import Lottie from 'lottie-react'
import spinnerAnimation from '../../assets/spinner.json'
import EmptyState from '../EmptyState/EmptyState'

interface MessageListProps {
  messages?: Message[]
  isLoading?: boolean
  streamingMessage?: string
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


export default function MessageList({ messages = [], isLoading = false, streamingMessage = '' }: MessageListProps) {
  const [loadingMessage, setLoadingMessage] = useState('Assembling')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  
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
  if (messages.length === 0 && !isLoading && !streamingMessage) {
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
      {messages.map((message) => (
        <div key={message.id} className="flex gap-4 min-w-0 elegant-fade-in">
          <div
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-elegant border relative overflow-hidden',
              message.role === 'user'
                ? 'avatar-assistant'
                : 'avatar-user'
            )}
          >
            {message.role === 'user' ? (
              <User className="h-5 w-5 text-white" />
            ) : (
              <Bot className="h-5 w-5 text-foreground/90" />
            )}
          </div>
          
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-baseline gap-3">
              <span className="font-semibold text-foreground/95">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
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
      ))}
      
      {/* Streaming message */}
      {streamingMessage && (
        <div className="flex gap-4 min-w-0 elegant-fade-in">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-elegant border relative overflow-hidden avatar-user">
            <Bot className="h-5 w-5 text-foreground/90" />
          </div>
          
          <div className="flex-1 space-y-3 min-w-0">
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
      {isLoading && !streamingMessage && (
        <div className="flex gap-4 min-w-0 elegant-fade-in">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-elegant border relative overflow-hidden avatar-user">
            <Bot className="h-5 w-5 text-foreground/90" />
          </div>
          
          <div className="flex-1 space-y-3 min-w-0">
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