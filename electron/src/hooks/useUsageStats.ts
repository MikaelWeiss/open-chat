import { useState, useEffect } from 'react'
import type { Message } from '@/types/electron'
import { useConversationStore } from '@/stores/conversationStore'

export interface UsageStats {
  totalTokens: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalCost: number
  loading: boolean
}

export function useUsageStats(messages: Message[]): UsageStats {
  const { selectedConversation: currentConversation } = useConversationStore()
  const [stats, setStats] = useState<UsageStats>({
    totalTokens: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalCost: 0,
    loading: false
  })

  useEffect(() => {
    async function calculateStats() {
      if (!messages.length || !currentConversation) {
        setStats({
          totalTokens: 0,
          totalPromptTokens: 0,
          totalCompletionTokens: 0,
          totalCost: 0,
          loading: false
        })
        return
      }

      setStats(prev => ({ ...prev, loading: true }))

      try {
        const result = await window.electronAPI.llm.calculateUsage({
          provider: currentConversation.provider,
          model: currentConversation.model,
          messages
        })

        setStats({
          totalTokens: result.usage.totalTokens,
          totalPromptTokens: result.usage.promptTokens,
          totalCompletionTokens: result.usage.completionTokens,
          totalCost: result.cost,
          loading: false
        })
      } catch (error) {
        console.error('Failed to calculate usage stats:', error)
        setStats({
          totalTokens: 0,
          totalPromptTokens: 0,
          totalCompletionTokens: 0,
          totalCost: 0,
          loading: false
        })
      }
    }

    calculateStats()
  }, [messages, currentConversation?.provider, currentConversation?.model])

  return stats
}