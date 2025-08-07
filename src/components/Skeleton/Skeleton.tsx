import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  animation?: 'pulse' | 'wave' | 'none'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'text',
  animation = 'pulse',
  width,
  height
}: SkeletonProps) {
  const baseClasses = 'bg-muted/50 overflow-hidden relative'
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: ''
  }
  
  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  }
  
  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  )
}

export function ConversationSkeleton() {
  return (
    <div className="px-4 py-3 space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Skeleton width={16} height={16} variant="circular" />
        <Skeleton className="flex-1" height={16} />
      </div>
      <div className="flex items-center gap-2 pl-6">
        <Skeleton width="60%" height={12} />
        <Skeleton width={50} height={12} />
      </div>
    </div>
  )
}

export function ConversationListSkeleton() {
  return (
    <div className="space-y-1">
      {/* Date header skeleton */}
      <div className="px-4 py-2 sticky top-0 bg-secondary/70 backdrop-blur-lg">
        <Skeleton width={80} height={12} />
      </div>
      
      {/* Conversation skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <ConversationSkeleton key={i} />
      ))}
      
      {/* Another date header */}
      <div className="px-4 py-2 sticky top-0 bg-secondary/70 backdrop-blur-lg">
        <Skeleton width={100} height={12} />
      </div>
      
      {/* More conversation skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <ConversationSkeleton key={`second-${i}`} />
      ))}
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 min-w-0 animate-in fade-in duration-300">
      <Skeleton 
        variant="rectangular" 
        width={32} 
        height={32} 
        className="flex-shrink-0"
      />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-baseline gap-2">
          <Skeleton width={60} height={16} />
          <Skeleton width={50} height={12} />
        </div>
        <div className="space-y-2">
          <Skeleton width="90%" height={14} />
          <Skeleton width="75%" height={14} />
          <Skeleton width="80%" height={14} />
        </div>
      </div>
    </div>
  )
}