import React, { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { mobileFeatures } from '../../utils/featureFlags'

interface NavigationStackProps {
  title: string
  onBack?: () => void
  showBackButton?: boolean
  rightButton?: ReactNode
  children: ReactNode
  largeTitleMode?: boolean
}

export const NavigationStack: React.FC<NavigationStackProps> = ({
  title,
  onBack,
  showBackButton = false,
  rightButton,
  children,
  largeTitleMode = false
}) => {
  if (!mobileFeatures.iosNavigation) {
    return <div>{children}</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <div className="safe-area-top ios-navigation-bar bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 h-11 ios-touch-highlight">
          {/* Left Button */}
          <div className="flex items-center min-w-0">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 -ml-2 p-2 ios-button-touch ios-touch-highlight"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
                <span className="text-base font-normal">Back</span>
              </button>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 flex justify-center min-w-0 px-4">
            <h1 
              className={`font-semibold text-center truncate ${
                largeTitleMode ? 'text-lg' : 'text-base'
              } text-gray-900 dark:text-gray-100`}
              role="heading"
              aria-level={1}
            >
              {title}
            </h1>
          </div>

          {/* Right Button */}
          <div className="flex items-center min-w-0">
            {rightButton}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}