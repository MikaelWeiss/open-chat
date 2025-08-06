import { ChevronLeft, ChevronRight, Plus, Settings, Trash2, MessageSquare, Star, Keyboard } from 'lucide-react'
import { format } from 'date-fns'
import type { Conversation } from '@/types/electron'
import clsx from 'clsx'
import { useSettingsStore } from '@/stores/settingsStore'
import { useState, useRef } from 'react'
import { useConversationGrouping, useResizable, useContextMenu, useDeleteConfirmation, usePlatformInfo } from '@/hooks'

interface SidebarProps {
  isOpen: boolean
  width: number
  onToggle: () => void
  onWidthChange: (width: number) => void
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onOpenSettings: () => void
  onNewConversation: () => void
  onDeleteConversation: (conversationId: string) => void
  onToggleStarConversation: (conversationId: string) => void
  onOpenFeedback: () => void
  onOpenShortcuts: () => void
}

export default function Sidebar({
  isOpen,
  width,
  onToggle,
  onWidthChange,
  conversations,
  selectedConversation,
  onSelectConversation,
  onOpenSettings,
  onNewConversation,
  onDeleteConversation,
  onToggleStarConversation,
  onOpenFeedback,
  onOpenShortcuts,
}: SidebarProps) {
  const { settings } = useSettingsStore()
  const [starredCollapsed, setStarredCollapsed] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  
  // Use custom hooks
  const { getConversationsByDate, getDateLabel } = useConversationGrouping(conversations)
  const { handleMouseDown } = useResizable(width, onWidthChange, 240, 480)
  const { contextMenu, handleRightClick, handleContextMenuAction, handleClickOutside } = useContextMenu()
  const { deleteConfirm, handleDeleteClick, handleConfirmDelete, handleCancelDelete } = useDeleteConfirmation()
  const { modifierKey } = usePlatformInfo()
  
  // Check if there are any configured providers
  const hasConfiguredProviders = settings?.providers 
    ? Object.values(settings.providers).some(provider => provider.configured) 
    : false

  const { starredConversations, regularByDate } = getConversationsByDate()

  return (
    <div
      ref={sidebarRef}
      className={clsx(
        'relative flex flex-col bg-secondary',
        isOpen ? '' : 'w-0'
      )}
      style={{ width: isOpen ? `${width}px` : '0px' }}
    >
      <div className={clsx('flex flex-col h-full', !isOpen && 'invisible')}>
        {/* Window controls area */}
        <div className="h-6 drag-region" />
        
        {/* Header */}
        <div className="px-4 py-5 border-b border-border backdrop-blur-sm">
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
                onClick={onOpenShortcuts}
                className="p-2 hover:bg-accent rounded-lg transition-colors font-mono text-sm font-medium"
                title="Keyboard Shortcuts"
              >
                /
              </button>
              <button
                onClick={onOpenFeedback}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="Send Feedback"
              >
                <MessageSquare className="h-4 w-4" />
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
        <div 
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground scrollbar-track-transparent"
          onClick={handleClickOutside}
        >
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
                  onContextMenu={(e) => handleRightClick(e, conversation.id, sidebarRef)}
                >
                  <button
                    onClick={() => onSelectConversation(conversation)}
                    className="flex-1 px-4 py-3 text-left hover:scale-[1.02] transition-transform duration-150"
                  >
                    <div className="font-medium text-sm truncate pr-8 flex items-center gap-2">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-5">
                      {hasConfiguredProviders && conversation.model ? (
                        `${conversation.model} • ${format(new Date(conversation.updatedAt), 'h:mm a')}`
                      ) : (
                        format(new Date(conversation.updatedAt), 'h:mm a')
                      )}
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, conversation.id, onDeleteConversation)}
                    className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all duration-200 hover:scale-110"
                    title={`Delete conversation (${modifierKey}+click to skip confirmation)`}
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
                {getDateLabel(dateKey)}
              </div>
              {convs.map((conversation) => (
                <div
                  key={conversation.id}
                  className={clsx(
                    'group relative flex items-center w-full hover:bg-accent transition-colors',
                    selectedConversation?.id === conversation.id && 'bg-accent'
                  )}
                  onContextMenu={(e) => handleRightClick(e, conversation.id, sidebarRef)}
                >
                  <button
                    onClick={() => onSelectConversation(conversation)}
                    className="flex-1 px-4 py-3 text-left hover:scale-[1.02] transition-transform duration-150"
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
                    onClick={(e) => handleDeleteClick(e, conversation.id, onDeleteConversation)}
                    className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all duration-200 hover:scale-110"
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
                onClick={() => handleConfirmDelete(onDeleteConversation)}
                className="px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={handleClickOutside}
          />
          <div
            className="absolute bg-background border border-border rounded-lg shadow-lg py-1 z-50 min-w-32"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
          >
            <button
              onClick={() => handleContextMenuAction('star', contextMenu.conversationId, (action, id) => {
                if (action === 'star') {
                  onToggleStarConversation(id)
                } else if (action === 'delete') {
                  handleDeleteClick({ stopPropagation: () => {} } as React.MouseEvent, id, onDeleteConversation)
                }
              })}
              className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              {conversations.find(c => c.id === contextMenu.conversationId)?.starred ? 'Unstar' : 'Star'}
            </button>
            <div className="border-t border-border my-1" />
            <button
              onClick={() => handleContextMenuAction('delete', contextMenu.conversationId, (action, id) => {
                if (action === 'star') {
                  onToggleStarConversation(id)
                } else if (action === 'delete') {
                  handleDeleteClick({ stopPropagation: () => {} } as React.MouseEvent, id, onDeleteConversation)
                }
              })}
              className="w-full px-3 py-2 text-sm text-left hover:bg-accent text-destructive transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </>
      )}

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