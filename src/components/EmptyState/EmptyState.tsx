import { useEffect, useState } from 'react'
import clsx from 'clsx'

interface EmptyStateProps {
  type: 'no-conversations' | 'empty-chat' | 'no-results' | 'error' | 'no-providers'
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

// unDraw SVG illustrations as React components
// These are simplified versions - you can get the full SVGs from undraw.co

const NoConversationsIllustration = ({ color = '#6366f1' }: { color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="w-full h-full">
    <g opacity="0.8">
      <circle cx="200" cy="150" r="80" fill={color} opacity="0.1" />
      <rect x="150" y="120" width="100" height="60" rx="8" fill={color} opacity="0.2" />
      <rect x="160" y="135" width="60" height="4" rx="2" fill={color} opacity="0.4" />
      <rect x="160" y="145" width="80" height="4" rx="2" fill={color} opacity="0.3" />
      <rect x="160" y="155" width="40" height="4" rx="2" fill={color} opacity="0.3" />
      <circle cx="260" cy="140" r="20" fill={color} opacity="0.15" />
      <path d="M250 140 L265 140 M257.5 132 L257.5 148" stroke={color} strokeWidth="2" opacity="0.4" />
    </g>
  </svg>
)

const EmptyChatIllustration = ({ color = '#6366f1' }: { color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="w-full h-full">
    <g opacity="0.8">
      <rect x="100" y="80" width="80" height="50" rx="8" fill={color} opacity="0.15" />
      <rect x="110" y="90" width="40" height="4" rx="2" fill={color} opacity="0.3" />
      <rect x="110" y="100" width="60" height="4" rx="2" fill={color} opacity="0.25" />
      <rect x="110" y="110" width="30" height="4" rx="2" fill={color} opacity="0.25" />
      
      <rect x="220" y="100" width="80" height="50" rx="8" fill={color} opacity="0.2" />
      <rect x="230" y="110" width="40" height="4" rx="2" fill={color} opacity="0.35" />
      <rect x="230" y="120" width="60" height="4" rx="2" fill={color} opacity="0.3" />
      <rect x="230" y="130" width="30" height="4" rx="2" fill={color} opacity="0.3" />
      
      <rect x="140" y="170" width="120" height="50" rx="8" fill={color} opacity="0.1" />
      <circle cx="160" cy="195" r="12" fill={color} opacity="0.2" />
      <rect x="180" y="185" width="60" height="4" rx="2" fill={color} opacity="0.25" />
      <rect x="180" y="195" width="40" height="4" rx="2" fill={color} opacity="0.2" />
      <rect x="180" y="205" width="50" height="4" rx="2" fill={color} opacity="0.2" />
    </g>
  </svg>
)

const NoResultsIllustration = ({ color = '#6366f1' }: { color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="w-full h-full">
    <g opacity="0.8">
      <circle cx="200" cy="130" r="60" fill="none" stroke={color} strokeWidth="3" opacity="0.2" />
      <line x1="244" y1="174" x2="280" y2="210" stroke={color} strokeWidth="3" opacity="0.3" strokeLinecap="round" />
      <circle cx="200" cy="130" r="50" fill={color} opacity="0.05" />
      <path d="M180 130 Q200 110 220 130" stroke={color} strokeWidth="2" fill="none" opacity="0.3" />
      <circle cx="185" cy="120" r="3" fill={color} opacity="0.4" />
      <circle cx="215" cy="120" r="3" fill={color} opacity="0.4" />
      <path d="M180 145 Q200 155 220 145" stroke={color} strokeWidth="2" fill="none" opacity="0.3" />
    </g>
  </svg>
)

const ErrorIllustration = ({ color = '#ef4444' }: { color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="w-full h-full">
    <g opacity="0.8">
      <path d="M200 80 L260 180 L140 180 Z" fill={color} opacity="0.15" />
      <path d="M200 90 L250 170 L150 170 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
      <line x1="200" y1="120" x2="200" y2="140" stroke={color} strokeWidth="3" opacity="0.5" strokeLinecap="round" />
      <circle cx="200" cy="155" r="3" fill={color} opacity="0.5" />
      <rect x="160" y="200" width="80" height="30" rx="6" fill={color} opacity="0.1" />
      <rect x="170" y="210" width="60" height="4" rx="2" fill={color} opacity="0.3" />
      <rect x="170" y="218" width="40" height="4" rx="2" fill={color} opacity="0.25" />
    </g>
  </svg>
)

const NoProvidersIllustration = ({ color = '#6366f1' }: { color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="w-full h-full">
    <g opacity="0.8">
      <rect x="150" y="100" width="100" height="100" rx="12" fill="none" stroke={color} strokeWidth="2" opacity="0.2" strokeDasharray="8 4" />
      <circle cx="200" cy="150" r="30" fill={color} opacity="0.1" />
      <path d="M185 150 L200 150 L200 135" stroke={color} strokeWidth="2" opacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="200" cy="160" r="2" fill={color} opacity="0.4" />
      <rect x="130" y="80" width="30" height="30" rx="6" fill={color} opacity="0.15" />
      <rect x="240" y="80" width="30" height="30" rx="6" fill={color} opacity="0.15" />
      <rect x="130" y="190" width="30" height="30" rx="6" fill={color} opacity="0.15" />
      <rect x="240" y="190" width="30" height="30" rx="6" fill={color} opacity="0.15" />
      <path d="M160 95 L185 125 M240 95 L215 125 M160 205 L185 175 M240 205 L215 175" stroke={color} strokeWidth="1.5" opacity="0.2" />
    </g>
  </svg>
)

const illustrations = {
  'no-conversations': NoConversationsIllustration,
  'empty-chat': EmptyChatIllustration,
  'no-results': NoResultsIllustration,
  'error': ErrorIllustration,
  'no-providers': NoProvidersIllustration,
}

export default function EmptyState({ type, title, description, action, className }: EmptyStateProps) {
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  useEffect(() => {
    // Check if we're in dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    
    checkDarkMode()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    // Get the primary color from CSS variables
    const computedStyle = getComputedStyle(document.documentElement)
    const primaryHsl = computedStyle.getPropertyValue('--primary').trim()
    
    // Convert HSL to hex for the SVG
    if (primaryHsl) {
      const [h, s, l] = primaryHsl.split(' ').map(v => parseFloat(v))
      // Simple HSL to hex conversion (approximate)
      const hslToHex = (h: number, s: number, l: number) => {
        const hue = h / 360
        const sat = s / 100
        const light = l / 100
        
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1
          if (t > 1) t -= 1
          if (t < 1/6) return p + (q - p) * 6 * t
          if (t < 1/2) return q
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
          return p
        }
        
        const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat
        const p = 2 * light - q
        
        const r = Math.round(hue2rgb(p, q, hue + 1/3) * 255)
        const g = Math.round(hue2rgb(p, q, hue) * 255)
        const b = Math.round(hue2rgb(p, q, hue - 1/3) * 255)
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      }
      
      try {
        const hex = hslToHex(h, s, l)
        setPrimaryColor(hex)
      } catch (e) {
        console.error('Failed to convert HSL to hex:', e)
      }
    }
    
    return () => observer.disconnect()
  }, [])
  
  const Illustration = illustrations[type]
  // Use a brighter color in dark mode to ensure visibility  
  const illustrationColor = type === 'error' ? '#ef4444' : (isDarkMode ? '#c084fc' : primaryColor)
  
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center p-8 text-center',
      'animate-in fade-in duration-500',
      className
    )}>
      <div className="w-64 h-48 mb-6 opacity-80 hover:opacity-100 transition-opacity duration-300">
        <Illustration color={illustrationColor} />
      </div>
      
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium text-sm',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 hover:scale-105',
            'transition-all duration-200',
            'shadow-sm hover:shadow-md',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}