import { ChevronLeft, ChevronRight, Plus, Settings, Trash2 } from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'
import type { Conversation } from '@/types/electron'
import clsx from 'clsx'
import { useSettingsStore } from '@/stores/settingsStore'
import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onOpenSettings: () => void
  onNewConversation: () => void
  onDeleteConversation: (conversationId: string) => void
}

export default function Sidebar({
  isOpen,
  onToggle,
  conversations,
  selectedConversation,
  onSelectConversation,
  onOpenSettings,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const { settings } = useSettingsStore()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  // Check if there are any configured providers
  const hasConfiguredProviders = settings?.providers 
    ? Object.values(settings.providers).some(provider => provider.configured) 
    : false

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    
    // Check if Command (Mac) or Ctrl (Windows/Linux) is held down
    const isModifierPressed = isMac ? e.metaKey : e.ctrlKey
    
    if (isModifierPressed) {
      // Delete immediately without confirmation
      onDeleteConversation(conversationId)
    } else {
      // Show confirmation dialog
      setDeleteConfirm(conversationId)
    }
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDeleteConversation(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirm(null)
  }

  // Get platform-specific modifier key for tooltip
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modifierKey = isMac ? '⌘' : 'Ctrl'

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
        {/* Window controls area */}
        <div className="h-6 drag-region" />
        
        {/* Header */}
        <div className="px-4 py-5 border-b border-border">
          <div className="flex items-center justify-between">
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
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsByDate.map(([dateKey, convs]) => (
            <div key={dateKey}>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                {getDateLabel(dateKey)}
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
                    onClick={() => onSelectConversation(conversation)}
                    className="flex-1 px-4 py-3 text-left"
                  >
                    <div className="font-medium text-sm truncate pr-8">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {hasConfiguredProviders && conversation.model ? (
                        `${conversation.model} • ${format(new Date(conversation.updatedAt), 'h:mm a')}`
                      ) : (
                        format(new Date(conversation.updatedAt), 'h:mm a')
                      )}
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                    className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all duration-200"
                    title={`Delete conversation (${modifierKey}+click to skip confirmation)`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Conversation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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