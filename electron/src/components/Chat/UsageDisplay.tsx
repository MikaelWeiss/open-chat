import { DollarSign, Zap } from 'lucide-react'
import type { Message } from '@/types/electron'
import { useUsageStats } from '@/hooks/useUsageStats'
import { useSettingsStore } from '@/stores/settingsStore'

interface UsageDisplayProps {
  messages: Message[]
  className?: string
}

export default function UsageDisplay({ messages, className = '' }: UsageDisplayProps) {
  const { totalTokens, totalCost, totalPromptTokens, totalCompletionTokens } = useUsageStats(messages)
  const { settings } = useSettingsStore()

  if (totalTokens === 0 && (totalCost === 0 || !settings?.showPricing)) {
    return null
  }

  return (
    <div className={`p-3 bg-secondary/50 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{totalTokens.toLocaleString()}</span>
            <span className="text-muted-foreground">tokens</span>
          </div>
          
          {totalCost > 0 && settings?.showPricing && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="font-medium">${totalCost.toFixed(4)}</span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {totalPromptTokens > 0 && totalCompletionTokens > 0 && (
            <span>
              {totalPromptTokens.toLocaleString()} in • {totalCompletionTokens.toLocaleString()} out
            </span>
          )}
        </div>
      </div>
    </div>
  )
}