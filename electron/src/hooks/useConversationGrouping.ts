import { useMemo } from 'react'
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'
import type { Conversation } from '@/types/electron'

interface ConversationGroups {
  starredConversations: Conversation[]
  regularByDate: Array<[string, Conversation[]]>
}

interface UseConversationGroupingReturn {
  getConversationsByDate: () => ConversationGroups
  getDateLabel: (dateString: string) => string
}

export function useConversationGrouping(conversations: Conversation[]): UseConversationGroupingReturn {
  const getConversationsByDate = useMemo(() => () => {
    // Separate starred and non-starred conversations
    const starredConversations = conversations.filter(conv => conv.starred)
    const regularConversations = conversations.filter(conv => !conv.starred)
    
    // Group regular conversations by date
    const grouped = new Map<string, Conversation[]>()
    
    regularConversations.forEach(conv => {
      const dateKey = new Date(conv.updatedAt).toDateString()
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(conv)
    })
    
    const regularByDate = Array.from(grouped.entries()).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime()
    })
    
    return { starredConversations, regularByDate }
  }, [conversations])

  const getDateLabel = useMemo(() => (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isThisWeek(date)) return format(date, 'EEEE')
    if (isThisMonth(date)) return format(date, 'MMMM d')
    return format(date, 'MMMM d, yyyy')
  }, [])

  return {
    getConversationsByDate,
    getDateLabel
  }
}