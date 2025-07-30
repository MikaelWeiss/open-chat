import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot } from 'lucide-react'
import type { Message } from '@/types/electron'
import clsx from 'clsx'

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
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
    </div>
  )
}