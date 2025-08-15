// Mobile Testing Helpers for Development

export const mobileTestingHelpers = {
  // Simulate different mobile device viewports
  simulateDevice: (device: 'iPhone SE' | 'iPhone 12' | 'iPhone 15 Pro Max' | 'iPad') => {
    const devices = {
      'iPhone SE': { width: 375, height: 667, ratio: 2 },
      'iPhone 12': { width: 390, height: 844, ratio: 3 },
      'iPhone 15 Pro Max': { width: 430, height: 932, ratio: 3 },
      'iPad': { width: 768, height: 1024, ratio: 2 }
    }
    
    const config = devices[device]
    if (config) {
      document.documentElement.style.setProperty('--viewport-width', `${config.width}px`)
      document.documentElement.style.setProperty('--viewport-height', `${config.height}px`)
      document.documentElement.style.setProperty('--device-pixel-ratio', config.ratio.toString())
      
      // Update meta viewport
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 
          `width=${config.width}, initial-scale=${1/config.ratio}, maximum-scale=${1/config.ratio}, user-scalable=no`
        )
      }
    }
  },

  // Simulate iOS safe areas for testing
  simulateSafeAreas: (top: number = 47, bottom: number = 34) => {
    document.documentElement.style.setProperty('--safe-area-inset-top', `${top}px`)
    document.documentElement.style.setProperty('--safe-area-inset-bottom', `${bottom}px`)
    document.documentElement.style.setProperty('--safe-area-inset-left', '0px')
    document.documentElement.style.setProperty('--safe-area-inset-right', '0px')
  },

  // Test touch interactions
  simulateTouch: {
    tap: (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const touchStart = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: centerX,
          clientY: centerY,
          radiusX: 1,
          radiusY: 1,
          rotationAngle: 0,
          force: 1
        })]
      })
      
      const touchEnd = new TouchEvent('touchend', {
        touches: []
      })
      
      element.dispatchEvent(touchStart)
      setTimeout(() => element.dispatchEvent(touchEnd), 100)
    },

    swipe: (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down', distance: number = 100) => {
      const rect = element.getBoundingClientRect()
      const startX = rect.left + rect.width / 2
      const startY = rect.top + rect.height / 2
      
      let endX = startX
      let endY = startY
      
      switch (direction) {
        case 'left': endX = startX - distance; break
        case 'right': endX = startX + distance; break
        case 'up': endY = startY - distance; break
        case 'down': endY = startY + distance; break
      }
      
      const touchStart = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: startX,
          clientY: startY,
          radiusX: 1,
          radiusY: 1,
          rotationAngle: 0,
          force: 1
        })]
      })
      
      const touchMove = new TouchEvent('touchmove', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: endX,
          clientY: endY,
          radiusX: 1,
          radiusY: 1,
          rotationAngle: 0,
          force: 1
        })]
      })
      
      const touchEnd = new TouchEvent('touchend', {
        touches: []
      })
      
      element.dispatchEvent(touchStart)
      setTimeout(() => element.dispatchEvent(touchMove), 50)
      setTimeout(() => element.dispatchEvent(touchEnd), 200)
    }
  },

  // Test iOS-specific features
  testIOSFeatures: {
    // Test safe area handling
    testSafeAreas: () => {
      const testCases = [
        { name: 'iPhone X/11/12/13/14', top: 47, bottom: 34 },
        { name: 'iPhone 14 Pro/Pro Max', top: 59, bottom: 34 },
        { name: 'iPhone SE', top: 20, bottom: 0 },
        { name: 'iPad', top: 24, bottom: 0 }
      ]
      
      testCases.forEach((testCase, index) => {
        setTimeout(() => {
          console.log(`Testing safe areas for ${testCase.name}`)
          mobileTestingHelpers.simulateSafeAreas(testCase.top, testCase.bottom)
        }, index * 2000)
      })
    },

    // Test Dynamic Type scaling
    testDynamicType: () => {
      const sizes = ['Small', 'Medium', 'Large', 'Extra Large', 'Extra Extra Large']
      const scales = [0.8, 1.0, 1.2, 1.4, 1.6]
      
      sizes.forEach((size, index) => {
        setTimeout(() => {
          console.log(`Testing Dynamic Type: ${size}`)
          document.documentElement.style.fontSize = `${16 * scales[index]}px`
        }, index * 1000)
      })
    },

    // Test accessibility features
    testAccessibility: () => {
      console.log('Testing accessibility features...')
      
      // High contrast mode
      document.documentElement.setAttribute('data-high-contrast', 'true')
      console.log('High contrast mode enabled')
      
      setTimeout(() => {
        document.documentElement.removeAttribute('data-high-contrast')
        console.log('High contrast mode disabled')
        
        // Reduced motion
        document.documentElement.style.setProperty('--animation-duration', '0.01ms')
        console.log('Reduced motion enabled')
        
        setTimeout(() => {
          document.documentElement.style.removeProperty('--animation-duration')
          console.log('Reduced motion disabled')
        }, 2000)
      }, 2000)
    }
  },

  // Performance testing
  testPerformance: {
    // Measure scroll performance
    measureScrollPerformance: (container: HTMLElement) => {
      let frameCount = 0
      let startTime = performance.now()
      
      const measureFrame = () => {
        frameCount++
        const currentTime = performance.now()
        
        if (currentTime - startTime >= 1000) {
          console.log(`Scroll FPS: ${frameCount}`)
          frameCount = 0
          startTime = currentTime
        }
        
        requestAnimationFrame(measureFrame)
      }
      
      container.addEventListener('scroll', measureFrame)
      return () => container.removeEventListener('scroll', measureFrame)
    },

    // Measure touch response time
    measureTouchResponse: (element: HTMLElement) => {
      let touchStartTime = 0
      
      element.addEventListener('touchstart', () => {
        touchStartTime = performance.now()
      })
      
      element.addEventListener('click', () => {
        const responseTime = performance.now() - touchStartTime
        console.log(`Touch response time: ${responseTime.toFixed(2)}ms`)
      })
    }
  },

  // Network simulation for mobile testing
  simulateNetworkConditions: (condition: 'fast-3g' | 'slow-3g' | 'offline') => {
    const conditions = {
      'fast-3g': { latency: 562.5, download: 1600, upload: 750 },
      'slow-3g': { latency: 2000, download: 500, upload: 500 },
      'offline': { latency: 0, download: 0, upload: 0 }
    }
    
    const config = conditions[condition]
    console.log(`Simulating ${condition} network conditions:`, config)
    
    // Note: This would need to be implemented at the browser level
    // or using browser DevTools. This is just for logging purposes.
  }
}

