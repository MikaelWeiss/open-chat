import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ArrowRight, User, Shield } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'

interface NameScreenProps {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export default function NameScreen({ onNext, onBack, onSkip }: NameScreenProps) {
  const { userName, handleUserNameChange } = useSettings()
  const [name, setName] = useState(userName || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus the input when the screen loads
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      await handleUserNameChange(name.trim())
    }
    onNext()
  }

  const handleSkipClick = async () => {
    // Clear any existing name if they're skipping
    await handleUserNameChange('')
    onSkip()
  }

  return (
    <div className="flex-1 flex flex-col p-8">
      {/* Skip button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSkipClick}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-md hover:bg-accent"
        >
          Skip
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">What's your name?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This will be used to personalize your chat interface. Your name is stored locally and only used within the app.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-foreground mb-2">
              Your name
            </label>
            <input
              ref={inputRef}
              id="userName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-foreground placeholder:text-muted-foreground"
              maxLength={50}
            />
          </div>

          {/* Privacy note */}
          <div className="flex items-start space-x-3 p-4 bg-accent/50 rounded-lg border border-border">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-foreground font-medium mb-1">Privacy First</p>
              <p className="text-muted-foreground">
                Your name is stored locally on your device and is never sent to external servers. 
                It's only used to personalize your chat interface.
              </p>
            </div>
          </div>

          {/* Hidden submit button for form submission */}
          <button type="submit" className="hidden" />
        </form>
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
          onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span>Continue</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}