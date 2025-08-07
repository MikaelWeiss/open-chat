import { ChevronLeft, ChevronRight, ChevronDown, Settings, Trash2, MessageSquare, Star } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useConversations } from '../../hooks/useConversations'
import { type Conversation } from '../../shared/conversationStore'
import { useState, useEffect } from 'react'
import ContextMenu from '../ContextMenu/ContextMenu'

interface SidebarProps {
  isOpen: boolean
  width: number
  onToggle: () => void
  onWidthChange: (width: number) => void
  onOpenSettings: () => void
  onOpenShortcuts: () => void
  selectedConversationId?: number | null
  onSelectConversation?: (conversationId: number | null) => void
  onDeleteConversation?: (deletedId: number) => void
}

export default function Sidebar({
  isOpen,
  width,
  onToggle,
  onWidthChange,
  onOpenSettings,
  onOpenShortcuts,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const { conversations, loading, error, deleteConversation, toggleConversationFavorite } = useConversations()
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    conversation: Conversation
  } | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [isFavoritesCollapsed, setIsFavoritesCollapsed] = useState(() => {
    const saved = localStorage.getItem('favoritesCollapsed')
    return saved === 'true'
  })
  
  useEffect(() => {
    localStorage.setItem('favoritesCollapsed', isFavoritesCollapsed.toString())
  }, [isFavoritesCollapsed])
  
  // Clean up deleting state when conversations change
  useEffect(() => {
    const conversationIds = new Set(conversations.map(c => c.id))
    setDeletingIds(prev => {
      const newSet = new Set<number>()
      for (const id of prev) {
        if (conversationIds.has(id)) {
          newSet.add(id)
        }
      }
      return newSet
    })
  }, [conversations])
  
  const handleSelectConversation = (conversation: Conversation) => {
    onSelectConversation?.(conversation.id)
  }
  
  const handleDeleteConversation = async (id: number) => {
    // Start the deletion animation immediately
    setDeletingIds(prev => new Set(prev).add(id))
    setConfirmDelete(null)
    
    try {
      await deleteConversation(id)
      // Notify parent component that a conversation was deleted
      onDeleteConversation?.(id)
    } catch (err) {
      console.error('Failed to delete conversation:', err)
      // Remove from deleting state if deletion failed
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation()
    
    // If Command key is held, delete immediately without confirmation
    if (e.metaKey) {
      handleDeleteConversation(conversation.id)
    } else {
      // Show confirmation dialog
      setConfirmDelete({ id: conversation.id, title: conversation.title })
    }
  }

  const handleContextMenu = (e: React.MouseEvent, conversation: Conversation) => {
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conversation,
    })
  }

  const handleToggleFavorite = async (conversationId: number) => {
    try {
      await toggleConversationFavorite(conversationId)
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }
  

  const handleStartDrag = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const window = getCurrentWindow()
      await window.startDragging()
    } catch (error) {
      console.error('Failed to start dragging:', error)
    }
  }
  
  // Group conversations by date and favorites
  const getConversationsByDate = () => {
    // Separate conversations by favorite status
    const favorites = conversations.filter(conv => conv.is_favorite)
    const regular = conversations.filter(conv => !conv.is_favorite)
    
    // Group regular conversations by date
    const regularByDate = regular.reduce((acc, conv) => {
      const date = new Date(conv.updated_at)
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
    }, {} as Record<string, Conversation[]>)
    
    return {
      favorites,
      regularByDate: Object.entries(regularByDate)
    }
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

  const { favorites, regularByDate } = getConversationsByDate()
  
  // Helper function to render a conversation item
  const renderConversation = (conversation: Conversation) => {
    const isDeleting = deletingIds.has(conversation.id)
    
    return (
      <div
        key={conversation.id}
        className={clsx(
          'group relative flex items-center w-full hover:bg-accent transition-all duration-300 overflow-hidden',
          selectedConversationId === conversation.id && 'bg-accent',
          isDeleting && 'opacity-0 scale-95 pointer-events-none'
        )}
        style={{
          maxHeight: isDeleting ? '0px' : '80px',
          marginBottom: isDeleting ? '0px' : undefined,
          paddingTop: isDeleting ? '0px' : undefined,
          paddingBottom: isDeleting ? '0px' : undefined
        }}
      >
        <button
          onClick={() => handleSelectConversation(conversation)}
          onContextMenu={(e) => handleContextMenu(e, conversation)}
          className="flex-1 min-w-0 px-4 py-3 text-left hover:scale-[1.02] transition-transform duration-150"
        >
          <div className="flex items-center gap-2 font-medium text-sm pr-8">
            {conversation.is_favorite && (
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            )}
            <span className="truncate">{conversation.title}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {conversation.model || 'No model'} • {format(new Date(conversation.updated_at), 'h:mm a')}
          </div>
        </button>
        <button
          onClick={(e) => handleDeleteClick(e, conversation)}
          className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all duration-200 hover:scale-110"
          title="Delete conversation (hold ⌘ to skip confirmation)"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className={clsx('relative flex flex-col bg-secondary', isOpen ? '' : 'w-0')} style={{ width: isOpen ? `${width}px` : '0px' }}>
        <div className={clsx('flex flex-col h-full justify-center items-center', !isOpen && 'invisible')}>
          <div className="text-muted-foreground">Loading conversations...</div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={clsx('relative flex flex-col bg-secondary', isOpen ? '' : 'w-0')} style={{ width: isOpen ? `${width}px` : '0px' }}>
        <div className={clsx('flex flex-col h-full justify-center items-center', !isOpen && 'invisible')}>
          <div className="text-destructive">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'relative flex flex-col bg-secondary',
        isOpen ? '' : 'w-0'
      )}
      style={{ width: isOpen ? `${width}px` : '0px' }}
    >
      <div className={clsx('relative flex flex-col h-full', !isOpen && 'invisible')}>
        {/* Conversations List - Now extends full height behind header */}
        <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground scrollbar-track-transparent pt-24 pb-20">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center text-sm">
                No conversations yet.
                <br />
                Click the + button to start chatting!
              </p>
            </div>
          )}
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <div>
              <button
                onClick={() => setIsFavoritesCollapsed(!isFavoritesCollapsed)}
                className="w-full px-4 py-2 text-xs font-medium text-muted-foreground sticky top-0 z-10 bg-secondary/70 backdrop-blur-lg -webkit-backdrop-filter border-b border-border/20 flex items-center gap-2 hover:bg-accent/50 transition-colors"
              >
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="flex-1 text-left">Favorites</span>
                <ChevronDown 
                  className={clsx(
                    "h-3 w-3 transition-transform duration-200",
                    isFavoritesCollapsed && "-rotate-90"
                  )} 
                />
              </button>
              {!isFavoritesCollapsed && favorites.map(renderConversation)}
            </div>
          )}

          {/* Regular Conversations by Date */}
          {regularByDate.map(([dateKey, convs]) => (
            <div key={dateKey}>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground sticky top-0 z-10 bg-secondary/70 backdrop-blur-lg -webkit-backdrop-filter border-b border-border/20">
                {dateKey}
              </div>
              {convs.map(renderConversation)}
            </div>
          ))}
        </div>

        {/* Header - Now positioned absolutely */}
        <div className="absolute top-0 left-0 right-0 z-20">
          {/* Window controls area */}
          <div 
            className="h-6 select-none bg-secondary rounded-tl-lg" 
            onMouseDown={handleStartDrag}
          />
          
          {/* Header */}
          <div 
            className="px-4 py-5 border-b border-border/20 bg-secondary/70 backdrop-blur-lg -webkit-backdrop-filter select-none"
            onMouseDown={handleStartDrag}
          >
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Open Chat</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenShortcuts}
                  className="p-2 hover:bg-accent rounded-lg transition-colors text-sm font-mono"
                  title="Keyboard Shortcuts"
                >
                  /
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
        </div>

        {/* Bottom Feedback Button - Now positioned absolutely */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/20 bg-secondary/70 backdrop-blur-lg -webkit-backdrop-filter shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => console.log('Send feedback')}
            className="ml-auto block p-2 hover:bg-accent/80 rounded-lg transition-colors"
            title="Send Feedback"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
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
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-secondary border border-border rounded-full p-1 hover:bg-accent transition-colors no-drag z-50"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Delete Conversation</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete "{confirmDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm bg-secondary hover:bg-accent rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConversation(confirmDelete.id)}
                className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      <ContextMenu
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        isVisible={!!contextMenu}
        onClose={() => setContextMenu(null)}
        isFavorite={contextMenu?.conversation.is_favorite || false}
        onToggleFavorite={() => {
          if (contextMenu) {
            handleToggleFavorite(contextMenu.conversation.id)
          }
        }}
        onDelete={() => {
          if (contextMenu) {
            setConfirmDelete({ 
              id: contextMenu.conversation.id, 
              title: contextMenu.conversation.title 
            })
          }
        }}
      />
    </div>
  )
}