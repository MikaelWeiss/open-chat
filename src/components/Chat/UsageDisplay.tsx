import { DollarSign, Zap } from 'lucide-react'
import { type Message } from '../../shared/messageStore'

interface UsageStats {
  totalTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  totalReasoningTokens: number
  totalCachedTokens: number
  totalCost: number
  messageCount: number
}

interface UsageDisplayProps {
  usage?: UsageStats
  showPricing?: boolean
  className?: string
}

export default function UsageDisplay({ usage, showPricing = true, className = '' }: UsageDisplayProps) {
  if (!usage || (usage.totalTokens === 0 && (usage.totalCost === 0 || !showPricing))) {
    return null
  }

  const { totalTokens, totalInputTokens, totalOutputTokens, totalCost } = usage

  return (
    <div className={`p-3 bg-secondary/50 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{totalTokens.toLocaleString()}</span>
            <span className="text-muted-foreground">tokens</span>
          </div>
          
          {totalCost > 0 && showPricing && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="font-medium">${totalCost.toFixed(4)}</span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {totalInputTokens > 0 && totalOutputTokens > 0 && (
            <span>
              {totalInputTokens.toLocaleString()} in • {totalOutputTokens.toLocaleString()} out
            </span>
          )}
        </div>
      </div>
    </div>
  )
}