import { AlertTriangle, FileText, RotateCcw, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'

interface SettingsErrorModalProps {
  isOpen: boolean
  onClose: () => void
  corruptionStatus: {
    corrupted: boolean
    error: string | null
    settingsPath: string
  }
  onReset: () => Promise<void>
  onOpenInEditor: () => Promise<boolean>
  onRefresh: () => Promise<void>
}

export default function SettingsErrorModal({ 
  isOpen, 
  onClose, 
  corruptionStatus, 
  onReset, 
  onOpenInEditor,
  onRefresh
}: SettingsErrorModalProps) {
  const [isResetting, setIsResetting] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!isOpen || !corruptionStatus.corrupted) return null

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await onReset()
      onClose() // Close the modal after successful reset
    } catch (error) {
      console.error('Failed to reset settings:', error)
    } finally {
      setIsResetting(false)
    }
  }

  const handleOpenInEditor = async () => {
    setIsOpening(true)
    try {
      const success = await onOpenInEditor()
      if (!success) {
        alert('Failed to open settings file in editor. You can manually navigate to the file path shown below.')
      }
    } catch (error) {
      console.error('Failed to open settings file:', error)
      alert('Failed to open settings file in editor. You can manually navigate to the file path shown below.')
    } finally {
      setIsOpening(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
      // If we get here without error and corruption status is still corrupted,
      // it means the file is still corrupted after reload
    } catch (error) {
      console.error('Failed to refresh settings:', error)
      alert('Failed to reload settings. Please check the console for more details.')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-900 dark:text-yellow-100 truncate">
              Settings Configuration Error
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          <div className="space-y-3">
            <p className="text-foreground">
              Your settings configuration file appears to be corrupted and could not be loaded. 
              The application is currently running with default settings.
            </p>
            
            {corruptionStatus.error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                  Error Details:
                </p>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-mono break-all overflow-wrap-anywhere">
                  {corruptionStatus.error}
                </p>
              </div>
            )}

            <div className="p-3 bg-secondary/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Settings file location:
              </p>
              <p className="text-xs sm:text-sm font-mono text-foreground break-all overflow-wrap-anywhere">
                {corruptionStatus.settingsPath}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-foreground">What would you like to do?</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleOpenInEditor}
                disabled={isOpening}
                className="w-full flex items-center gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    {isOpening ? 'Opening...' : 'Fix Manually'}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Open the settings file in a text editor to fix the JSON manually
                  </div>
                </div>
              </button>

              <button
                onClick={handleReset}
                disabled={isResetting}
                className="w-full flex items-center gap-3 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-red-900 dark:text-red-100">
                    {isResetting ? 'Resetting...' : 'Reset to Defaults'}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    ⚠️ This will permanently delete all your providers and settings
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-3 border-t border-border">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} flex-shrink-0`} />
                <span className="text-sm font-medium">
                  {isRefreshing ? 'Checking...' : 'Check Again'}
                </span>
              </button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                After fixing the file manually, click here to reload settings
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> If you choose to fix manually, save the file and then click "Check Again" to reload the settings.
              If you're not sure how to fix the JSON, choose "Reset to Defaults" to start fresh.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}