// Development-only: Add testing controls to the page
if (process.env.NODE_ENV === 'development') {
  // Add a testing panel
  const addTestingPanel = () => {
    const panel = document.createElement('div')
    panel.id = 'mobile-testing-panel'
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 200px;
    `
    
    panel.innerHTML = `
      <div>Mobile Testing</div>
      <button onclick="mobileTestingHelpers.simulateDevice('iPhone SE')">iPhone SE</button>
      <button onclick="mobileTestingHelpers.simulateDevice('iPhone 15 Pro Max')">iPhone 15 Pro Max</button>
      <button onclick="mobileTestingHelpers.testIOSFeatures.testSafeAreas()">Test Safe Areas</button>
      <button onclick="mobileTestingHelpers.testIOSFeatures.testAccessibility()">Test A11y</button>
    `
    
    panel.querySelectorAll('button').forEach(button => {
      button.style.cssText = `
        display: block;
        width: 100%;
        margin: 2px 0;
        padding: 4px;
        background: #333;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
      `
    })
    
    document.body.appendChild(panel)
  }
  
  // Add testing panel when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTestingPanel)
  } else {
    addTestingPanel()
  }
}

// Export for global access in development
if (process.env.NODE_ENV === 'development') {
  (window as any).mobileTestingHelpers = mobileTestingHelpers
}