import { useState, useEffect } from 'react'
import { Play, Square, RotateCcw, Loader2, AlertTriangle } from 'lucide-react'
import { ollamaService, OllamaModelStatus } from '../../services/ollamaService'
import clsx from 'clsx'

interface ModelLoadingBannerProps {
  modelName: string
  onModelStatusChange?: (status: OllamaModelStatus) => void
}

export default function ModelLoadingBanner({ modelName, onModelStatusChange }: ModelLoadingBannerProps) {
  const [modelStatus, setModelStatus] = useState<OllamaModelStatus>({
    name: modelName,
    status: 'not_loaded'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Check model status on mount and when model name changes
  useEffect(() => {
    checkModelStatus()
  }, [modelName])

  const checkModelStatus = async () => {
    try {
      const status = await ollamaService.getModelStatus(modelName)
      setModelStatus(status)
      onModelStatusChange?.(status)
    } catch (error) {
      console.error('Failed to check model status:', error)
      setModelStatus({
        name: modelName,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const handleRetry = async () => {
    setIsLoading(true)
    try {
      // If the error mentions Ollama not being accessible, try to start it first
      if (modelStatus.error?.includes('not accessible') || modelStatus.error?.includes('Ollama is not accessible')) {
        console.log('Ollama not accessible, attempting to start...')
        
        const startResult = await ollamaService.autoStartOllama()
        if (startResult.success) {
          console.log('Ollama started successfully, checking model status...')
        } else {
          console.warn('Failed to start Ollama:', startResult.message)
          // Continue anyway to check status
        }
        
        // Wait a moment for Ollama to fully start
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      // Check model status after potential Ollama start
      await checkModelStatus()
    } catch (error) {
      console.error('Failed during retry:', error)
      setModelStatus({
        name: modelName,
        status: 'error',
        error: error instanceof Error ? error.message : 'Retry failed'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadModel = async () => {
    setIsLoading(true)
    try {
      await ollamaService.loadModel(modelName)
      await checkModelStatus()
    } catch (error) {
      console.error('Failed to load model:', error)
      setModelStatus({
        name: modelName,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load model'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnloadModel = async () => {
    setIsLoading(true)
    try {
      await ollamaService.unloadModel(modelName)
      await checkModelStatus()
    } catch (error) {
      console.error('Failed to unload model:', error)
      setModelStatus({
        name: modelName,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to unload model'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusText = () => {
    switch (modelStatus.status) {
      case 'not_loaded':
        return 'Model not loaded'
      case 'loading':
        return 'Model loading...'
      case 'loaded':
        return 'Model ready'
      case 'error':
        return modelStatus.error || 'Error loading model'
      default:
        return 'Unknown status'
    }
  }

  const getStatusColor = () => {
    switch (modelStatus.status) {
      case 'not_loaded':
        return 'text-muted-foreground'
      case 'loading':
        return 'text-blue-600'
      case 'loaded':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const getBannerColor = () => {
    switch (modelStatus.status) {
      case 'not_loaded':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      case 'loading':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'loaded':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
    }
  }

  return (
    <div className={clsx(
      'mx-6 mb-4 p-4 rounded-xl border transition-all duration-200',
      getBannerColor()
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {modelStatus.status === 'loading' || isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          ) : modelStatus.status === 'error' ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : modelStatus.status === 'loaded' ? (
            <Play className="h-5 w-5 text-green-600" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground" />
          )}
          
          <div>
            <p className="font-medium text-sm">
              Local Model: <span className="font-mono">{modelName}</span>
            </p>
            <p className={clsx('text-xs', getStatusColor())}>
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {modelStatus.status === 'error' && (
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              {modelStatus.error?.includes('not accessible') || modelStatus.error?.includes('Ollama is not accessible') ? 'Start Ollama & Retry' : 'Retry'}
            </button>
          )}
          
          {modelStatus.status === 'not_loaded' && (
            <button
              onClick={handleLoadModel}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Load Model
            </button>
          )}
          
          {modelStatus.status === 'loaded' && (
            <button
              onClick={handleUnloadModel}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Unload Model
            </button>
          )}
        </div>
      </div>
    </div>
  )
}