import React, { useState, useEffect } from 'react'
import { Star, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import { useConversations, useAppStore } from '../../stores/appStore'
import { type Conversation } from '../../shared/conversationStore'
import { type PendingConversation } from '../../stores/appStore'
import { getConversationModelDisplay } from '../../utils/conversationUtils'
import { mobileFeatures } from '../../utils/featureFlags'
import EmptyState from '../EmptyState/EmptyState'
import { ConversationListSkeleton } from '../Skeleton/Skeleton'

type SidebarConversation = Conversation | (PendingConversation & { id: 'pending', is_favorite?: boolean })

const isPersistentConversation = (conv: SidebarConversation): conv is Conversation => {
  return typeof conv.id === 'number'
}

interface ConversationListViewProps {
  selectedConversationId?: number | 'pending' | null
  onSelectConversation?: (conversationId: number | 'pending' | null) => void
  onDeleteConversation?: (deletedId: number | 'pending') => void
  onCreateNew?: () => void
}

export const ConversationListView: React.FC<ConversationListViewProps> = ({
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  onCreateNew
}) => {
  const { conversations, deleteConversation, toggleConversationFavorite, createPendingConversation } = useConversations()
  const getMessages = useAppStore((state) => state.getMessages)
  
  const loading = false
  const error = null
  const [confirmDelete, setConfirmDelete] = useState<{ id: number | 'pending'; title: string } | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number | 'pending'>>(new Set())
  const [swipedConversation, setSwipedConversation] = useState<number | 'pending' | null>(null)
  
  // Clean up deleting state when conversations change
  useEffect(() => {
    const conversationIds = new Set(conversations.map(c => c.id))
    setDeletingIds(prev => {
      const newSet = new Set<number | 'pending'>()
      for (const id of prev) {
        if (conversationIds.has(id)) {
          newSet.add(id)
        }
      }
      return newSet
    })
  }, [conversations])
  
  const handleSelectConversation = (conversation: SidebarConversation) => {
    onSelectConversation?.(conversation.id)
  }
  
  const handleDeleteConversation = async (id: number | 'pending') => {
    setDeletingIds(prev => new Set(prev).add(id))
    setConfirmDelete(null)
    setSwipedConversation(null)
    
    try {
      await deleteConversation(id)
      onDeleteConversation?.(id)
    } catch (err) {
      console.error('Failed to delete conversation:', err)
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }


  const handleToggleFavorite = async (conversationId: number | 'pending') => {
    if (conversationId === 'pending') return
    
    try {
      await toggleConversationFavorite(conversationId)
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }
  
  const handleSwipeAction = (conversationId: number | 'pending', action: 'delete' | 'favorite') => {
    if (action === 'delete') {
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        setConfirmDelete({ id: conversationId, title: conversation.title })
      }
    } else if (action === 'favorite') {
      handleToggleFavorite(conversationId)
    }
    setSwipedConversation(null)
  }
  
  // Group conversations by date and favorites
  const getConversationsByDate = () => {
    const favorites = conversations.filter(conv => isPersistentConversation(conv) && conv.is_favorite)
    const regular = conversations.filter(conv => !isPersistentConversation(conv) || !conv.is_favorite)
    
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
    }, {} as Record<string, SidebarConversation[]>)
    
    return {
      favorites,
      regularByDate: Object.entries(regularByDate)
    }
  }

  const { favorites, regularByDate } = getConversationsByDate()
  
  // Render conversation item with iOS styling
  const renderConversation = (conversation: SidebarConversation) => {
    const isDeleting = deletingIds.has(conversation.id)
    const isSelected = selectedConversationId === conversation.id
    const isSwiped = swipedConversation === conversation.id
    
    const messages = getMessages(conversation.id)
    const modelDisplay = getConversationModelDisplay(conversation.model, messages)
    
    return (
      <div
        key={conversation.id}
        className={clsx(
          'relative ios-table-cell bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
          isDeleting && 'opacity-0 scale-95 pointer-events-none transition-all duration-300'
        )}
        style={{
          transform: isSwiped ? 'translateX(-80px)' : 'translateX(0px)',
          transition: 'transform 0.2s ease-out'
        }}
      >
        {/* Swipe Action Buttons (iOS style) */}
        {isSwiped && mobileFeatures.swipeActions && (
          <div className="absolute right-0 top-0 bottom-0 flex">
            {isPersistentConversation(conversation) && (
              <button
                onClick={() => handleSwipeAction(conversation.id, 'favorite')}
                className="w-20 bg-blue-500 flex items-center justify-center"
              >
                <Star
                  className={clsx(
                    'h-5 w-5 text-white',
                    conversation.is_favorite && 'fill-white'
                  )}
                />
              </button>
            )}
            <button
              onClick={() => handleSwipeAction(conversation.id, 'delete')}
              className="w-20 bg-red-500 flex items-center justify-center"
            >
              <Trash2 className="h-5 w-5 text-white" />
            </button>
          </div>
        )}
        
        {/* Conversation Content */}
        <button
          onClick={() => handleSelectConversation(conversation)}
          className={clsx(
            'w-full px-4 py-3 text-left flex items-center space-x-3',
            isSelected && 'bg-blue-50 dark:bg-blue-900/20'
          )}
          onTouchStart={(e) => {
            if (!mobileFeatures.swipeActions) return
            const startX = e.touches[0].clientX
            
            const handleTouchMove = (e: TouchEvent) => {
              const currentX = e.touches[0].clientX
              const diff = startX - currentX
              
              if (diff > 50) {
                setSwipedConversation(conversation.id)
                document.removeEventListener('touchmove', handleTouchMove)
              }
            }
            
            const handleTouchEnd = () => {
              document.removeEventListener('touchmove', handleTouchMove)
              document.removeEventListener('touchend', handleTouchEnd)
            }
            
            document.addEventListener('touchmove', handleTouchMove)
            document.addEventListener('touchend', handleTouchEnd)
          }}
        >
          {/* Avatar/Icon */}
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {conversation.title.charAt(0).toUpperCase()}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {isPersistentConversation(conversation) && conversation.is_favorite && (
                <Star className="h-4 w-4 fill-blue-500 text-blue-500 flex-shrink-0" />
              )}
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                {conversation.title}
              </p>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {modelDisplay}
              </p>
              <span className="text-gray-400">•</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(conversation.updated_at), 'h:mm a')}
              </p>
            </div>
          </div>
          
          {/* Chevron indicator */}
          <div className="text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <ConversationListSkeleton />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex-1 ios-table-view bg-gray-50 dark:bg-gray-900 ios-scroll-container">
      {/* New Conversation Button */}
      {mobileFeatures.iosNavigation && (
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              createPendingConversation("New Conversation", "", "")
              onCreateNew?.()
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 ios-button-primary bg-blue-500 text-white rounded-lg font-medium ios-button-touch ios-touch-highlight"
          >
            <Plus className="h-5 w-5" />
            <span>New Chat</span>
          </button>
        </div>
      )}

      {conversations.length === 0 ? (
        <EmptyState
          type="no-conversations"
          title="No conversations yet"
          description="Start a new conversation to begin chatting with AI"
          action={{
            label: "Start New Chat",
            onClick: () => {
              createPendingConversation("New Conversation", "", "")
              onCreateNew?.()
            },
          }}
          className="h-full"
        />
      ) : (
        <div className="overflow-y-auto ios-scroll-container" role="main" aria-label="Conversations">
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <div role="group" aria-labelledby="favorites-heading">
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 fill-blue-500 text-blue-500" aria-hidden="true" />
                  <h2 
                    id="favorites-heading"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                    role="heading"
                    aria-level={2}
                  >
                    Favorites
                  </h2>
                </div>
              </div>
              <div>
                {favorites.map(renderConversation)}
              </div>
            </div>
          )}

          {/* Regular Conversations by Date */}
          {regularByDate.map(([dateKey, convs]) => (
            <div key={dateKey}>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {dateKey}
                </h2>
              </div>
              <div>
                {convs.map(renderConversation)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Delete Conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to delete "{confirmDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-blue-500 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConversation(confirmDelete.id)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Background tap to dismiss swipe */}
      {swipedConversation && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSwipedConversation(null)}
        />
      )}
    </div>
  )
}