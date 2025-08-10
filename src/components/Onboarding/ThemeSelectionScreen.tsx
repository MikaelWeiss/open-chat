import { useState } from 'react'
import { Sun, Moon, Monitor, ArrowLeft, ArrowRight } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'

interface ThemeSelectionScreenProps {
  onNext: () => void
  onBack: () => void
}

export default function ThemeSelectionScreen({ onNext, onBack }: ThemeSelectionScreenProps) {
  const { theme, handleThemeChange } = useSettings()
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(theme)

  const themes = [
    {
      id: 'light' as const,
      name: 'Light',
      icon: Sun,
      description: 'Clean and bright interface',
      preview: 'bg-white border-gray-200 text-gray-900'
    },
    {
      id: 'dark' as const,
      name: 'Dark',
      icon: Moon,
      description: 'Easy on the eyes in low light',
      preview: 'bg-gray-900 border-gray-700 text-gray-100'
    },
    {
      id: 'system' as const,
      name: 'System',
      icon: Monitor,
      description: 'Matches your system preference',
      preview: 'bg-gradient-to-br from-white to-gray-900 border-gray-400 text-gray-600'
    }
  ]

  const handleThemeSelect = async (themeId: 'light' | 'dark' | 'system') => {
    setSelectedTheme(themeId)
    await handleThemeChange(themeId)
  }

  const handleContinue = () => {
    onNext()
  }

  return (
    <div className="flex-1 flex flex-col p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Theme</h2>
        <p className="text-muted-foreground">
          Select how you'd like Open Chat to look. You can always change this later in settings.
        </p>
      </div>

      {/* Theme options */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon
            const isSelected = selectedTheme === themeOption.id
            
            return (
              <button
                key={themeOption.id}
                onClick={() => handleThemeSelect(themeOption.id)}
                className={`group relative p-6 rounded-xl border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-lg scale-105' 
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                }`}
              >
                {/* Preview card */}
                <div className={`w-full h-24 rounded-lg border mb-4 ${themeOption.preview} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <Icon className="h-8 w-8" />
                </div>
                
                {/* Theme info */}
                <div className="text-center">
                  <h3 className="font-semibold text-foreground mb-1">{themeOption.name}</h3>
                  <p className="text-sm text-muted-foreground">{themeOption.description}</p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        
        <button
          onClick={handleContinue}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span>Continue</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}