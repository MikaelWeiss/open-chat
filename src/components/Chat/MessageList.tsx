import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot, Loader2 } from 'lucide-react'
import type { Message } from '@/types/electron'
import clsx from 'clsx'
import { useState, useEffect } from 'react'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  streamingMessage?: string
}

export default function MessageList({ messages, isLoading = false, streamingMessage = '' }: MessageListProps) {
  const [loadingMessage, setLoadingMessage] = useState('Thinking')
  
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
    }, 1500)
    
    return () => clearInterval(interval)
  }, [isLoading])
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((message) => (
        <div key={message.id} className="flex gap-3">
          <div
            className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary'
            )}
          >
            {message.role === 'user' ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(message.timestamp), 'h:mm a')}
              </span>
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => (
                    <pre className="bg-secondary p-3 rounded-lg overflow-x-auto">
                      {children}
                    </pre>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-secondary px-1 py-0.5 rounded text-sm">
                        {children}
                      </code>
                    ) : (
                      <code>{children}</code>
                    ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
      
      {/* Streaming message */}
      {streamingMessage && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-secondary">
            <Bot className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">Assistant</span>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => (
                    <pre className="bg-secondary p-3 rounded-lg overflow-x-auto">
                      {children}
                    </pre>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-secondary px-1 py-0.5 rounded text-sm">
                        {children}
                      </code>
                    ) : (
                      <code>{children}</code>
                    ),
                }}
              >
                {streamingMessage}
              </ReactMarkdown>
              <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            </div>
          </div>
        </div>
      )}
      
      {/* Loading indicator - show when loading and no streaming started yet */}
      {isLoading && !streamingMessage && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-secondary">
            <Bot className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">Assistant</span>
              <span className="text-xs text-muted-foreground">working...</span>
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