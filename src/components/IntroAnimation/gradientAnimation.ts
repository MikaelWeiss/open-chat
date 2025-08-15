interface WaveLayer {
  points: { x: number; y: number }[]
  colors: string[]
  speed: number
  amplitude: number
  frequency: number
  phase: number
  opacity: number
}

export class GradientAnimation {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private layers: WaveLayer[]
  private animationId: number | null = null
  private time: number = 0
  private isDarkTheme: boolean

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.isDarkTheme = document.documentElement.classList.contains('dark')
    
    // Initialize wave layers with app colors
    this.layers = this.createWaveLayers()
    
    // Set canvas size
    this.resizeCanvas()
    
    // Add resize listener
    window.addEventListener('resize', this.resizeCanvas)
  }

  private createWaveLayers(): WaveLayer[] {
    // App color palette - teal primary with blue/purple accents
    const colorSets = [
      // Primary teal to blue gradients (matching app's #00BF9C)
      ['#00BF9C', '#00A890', '#0099A8'],
      ['#00BF9C', '#00B3B8', '#00A5C7'],
      ['#0099A8', '#0080B3', '#0066CC'],
      // Blue to purple transitions
      ['#0066CC', '#4466DD', '#6655EE'],
      ['#4466DD', '#6644CC', '#8833BB'],
      // Accent layers with transparency
      ['#00BF9C', '#3399FF', '#6666FF'],
    ]

    return colorSets.map((colors, index) => ({
      points: [],
      colors,
      speed: 0.0002 + Math.random() * 0.0001, // Very slow, smooth movement
      amplitude: 200 + index * 40, // Large, varying wave heights
      frequency: 0.001 + index * 0.0003, // Low frequency for smooth waves
      phase: (index * Math.PI) / 4, // Offset phases
      opacity: 0.12 + (index * 0.03), // Subtle layering
    }))
  }

  private resizeCanvas = () => {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  private drawWave(layer: WaveLayer) {
    const { amplitude, frequency, phase, speed, colors, opacity } = layer
    const width = this.canvas.width
    const height = this.canvas.height
    
    this.ctx.save()
    this.ctx.globalAlpha = opacity
    
    // Create path for organic wave shape
    this.ctx.beginPath()
    
    // Start from bottom left
    this.ctx.moveTo(-100, height + 100)
    
    // Create flowing wave using multiple sine waves
    for (let x = -100; x <= width + 100; x += 10) {
      const y1 = Math.sin(x * frequency + this.time * speed + phase) * amplitude
      const y2 = Math.sin(x * frequency * 1.8 + this.time * speed * 0.7 + phase) * amplitude * 0.4
      const y3 = Math.sin(x * frequency * 0.3 + this.time * speed * 1.3 + phase) * amplitude * 0.6
      
      const y = height * 0.5 + y1 + y2 + y3
      
      if (x === -100) {
        this.ctx.lineTo(-100, y)
      } else {
        // Smooth bezier curves for organic flow
        const prevX = x - 10
        const prevY1 = Math.sin(prevX * frequency + this.time * speed + phase) * amplitude
        const prevY2 = Math.sin(prevX * frequency * 1.8 + this.time * speed * 0.7 + phase) * amplitude * 0.4
        const prevY3 = Math.sin(prevX * frequency * 0.3 + this.time * speed * 1.3 + phase) * amplitude * 0.6
        const prevY = height * 0.5 + prevY1 + prevY2 + prevY3
        
        const cpx = prevX + 5
        const cpy = (prevY + y) / 2
        
        this.ctx.quadraticCurveTo(cpx, cpy, x, y)
      }
    }
    
    // Complete the shape
    this.ctx.lineTo(width + 100, height + 100)
    this.ctx.lineTo(-100, height + 100)
    this.ctx.closePath()
    
    // Create vertical gradient for each wave
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height)
    colors.forEach((color, index) => {
      const stop = index / (colors.length - 1)
      gradient.addColorStop(stop, color)
    })
    
    // Apply gradient
    this.ctx.fillStyle = gradient
    this.ctx.fill()
    
    // Add very subtle glow
    this.ctx.shadowBlur = 40
    this.ctx.shadowColor = colors[0] + '33'
    this.ctx.fill()
    
    this.ctx.restore()
  }

  private drawBackground() {
    // Create smooth gradient background matching Arc style
    const bgGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height)
    
    if (this.isDarkTheme) {
      // Dark theme - deep blues
      bgGradient.addColorStop(0, '#001122')    // Very dark blue
      bgGradient.addColorStop(0.3, '#001835')  // Dark navy
      bgGradient.addColorStop(0.7, '#002244')  // Navy
      bgGradient.addColorStop(1, '#003355')    // Lighter navy
    } else {
      // Light theme - soft teals and blues
      bgGradient.addColorStop(0, '#E6FFF9')    // Very light teal
      bgGradient.addColorStop(0.3, '#D1FFF5')  // Light teal
      bgGradient.addColorStop(0.7, '#C2F0FF')  // Light blue
      bgGradient.addColorStop(1, '#B3E5FF')    // Soft blue
    }
    
    this.ctx.fillStyle = bgGradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawOrganicBlobs() {
    // Add floating organic blob shapes like in Arc
    const blobTime = this.time * 0.0001
    
    for (let i = 0; i < 3; i++) {
      const x = this.canvas.width * (0.2 + i * 0.3) + Math.sin(blobTime + i) * 100
      const y = this.canvas.height * (0.3 + Math.sin(blobTime * 1.3 + i) * 0.2)
      const radius = 150 + Math.sin(blobTime * 1.7 + i * 2) * 50
      
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius)
      
      if (i === 0) {
        gradient.addColorStop(0, 'rgba(0, 191, 156, 0.15)')  // Teal center
        gradient.addColorStop(1, 'rgba(0, 191, 156, 0)')     // Fade out
      } else if (i === 1) {
        gradient.addColorStop(0, 'rgba(0, 153, 168, 0.12)')  // Blue-teal
        gradient.addColorStop(1, 'rgba(0, 153, 168, 0)')
      } else {
        gradient.addColorStop(0, 'rgba(51, 153, 255, 0.1)')  // Light blue
        gradient.addColorStop(1, 'rgba(51, 153, 255, 0)')
      }
      
      this.ctx.fillStyle = gradient
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }

  private animate = () => {
    this.time += 1
    
    // Clear and draw background
    this.drawBackground()
    
    // Draw organic blob shapes
    this.drawOrganicBlobs()
    
    // Set blend mode for smooth color mixing
    this.ctx.globalCompositeOperation = 'screen'
    
    // Draw each wave layer
    this.layers.forEach(layer => {
      this.drawWave(layer)
    })
    
    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over'
    
    // Add final overlay for depth
    const overlay = this.ctx.createRadialGradient(
      this.canvas.width * 0.5,
      this.canvas.height * 0.5,
      0,
      this.canvas.width * 0.5,
      this.canvas.height * 0.5,
      Math.max(this.canvas.width, this.canvas.height) * 0.7
    )
    
    overlay.addColorStop(0, 'rgba(0, 191, 156, 0.05)')   // Teal center
    overlay.addColorStop(0.5, 'rgba(0, 153, 168, 0.02)') // Blue-teal
    overlay.addColorStop(1, 'rgba(0, 0, 0, 0)')          // Transparent edge
    
    this.ctx.fillStyle = overlay
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.animationId = requestAnimationFrame(this.animate)
  }

  public start() {
    if (!this.animationId) {
      this.animate()
    }
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  public destroy() {
    this.stop()
    window.removeEventListener('resize', this.resizeCanvas)
  }

  public updateTheme(isDark: boolean) {
    this.isDarkTheme = isDark
  }
}