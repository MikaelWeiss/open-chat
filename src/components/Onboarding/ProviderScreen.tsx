import { useState } from 'react'
import { ArrowLeft, Check, ExternalLink, Key, Server } from 'lucide-react'
import { open } from '@tauri-apps/plugin-shell'
import { useSettings } from '../../hooks/useSettings'
import { ProviderPreset } from '../../types/provider'

interface ProviderScreenProps {
  onComplete: () => void
  onBack: () => void
}

const providerPresets: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    description: 'GPT-4, GPT-3.5, and other OpenAI models',
    apiKeyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus, and other Claude models',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'groq',
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1',
    description: 'Fast inference for Llama, Mixtral models',
    apiKeyUrl: 'https://console.groq.com/keys'
  },
  {
    id: 'local',
    name: 'Local',
    endpoint: 'http://localhost:11434',
    description: 'Local models via Ollama - no API key required',
    isLocal: true
  }
]

export default function ProviderScreen({ onComplete, onBack }: ProviderScreenProps) {
  const { addProvider } = useSettings()
  const [selectedPreset, setSelectedPreset] = useState<ProviderPreset | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  const handlePresetSelect = (preset: ProviderPreset) => {
    setSelectedPreset(preset)
    setShowApiKeyInput(!preset.isLocal)
    setApiKey('')
  }

  const handleAddProvider = async () => {
    if (!selectedPreset) return

    setIsAdding(true)
    try {
      await addProvider({
        name: selectedPreset.name,
        endpoint: selectedPreset.endpoint,
        apiKey: selectedPreset.isLocal ? undefined : apiKey,
        isLocal: selectedPreset.isLocal
      })
      onComplete()
    } catch (error) {
      console.error('Failed to add provider:', error)
      // Could add error handling UI here
    } finally {
      setIsAdding(false)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const openApiKeyUrl = async (url: string) => {
    try {
      await open(url)
    } catch (error) {
      console.error('Failed to open URL:', error)
    }
  }

  const canContinue = selectedPreset && (selectedPreset.isLocal || apiKey.trim())

  return (
    <div className="flex-1 flex flex-col p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Server className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Add your first provider</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Choose an AI provider to get started. You can always add more providers later in settings.
        </p>
      </div>

      {/* Provider selection */}
      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
        {!selectedPreset ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Choose a provider:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providerPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {preset.name}
                    </h4>
                    {preset.isLocal && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded">
                        Local
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                </button>
              ))}
            </div>
            
            {/* Skip option */}
            <div className="text-center pt-6 border-t border-border">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now - I'll add providers later
              </button>
            </div>
          </div>
        ) : (
          /* API Key input */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Setting up {selectedPreset.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPreset.description}</p>
              </div>
              <button
                onClick={() => setSelectedPreset(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Change provider
              </button>
            </div>

            {showApiKeyInput ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="apiKey" className="block text-sm font-medium text-foreground">
                      API Key
                    </label>
                    {selectedPreset.apiKeyUrl && (
                      <button
                        onClick={() => openApiKeyUrl(selectedPreset.apiKeyUrl!)}
                        className="flex items-center space-x-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <span>Get API Key</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex items-start space-x-3 p-4 bg-accent/50 rounded-lg border border-border">
                  <Key className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-foreground font-medium mb-1">Secure Storage</p>
                    <p className="text-muted-foreground">
                      Your API key will be stored securely in your system keychain and never sent anywhere except to {selectedPreset.name}.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-green-800 dark:text-green-200 font-medium mb-1">Ready to go!</p>
                  <p className="text-green-700 dark:text-green-300">
                    {selectedPreset.name} runs locally and doesn't require an API key.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
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
        
        {selectedPreset && (
          <button
            onClick={handleAddProvider}
            disabled={!canContinue || isAdding}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Adding Provider...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}