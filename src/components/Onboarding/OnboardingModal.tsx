import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'
import WelcomeScreen from './WelcomeScreen'
import ThemeSelectionScreen from './ThemeSelectionScreen'
import NameScreen from './NameScreen'
import HotkeyScreen from './HotkeyScreen'
import ProviderScreen from './ProviderScreen'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

type OnboardingScreen = 'welcome' | 'theme' | 'name' | 'hotkey' | 'provider'

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>('welcome')
  const { handleOnboardingCompletion } = useSettings()

  const screens: OnboardingScreen[] = ['welcome', 'theme', 'name', 'hotkey', 'provider']
  const currentIndex = screens.indexOf(currentScreen)

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'Enter' && currentScreen === 'welcome') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentScreen])

  const handleNext = () => {
    const nextIndex = currentIndex + 1
    if (nextIndex < screens.length) {
      setCurrentScreen(screens[nextIndex])
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      setCurrentScreen(screens[prevIndex])
    }
  }

  const handleComplete = async () => {
    await handleOnboardingCompletion(true)
    onClose()
  }

  const handleClose = async () => {
    // Mark onboarding as completed even if they close early
    await handleOnboardingCompletion(true)
    onClose()
  }

  const handleSkipToEnd = () => {
    setCurrentScreen('provider')
  }

  if (!isOpen) return null

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNext={handleNext} />
      case 'theme':
        return <ThemeSelectionScreen onNext={handleNext} onBack={handleBack} />
      case 'name':
        return <NameScreen onNext={handleNext} onBack={handleBack} onSkip={handleSkipToEnd} />
      case 'hotkey':
        return <HotkeyScreen onNext={handleNext} onBack={handleBack} />
      case 'provider':
        return <ProviderScreen onComplete={handleComplete} onBack={handleBack} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-foreground">Welcome to Open Chat</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Close onboarding"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-2 border-b border-border">
          <div className="flex space-x-2">
            {screens.map((screen, index) => (
              <div
                key={screen}
                className={`h-1 flex-1 rounded-full ${
                  index <= currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Step {currentIndex + 1} of {screens.length}</span>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px] flex flex-col">
          {renderScreen()}
        </div>
      </div>
    </div>
  )
}