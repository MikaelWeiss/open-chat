import { mobileFeatures } from './featureFlags'

export interface AccessibilityOptions {
  announcement?: string
  role?: string
  label?: string
  hint?: string
  liveRegion?: 'polite' | 'assertive' | 'off'
}

export const accessibility = {
  // Announce text for screen readers
  announce: (text: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!mobileFeatures.iosNavigation) return
    
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = text
    
    document.body.appendChild(announcement)
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  },

  // Set accessibility attributes on an element
  setAttributes: (element: HTMLElement, options: AccessibilityOptions) => {
    if (options.role) {
      element.setAttribute('role', options.role)
    }
    
    if (options.label) {
      element.setAttribute('aria-label', options.label)
    }
    
    if (options.hint) {
      element.setAttribute('aria-describedby', options.hint)
    }
    
    if (options.liveRegion) {
      element.setAttribute('aria-live', options.liveRegion)
    }
  },

  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'accessible') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Check if user prefers high contrast
  prefersHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches
  },

  // Focus management for mobile navigation
  focusManagement: {
    // Store the previously focused element
    previousFocus: null as HTMLElement | null,
    
    // Set focus to an element and store previous focus
    setFocus: (element: HTMLElement | null) => {
      if (!element) return
      
      accessibility.focusManagement.previousFocus = document.activeElement as HTMLElement
      element.focus()
    },
    
    // Return focus to previously focused element
    returnFocus: () => {
      if (accessibility.focusManagement.previousFocus) {
        accessibility.focusManagement.previousFocus.focus()
        accessibility.focusManagement.previousFocus = null
      }
    },
    
    // Trap focus within a container (useful for modals)
    trapFocus: (container: HTMLElement) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstFocusable = focusableElements[0] as HTMLElement
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement
      
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return
        
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable.focus()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable.focus()
          }
        }
      }
      
      container.addEventListener('keydown', handleTabKey)
      firstFocusable?.focus()
      
      return () => container.removeEventListener('keydown', handleTabKey)
    }
  }
}

// iOS-specific accessibility helpers
export const iosAccessibility = {
  // Simulate iOS haptic feedback (visual feedback for web)
  hapticFeedback: (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!mobileFeatures.hapticFeedback) return
    
    // In a real iOS environment, this would trigger actual haptic feedback
    // For web, we provide visual feedback
    const feedback = document.createElement('div')
    feedback.className = `haptic-${type}`
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 2px;
      background: var(--ios-blue);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      animation: ios-haptic-feedback 0.15s ease-out;
    `
    
    document.body.appendChild(feedback)
    setTimeout(() => document.body.removeChild(feedback), 150)
  },

  // Announce dynamic content changes for VoiceOver
  announceChange: (message: string) => {
    accessibility.announce(message, 'assertive')
  },

  // Set up proper heading hierarchy for VoiceOver navigation
  setHeadingLevel: (element: HTMLElement, level: 1 | 2 | 3 | 4 | 5 | 6) => {
    element.setAttribute('role', 'heading')
    element.setAttribute('aria-level', level.toString())
  }
}