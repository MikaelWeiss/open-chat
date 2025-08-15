export class GradientAnimation {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number | null = null
  private time = 0
  private gradientPositions: Array<{ x: number; y: number; radius: number; hue: number }> = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this.ctx = ctx

    this.initializeGradients()
    this.resize()
    window.addEventListener('resize', this.resize)
  }

  private initializeGradients() {
    this.gradientPositions = [
      { x: 0.8, y: 0.2, radius: 0.4, hue: 169 }, // Primary teal (logo color)
      { x: 0.2, y: 0.7, radius: 0.5, hue: 259 }, // Purple accent
      { x: 0.5, y: 0.5, radius: 0.3, hue: 169 }, // Center teal
      { x: 0.9, y: 0.8, radius: 0.35, hue: 200 }, // Cyan blue
    ]
  }

  private resize = () => {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = this.canvas.offsetWidth * dpr
    this.canvas.height = this.canvas.offsetHeight * dpr
    this.ctx.scale(dpr, dpr)
  }

  start() {
    if (this.animationId) return
    this.animate()
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate = () => {
    this.time += 0.01
    this.draw()
    this.animationId = requestAnimationFrame(this.animate)
  }

  private draw() {
    const width = this.canvas.offsetWidth
    const height = this.canvas.offsetHeight

    // Create dark base gradient (matching app background)
    const baseGradient = this.ctx.createLinearGradient(0, 0, width, height)
    baseGradient.addColorStop(0, 'hsl(222, 84%, 4.9%)') // Deep navy from dark theme
    baseGradient.addColorStop(1, 'hsl(220, 43%, 7%)') // Slightly lighter navy

    // Fill with base gradient
    this.ctx.fillStyle = baseGradient
    this.ctx.fillRect(0, 0, width, height)

    // Draw animated gradient blobs
    this.gradientPositions.forEach((pos, index) => {
      const animSpeed = 0.5 + index * 0.15
      const xOffset = Math.sin(this.time * animSpeed) * 0.1
      const yOffset = Math.cos(this.time * animSpeed * 0.8) * 0.1
      
      const x = (pos.x + xOffset) * width
      const y = (pos.y + yOffset) * height
      const radius = pos.radius * Math.min(width, height) * (1 + Math.sin(this.time * 0.8 + index) * 0.2)

      // Create radial gradient for each blob
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius)
      
      // Adjust opacity and saturation based on animation
      const opacity = 0.15 + Math.sin(this.time * 1.2 + index * Math.PI / 2) * 0.05
      const saturation = 100 - (Math.sin(this.time * 1.1 + index) * 20)
      
      gradient.addColorStop(0, `hsla(${pos.hue}, ${saturation}%, 37%, ${opacity})`)
      gradient.addColorStop(0.5, `hsla(${pos.hue}, ${saturation}%, 45%, ${opacity * 0.5})`)
      gradient.addColorStop(1, 'transparent')

      this.ctx.globalCompositeOperation = 'screen'
      this.ctx.fillStyle = gradient
      this.ctx.fillRect(0, 0, width, height)
    })

    // Add subtle light sweep effect
    const sweepX = (Math.sin(this.time * 0.3) + 1) * width * 0.5
    const sweepGradient = this.ctx.createLinearGradient(
      sweepX - width * 0.3, 
      0, 
      sweepX + width * 0.3, 
      height
    )
    sweepGradient.addColorStop(0, 'transparent')
    sweepGradient.addColorStop(0.5, 'hsla(169, 100%, 50%, 0.03)') // Very subtle teal highlight
    sweepGradient.addColorStop(1, 'transparent')

    this.ctx.globalCompositeOperation = 'overlay'
    this.ctx.fillStyle = sweepGradient
    this.ctx.fillRect(0, 0, width, height)

    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over'
  }

  updateTheme(_isDark: boolean) {
    // Theme is already dark-focused, but we can adjust if needed
    // This method is here for compatibility with IntroAnimation.tsx
  }

  destroy() {
    this.stop()
    window.removeEventListener('resize', this.resize)
  }
}