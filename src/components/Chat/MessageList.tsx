import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { User, Bot, Loader2, Copy, Check } from 'lucide-react'
import type { Message } from '@/types/electron'
import clsx from 'clsx'
import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

interface MessageListProps {
  messages: Message[]
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
        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background"
        title="Copy code"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
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
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          }
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

export default function MessageList({ messages, isLoading = false, streamingMessage = '' }: MessageListProps) {
  const { settings } = useSettingsStore()
  const [loadingMessage, setLoadingMessage] = useState('Thinking')
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
    
    const messages = [
      'Thinking',
      'Processing your request',
      'Generating response',
      'Almost ready'
    ]
    
    let currentIndex = 0
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length
      setLoadingMessage(messages[currentIndex])
    }, 2500)
    
    return () => clearInterval(interval)
  }, [isLoading])
  
  const markdownComponents = {
    pre: ({ children }: any) => <div>{children}</div>,
    code: ({ inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code className="bg-secondary border border-border px-1.5 py-0.5 rounded text-sm shadow-sm font-mono">
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
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border rounded-lg">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="border border-border px-3 py-2 bg-secondary font-semibold text-left">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border border-border px-3 py-2">{children}</td>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="ml-2">{children}</li>
    ),
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 min-w-0 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground scrollbar-track-transparent">
      {messages.map((message) => (
        <div key={message.id} className="flex gap-3 min-w-0 animate-in fade-in duration-300">
          <div
            className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground border-primary/20'
                : 'bg-secondary border-border'
            )}
          >
            {message.role === 'user' ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
          
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(message.timestamp), 'h:mm a')}
              </span>
              {/* Usage and cost are now shown in aggregate, not per message */}
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none break-words selection:bg-primary/20">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            
            <button
              onClick={() => copyToClipboard(message.content, message.id)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-secondary/50 group"
            >
              {copiedMessageId === message.id ? (
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
      
      {/* Streaming message */}
      {streamingMessage && (
        <div className="flex gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-secondary">
            <Bot className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">Assistant</span>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none break-words selection:bg-primary/20">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {streamingMessage}
              </ReactMarkdown>
              <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            </div>
            
            <button
              onClick={() => copyToClipboard(streamingMessage, 'streaming')}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-secondary/50 group"
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
      )}
      
      {/* Loading indicator - show when loading and no streaming started yet */}
      {isLoading && !streamingMessage && (
        <div className="flex gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-secondary">
            <Bot className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">Assistant</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-muted-foreground">{loadingMessage}...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}