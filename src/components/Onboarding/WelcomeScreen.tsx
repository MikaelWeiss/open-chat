import { ArrowRight, CornerDownLeft } from 'lucide-react'

interface WelcomeScreenProps {
  onNext: () => void
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      {/* Logo/Icon placeholder */}
      <div className="w-16 h-16 bg-primary rounded-lg mb-6 flex items-center justify-center">
        <svg 
          className="w-8 h-8 text-primary-foreground" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>

      {/* Welcome message */}
      <h1 className="text-3xl font-bold text-foreground mb-4">
        Welcome to Open Chat!
      </h1>
      
      <p className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
        A beautiful unified interface for all of your LLM providers. Let's get you set up in just a few steps.
      </p>

      {/* Next button */}
      <button
        onClick={onNext}
        className="flex items-center space-x-3 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <span>Next</span>
        <div className="flex items-center space-x-2">
          <ArrowRight className="h-5 w-5" />
          <div className="flex items-center space-x-1 text-sm opacity-75">
            <span>or press</span>
            <div className="px-2 py-1 bg-primary-foreground/20 rounded text-xs font-mono">
              <CornerDownLeft className="h-3 w-3" />
            </div>
          </div>
        </div>
      </button>

      {/* Features preview */}
      <div className="grid grid-cols-3 gap-4 mt-12 text-sm text-muted-foreground">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-2 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <span>Multiple Providers</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg mb-2 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span>Secure Storage</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-2 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span>Global Access</span>
        </div>
      </div>
    </div>
  )
}