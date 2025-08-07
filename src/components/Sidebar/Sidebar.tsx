import { ChevronLeft, ChevronRight, ChevronDown, Settings, Trash2, Star, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useConversations } from '../../hooks/useConversations'
import { type Conversation } from '../../shared/conversationStore'
import { useState, useEffect } from 'react'
import ContextMenu from '../ContextMenu/ContextMenu'
import EmptyState from '../EmptyState/EmptyState'
import { ConversationListSkeleton } from '../Skeleton/Skeleton'
import Logo from '../../assets/Logo.svg'

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
  const { conversations, loading, error, deleteConversation, toggleConversationFavorite, createConversation } = useConversations()
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
    const isSelected = selectedConversationId === conversation.id
    
    return (
      <div
        key={conversation.id}
        className={clsx(
          'group relative flex items-center w-full elegant-hover mx-3 mr-2 rounded-xl overflow-hidden elegant-fade-in',
          isSelected && 'bg-gradient-subtle border border-primary/20',
          isDeleting && 'opacity-0 scale-95 pointer-events-none'
        )}
        style={{
          maxHeight: isDeleting ? '0px' : '80px',
          marginBottom: isDeleting ? '0px' : '8px',
          paddingTop: isDeleting ? '0px' : undefined,
          paddingBottom: isDeleting ? '0px' : undefined
        }}
      >
        <button
          onClick={() => handleSelectConversation(conversation)}
          onContextMenu={(e) => handleContextMenu(e, conversation)}
          className="flex-1 min-w-0 px-4 py-3 text-left transition-all duration-200"
        >
          <div className="flex items-center gap-2 font-medium text-sm pr-8">
            {conversation.is_favorite && (
              <Star className="h-3 w-3 fill-primary text-primary flex-shrink-0 drop-shadow-sm" />
            )}
            <span className="truncate text-foreground/90">{conversation.title}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {conversation.model || 'No model'} • {format(new Date(conversation.updated_at), 'h:mm a')}
          </div>
        </button>
        <button
          onClick={(e) => handleDeleteClick(e, conversation)}
          className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive rounded-lg transition-all duration-200 hover:scale-110"
          title="Delete conversation (hold ⌘ to skip confirmation)"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className={clsx('relative flex flex-col glass-nav border-r border-border/10', isOpen ? '' : 'w-0')} style={{ width: isOpen ? `${width}px` : '0px' }}>
        <div className={clsx('relative flex flex-col h-full', !isOpen && 'invisible')}>
          {/* Header skeleton */}
          <div className="h-6 glass-nav rounded-tl-lg" />
          <div className="px-6 py-4 border-b border-border/10 glass-nav">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-elegant rounded-lg flex items-center justify-center shadow-glow">
                  <img src={Logo} alt="Open Chat" className="h-5 w-5" />
                </div>
                <h1 className="text-lg font-semibold text-foreground/95">Open Chat</h1>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 elegant-hover rounded-lg transition-all text-sm font-mono text-muted-foreground">/</button>
                <button className="p-2 elegant-hover rounded-lg transition-all text-muted-foreground">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Conversations skeleton */}
          <div className="flex-1 overflow-y-auto elegant-scrollbar">
            <ConversationListSkeleton />
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={clsx('relative flex flex-col glass-nav border-r border-border/10', isOpen ? '' : 'w-0')} style={{ width: isOpen ? `${width}px` : '0px' }}>
        <div className={clsx('flex flex-col h-full justify-center items-center', !isOpen && 'invisible')}>
          <div className="text-destructive">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        "relative flex flex-col glass-nav border-r border-border/10",
        isOpen ? "" : "w-0"
      )}
      style={{ width: isOpen ? `${width}px` : "0px" }}
    >
      <div
        className={clsx(
          "relative flex flex-col h-full",
          !isOpen && "invisible"
        )}
      >
        {/* Conversations List - Now extends full height behind header */}
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden elegant-scrollbar pt-24 pb-20">
          {conversations.length === 0 && (
            <EmptyState
              type="no-conversations"
              title="No conversations yet"
              description="Start a new conversation to begin chatting with AI"
              action={{
                label: "Start New Chat",
                onClick: async () => {
                  // Create a new conversation
                  const id = await createConversation(
                    "New Conversation",
                    "",
                    ""
                  );
                  onSelectConversation?.(id || null);
                },
              }}
              className="h-full"
            />
          )}
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setIsFavoritesCollapsed(!isFavoritesCollapsed)}
                className="w-full px-6 py-3 text-xs font-semibold text-muted-foreground sticky top-0 z-10 glass-nav backdrop-blur-strong border-b border-border/10 flex items-center gap-2 elegant-hover transition-all"
              >
                <Star className="h-3 w-3 fill-primary text-primary drop-shadow-sm" />
                <span className="flex-1 text-left tracking-wide">
                  FAVORITES
                </span>
                <ChevronDown
                  className={clsx(
                    "h-3 w-3 transition-transform duration-200 text-primary/70",
                    isFavoritesCollapsed && "-rotate-90"
                  )}
                />
              </button>
              {!isFavoritesCollapsed && (
                <div className="space-y-1 mt-2">
                  {favorites.map(renderConversation)}
                </div>
              )}
            </div>
          )}

          {/* Regular Conversations by Date */}
          {regularByDate.map(([dateKey, convs]) => (
            <div key={dateKey} className="mb-6">
              <div className="px-6 py-3 text-xs font-semibold text-muted-foreground sticky top-0 z-10 glass-nav backdrop-blur-strong border-b border-border/10 tracking-wide">
                {dateKey.toUpperCase()}
              </div>
              <div className="space-y-1 mt-2">
                {convs.map(renderConversation)}
              </div>
            </div>
          ))}
        </div>

        {/* Header - Now positioned absolutely */}
        <div className="absolute top-0 left-0 right-0 z-20">
          {/* Window controls area */}
          <div
            className="h-6 select-none glass-nav rounded-tl-lg"
            onMouseDown={handleStartDrag}
          />

          {/* Header */}
          <div
            className="px-6 py-4 border-b border-border/10 glass-nav backdrop-blur-strong select-none"
            onMouseDown={handleStartDrag}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={Logo} alt="Open Chat" className="h-5 w-5" />
                <h1 className="text-lg font-semibold text-foreground/95 tracking-tight">
                  Open Chat
                </h1>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenShortcuts}
                  className="p-2 elegant-hover rounded-lg transition-all text-sm font-mono text-muted-foreground hover:text-primary"
                  title="Keyboard Shortcuts"
                >
                  /
                </button>
                <button
                  onClick={onOpenSettings}
                  className="p-2 elegant-hover rounded-lg transition-all text-muted-foreground hover:text-primary"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feedback Button - Now positioned absolutely */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/10 glass-nav backdrop-blur-strong shadow-elegant-xl">
          <button
            onClick={() => console.log("Send feedback")}
            className="ml-auto block p-2 elegant-hover rounded-lg transition-all text-muted-foreground hover:text-primary"
            title="Send Feedback"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Resize Handle */}
      {isOpen && (
        <div
          className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/20 transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 glass-effect border border-border/20 rounded-full p-1.5 elegant-hover no-drag z-50 text-muted-foreground hover:text-primary shadow-elegant"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-effect border border-border/20 rounded-2xl p-6 max-w-sm mx-4 shadow-elegant-xl">
            <h3 className="text-lg font-semibold mb-2 text-foreground/95">
              Delete Conversation
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Are you sure you want to delete "{confirmDelete.title}"? This
              action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm elegant-hover rounded-xl transition-all text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConversation(confirmDelete.id)}
                className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl transition-all hover:scale-105"
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
            handleToggleFavorite(contextMenu.conversation.id);
          }
        }}
        onDelete={() => {
          if (contextMenu) {
            setConfirmDelete({
              id: contextMenu.conversation.id,
              title: contextMenu.conversation.title,
            });
          }
        }}
      />
    </div>
  );
}