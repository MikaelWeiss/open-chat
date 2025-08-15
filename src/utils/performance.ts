import { isMobile } from './platformDetection'

export const performance = {
  // Debounce function for performance-critical operations
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }
  },

  // Throttle function for scroll and resize events
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // Lazy loading for images and heavy components
  lazyLoad: {
    // Intersection Observer for lazy loading
    observer: null as IntersectionObserver | null,
    
    // Initialize lazy loading
    init: () => {
      if (!performance.lazyLoad.observer) {
        performance.lazyLoad.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const element = entry.target as HTMLElement
                const src = element.dataset.src
                const component = element.dataset.component
                
                if (src) {
                  (element as HTMLImageElement).src = src
                  element.removeAttribute('data-src')
                }
                
                if (component) {
                  element.setAttribute('data-load-component', 'true')
                }
                
                performance.lazyLoad.observer?.unobserve(element)
              }
            })
          },
          {
            rootMargin: '50px',
            threshold: 0.1
          }
        )
      }
    },
    
    // Observe an element for lazy loading
    observe: (element: HTMLElement) => {
      performance.lazyLoad.init()
      performance.lazyLoad.observer?.observe(element)
    }
  },

  // Memory management
  memory: {
    // Clean up unused objects and references
    cleanup: () => {
      // Force garbage collection if available (dev mode)
      if ((window as any).gc) {
        (window as any).gc()
      }
    },
    
    // Monitor memory usage (development only)
    monitor: () => {
      if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
        const memInfo = (performance as any).memory
        console.log('Memory usage:', {
          used: Math.round(memInfo.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memInfo.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memInfo.jsHeapSizeLimit / 1048576) + ' MB'
        })
      }
    }
  },

  // Mobile-specific optimizations
  mobile: {
    // Optimize for mobile viewport
    optimizeViewport: () => {
      if (!isMobile()) return
      
      // Prevent zoom on input focus (iOS)
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        )
      }
      
      // Optimize touch events
      document.body.style.touchAction = 'pan-y'
      
      // Improve scrolling performance
      document.body.style.overflowX = 'hidden'
      ;(document.body.style as any).webkitOverflowScrolling = 'touch'
    },

    // Reduce bundle size for mobile
    conditionalImport: async <T>(
      mobileImport: () => Promise<T>,
      desktopImport: () => Promise<T>
    ): Promise<T> => {
      return isMobile() ? mobileImport() : desktopImport()
    },

    // Optimize images for mobile
    optimizeImage: (src: string, quality: number = 80): string => {
      if (!isMobile()) return src
      
      // Add quality parameter for mobile images
      const url = new URL(src, window.location.href)
      url.searchParams.set('q', quality.toString())
      url.searchParams.set('w', window.innerWidth.toString())
      return url.toString()
    },

    // Battery-aware features
    adaptToBattery: async () => {
      if (!isMobile()) return { level: 1, charging: true }
      
      try {
        const battery = await (navigator as any).getBattery()
        return {
          level: battery.level,
          charging: battery.charging
        }
      } catch {
        return { level: 1, charging: true }
      }
    }
  },

  // Virtual scrolling for long lists
  virtualScrolling: {
    // Calculate visible items for virtual scrolling
    calculateVisibleItems: (
      scrollTop: number,
      containerHeight: number,
      itemHeight: number,
      totalItems: number,
      overscan: number = 5
    ) => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
      const endIndex = Math.min(
        totalItems - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      )
      
      return { startIndex, endIndex, visibleCount: endIndex - startIndex + 1 }
    }
  },

  // Animation optimizations
  animation: {
    // Use requestAnimationFrame for smooth animations
    animate: (callback: (progress: number) => void, duration: number = 300) => {
      const startTime = window.performance.now()
      
      const animateFrame = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        callback(progress)
        
        if (progress < 1) {
          requestAnimationFrame(animateFrame)
        }
      }
      
      requestAnimationFrame(animateFrame)
    },

    // Optimize CSS animations for mobile
    optimizeForMobile: () => {
      if (!isMobile()) return
      
      // Use transform instead of changing layout properties
      const style = document.createElement('style')
      style.textContent = `
        .mobile-optimized-animation {
          will-change: transform, opacity;
          transform: translateZ(0); /* Force hardware acceleration */
        }
      `
      document.head.appendChild(style)
    }
  }
}

// Auto-initialize performance optimizations
if (typeof window !== 'undefined') {
  // Mobile viewport optimization
  performance.mobile.optimizeViewport()
  
  // Animation optimization
  performance.animation.optimizeForMobile()
  
  // Memory monitoring in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(performance.memory.monitor, 10000) // Every 10 seconds
  }
}