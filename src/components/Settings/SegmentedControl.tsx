import clsx from 'clsx'
import { ReactNode } from 'react'

interface SegmentedControlOption {
  value: string
  label: string
  icon?: ReactNode
}

interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = ''
}: SegmentedControlProps) {
  return (
    <div className={clsx(
      "flex p-1 m-1 bg-secondary rounded-lg border border-border w-full",
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={clsx(
            "flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium flex-1",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          {option.icon && (
            <span className="w-4 h-4">
              {option.icon}
            </span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  )
}