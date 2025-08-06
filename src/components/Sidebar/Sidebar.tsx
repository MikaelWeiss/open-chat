import { ChevronLeft, ChevronRight, Plus, Settings, Trash2, MessageSquare, Star, Command } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import { useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

// Mock types for frontend display
interface MockMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface MockConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  provider: string
  model: string
  messages: MockMessage[]
  isTemporary?: boolean
  starred?: boolean
}

interface SidebarProps {
  isOpen: boolean
  width: number
  onToggle: () => void
  onWidthChange: (width: number) => void
  onOpenSettings: () => void
  onOpenShortcuts: () => void
}

// Mock data for visual display
const mockConversations: MockConversation[] = [
  {
    id: '1',
    title: 'Help with React Components',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:45:00Z',
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    messages: [{ id: '1', role: 'user', content: 'Help me', timestamp: '2024-01-15T10:30:00Z' }],
    starred: true
  },
  {
    id: '2',
    title: 'JavaScript Best Practices',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-14T16:20:00Z',
    provider: 'openai',
    model: 'gpt-4',
    messages: [{ id: '2', role: 'user', content: 'Question about JS', timestamp: '2024-01-14T09:15:00Z' }]
  },
  {
    id: '3',
    title: 'CSS Grid Layout',
    createdAt: '2024-01-13T11:00:00Z',
    updatedAt: '2024-01-13T12:30:00Z',
    provider: 'anthropic',
    model: 'claude-3-haiku',
    messages: [{ id: '3', role: 'user', content: 'CSS help', timestamp: '2024-01-13T11:00:00Z' }]
  }
]

export default function Sidebar({
  isOpen,
  width,
  onToggle,
  onWidthChange,
  onOpenSettings,
  onOpenShortcuts,
}: SidebarProps) {
  const [starredCollapsed, setStarredCollapsed] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<MockConversation | null>(mockConversations[0])

  const handleStartDrag = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const window = getCurrentWindow()
      await window.startDragging()
    } catch (error) {
      console.error('Failed to start dragging:', error)
    }
  }
  
  // Group conversations by date
  const getConversationsByDate = () => {
    const starred = mockConversations.filter(conv => conv.starred)
    const regular = mockConversations.filter(conv => !conv.starred)
    
    // Group regular conversations by date
    const groupedByDate = regular.reduce((acc, conv) => {
      const date = new Date(conv.updatedAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let dateKey: string
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday'
      } else {
        dateKey = format(date, 'MMMM d, yyyy')
      }
      
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(conv)
      return acc
    }, {} as Record<string, MockConversation[]>)
    
    return { starredConversations: starred, regularByDate: Object.entries(groupedByDate) }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(480, startWidth + (e.clientX - startX)))
      onWidthChange(newWidth)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const { starredConversations, regularByDate } = getConversationsByDate()

  return (
    <div
      className={clsx(
        'relative flex flex-col bg-secondary',
        isOpen ? '' : 'w-0'
      )}
      style={{ width: isOpen ? `${width}px` : '0px' }}
    >
      <div className={clsx('flex flex-col h-full', !isOpen && 'invisible')}>
        {/* Window controls area */}
        <div 
          className="h-6 select-none bg-secondary rounded-tl-lg" 
          onMouseDown={handleStartDrag}
        />
        
        {/* Header */}
        <div 
          className="px-4 py-5 border-b border-border backdrop-blur-sm select-none"
          onMouseDown={handleStartDrag}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Open Chat</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => console.log('New conversation')}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="New conversation"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => console.log('Send feedback')}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="Send Feedback"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <button
                onClick={onOpenShortcuts}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="Keyboard Shortcuts"
              >
                <Command className="h-4 w-4" />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground scrollbar-track-transparent">
          {/* Starred Conversations Section */}
          {starredConversations.length > 0 && (
            <div>
              <button
                onClick={() => setStarredCollapsed(!starredCollapsed)}
                className="w-full px-4 py-2 text-xs font-medium text-muted-foreground sticky top-0 bg-secondary/80 backdrop-blur-sm border-b border-border/50 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Star className="h-3 w-3 fill-current" />
                  Starred ({starredConversations.length})
                </span>
                <ChevronRight className={clsx("h-3 w-3 transition-transform", !starredCollapsed && "rotate-90")} />
              </button>
              {!starredCollapsed && starredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={clsx(
                    'group relative flex items-center w-full hover:bg-accent transition-colors',
                    selectedConversation?.id === conversation.id && 'bg-accent'
                  )}
                >
                  <button
                    onClick={() => setSelectedConversation(conversation)}
                    className="flex-1 px-4 py-3 text-left hover:scale-[1.02] transition-transform duration-150"
                  >
                    <div className="font-medium text-sm truncate pr-8 flex items-center gap-2">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-5">
                      {conversation.model} • {format(new Date(conversation.updatedAt), 'h:mm a')}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('Delete conversation', conversation.id)
                    }}
                    className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all duration-200 hover:scale-110"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Regular Conversations by Date */}
          {regularByDate.map(([dateKey, convs]) => (
            <div key={dateKey}>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground sticky top-0 bg-secondary/80 backdrop-blur-sm border-b border-border/50">
                {dateKey}
              </div>
              {convs.map((conversation) => (
                <div
                  key={conversation.id}
                  className={clsx(
                    'group relative flex items-center w-full hover:bg-accent transition-colors',
                    selectedConversation?.id === conversation.id && 'bg-accent'
                  )}
                >
                  <button
                    onClick={() => setSelectedConversation(conversation)}
                    className="flex-1 px-4 py-3 text-left hover:scale-[1.02] transition-transform duration-150"
                  >
                    <div className="font-medium text-sm truncate pr-8">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {conversation.model} • {format(new Date(conversation.updatedAt), 'h:mm a')}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('Delete conversation', conversation.id)
                    }}
                    className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all duration-200 hover:scale-110"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Resize Handle */}
      {isOpen && (
        <div
          className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize"
          onMouseDown={handleMouseDown}
        />
      )}
      
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-secondary border border-border rounded-full p-1 hover:bg-accent transition-colors no-drag z-10"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}