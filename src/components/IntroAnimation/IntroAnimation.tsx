import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import { GradientAnimation } from './gradientAnimation'
import audioFile from '../../assets/logo-sting.mp3'
import './IntroAnimation.css'

interface IntroAnimationProps {
  onComplete: () => void
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<GradientAnimation | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  const [showText, setShowText] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [textLetters, setTextLetters] = useState<string[]>([])
  const [fadeOut, setFadeOut] = useState(false)

  const text = "Welcome to Open Chat"

  // Initialize canvas animation
  useEffect(() => {
    if (!canvasRef.current) return

    const animation = new GradientAnimation(canvasRef.current)
    animationRef.current = animation
    animation.start()

    // Update theme if it changes
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark')
      animation.updateTheme(isDark)
    }

    // Watch for theme changes
    const observer = new MutationObserver(handleThemeChange)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => {
      animation.destroy()
      observer.disconnect()
    }
  }, [])

  // Load and play audio
  useEffect(() => {
    const audio = new Audio(audioFile)
    audio.volume = 0.3 // Set a comfortable volume
    audioRef.current = audio

    // Preload audio
    audio.addEventListener('canplaythrough', () => {
      // Audio is ready
    })

    audio.addEventListener('error', (e) => {
      console.warn('Audio failed to load:', e)
      // Continue without audio
    })

    // Start playing audio after a short delay
    const playTimer = setTimeout(() => {
      audio.play().catch(err => {
        console.warn('Audio playback failed:', err)
        // Continue without audio if autoplay is blocked
      })
    }, 500)

    return () => {
      clearTimeout(playTimer)
      audio.pause()
      audio.src = ''
    }
  }, [])

  // Show text animation after 5 seconds
  useEffect(() => {
    const textTimer = setTimeout(() => {
      setShowText(true)
      // Animate letters one by one
      const letters = text.split('')
      letters.forEach((letter, index) => {
        setTimeout(() => {
          setTextLetters(prev => [...prev, letter])
        }, index * 50)
      })
    }, 5000)

    return () => clearTimeout(textTimer)
  }, [])

  // Show continue button after audio ends (16 seconds)
  useEffect(() => {
    const buttonTimer = setTimeout(() => {
      setShowButton(true)
    }, 16000)

    return () => clearTimeout(buttonTimer)
  }, [])


  // Handle completion
  const handleComplete = useCallback(() => {
    // Fade out animation
    setFadeOut(true)
    
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause()
    }

    // Complete after fade animation
    setTimeout(() => {
      onComplete()
    }, 1000)
  }, [onComplete])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && showButton) {
        handleComplete()
      }
      // Allow escape to skip intro (for development/testing)
      if (e.key === 'Escape') {
        handleComplete()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showButton, handleComplete])

  return (
    <div className={`intro-animation-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <canvas
        ref={canvasRef}
        className="intro-canvas"
      />
      
      <div className="intro-content">
        {showText && (
          <h1 className={`intro-title ${showText ? 'visible shimmer' : ''}`}>
            {textLetters.map((letter, index) => (
              <span
                key={index}
                className="letter"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
          </h1>
        )}
      </div>

      {showButton && (
        <>
          <button
            className={`intro-continue-button ${showButton ? 'visible' : ''}`}
            onClick={handleComplete}
            aria-label="Continue to app"
          >
            <span>Continue</span>
            <ArrowRight size={20} />
          </button>
          <p className={`intro-hint ${showButton ? 'visible' : ''}`}>
            Press Enter to continue
          </p>
        </>
      )}

    </div>
  )
}