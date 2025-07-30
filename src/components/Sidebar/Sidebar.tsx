import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'
import type { Conversation } from '@/types/electron'
import clsx from 'clsx'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onOpenSettings: () => void
  onNewConversation: () => void
}

export default function Sidebar({
  isOpen,
  onToggle,
  conversations,
  selectedConversation,
  onSelectConversation,
  onOpenSettings,
  onNewConversation,
}: SidebarProps) {
  const getConversationsByDate = () => {
    const grouped = new Map<string, Conversation[]>()
    
    conversations.forEach(conv => {
      const dateKey = new Date(conv.updatedAt).toDateString()
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(conv)
    })
    
    return Array.from(grouped.entries()).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime()
    })
  }
  
  const conversationsByDate = getConversationsByDate()

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isThisWeek(date)) return format(date, 'EEEE')
    if (isThisMonth(date)) return format(date, 'MMMM d')
    return format(date, 'MMMM d, yyyy')
  }

  return (
    <div
      className={clsx(
        'relative flex flex-col bg-secondary border-r border-border transition-all duration-200',
        isOpen ? 'w-80' : 'w-0'
      )}
    >
      <div className={clsx('flex flex-col h-full', !isOpen && 'invisible')}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border drag-region">
          <h1 className="text-xl font-semibold no-drag">Open Chat</h1>
          <div className="flex items-center gap-2 no-drag">
            <button
              onClick={onNewConversation}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="New conversation"
            >
              <Plus className="h-4 w-4" />
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

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsByDate.map(([dateKey, convs]) => (
            <div key={dateKey}>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                {getDateLabel(dateKey)}
              </div>
              {convs.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={clsx(
                    'w-full px-4 py-3 text-left hover:bg-accent transition-colors',
                    selectedConversation?.id === conversation.id && 'bg-accent'
                  )}
                >
                  <div className="font-medium text-sm truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {conversation.model} • {format(conversation.updatedAt, 'h:mm a')}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-secondary border border-border rounded-full p-1 hover:bg-accent transition-colors no-drag"
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