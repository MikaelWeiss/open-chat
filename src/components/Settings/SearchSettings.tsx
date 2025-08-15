import { useState, useCallback } from 'react'
import { Plus, Trash2, Eye, EyeOff, Globe, ExternalLink } from 'lucide-react'
import { SearchEngineConfig, SearchEngineKind } from '../../types/search'
import { useSearchStore } from '../../stores/searchStore'

export default function SearchSettings() {
  const {
    settings,
    addSearchEngine,
    updateSearchEngine,
    removeSearchEngine,
    setDefaultEngine,
    setAutoDetect
  } = useSearchStore()

  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({})
  const [isAddingEngine, setIsAddingEngine] = useState(false)
  const [newEngine, setNewEngine] = useState<{
    kind: SearchEngineKind
    apiKey?: string
    cx?: string
  }>({ kind: 'tavily' })

  const engineOptions: { value: SearchEngineKind; label: string; requiresKey: boolean; fields?: string[] }[] = [
    { value: 'tavily', label: 'Tavily', requiresKey: true },
    { value: 'google', label: 'Google Custom Search', requiresKey: true, fields: ['apiKey', 'cx'] },
    { value: 'bing', label: 'Bing Search', requiresKey: true },
    { value: 'brave', label: 'Brave Search', requiresKey: true },
    { value: 'duckduckgo', label: 'DuckDuckGo', requiresKey: false }
  ]

  const handleAddEngine = useCallback(async () => {
    if (!newEngine.kind) return

    const engineOption = engineOptions.find(opt => opt.value === newEngine.kind)
    if (!engineOption) return

    let config: SearchEngineConfig

    if (newEngine.kind === 'duckduckgo') {
      config = { kind: 'duckduckgo' }
    } else if (newEngine.kind === 'google') {
      if (!newEngine.apiKey || !newEngine.cx) {
        alert('Google Custom Search requires both API key and Custom Search Engine ID (cx)')
        return
      }
      config = { kind: 'google', apiKey: newEngine.apiKey, cx: newEngine.cx }
    } else {
      if (!newEngine.apiKey) {
        alert('API key is required for this search engine')
        return
      }
      config = { kind: newEngine.kind, apiKey: newEngine.apiKey } as SearchEngineConfig
    }

    try {
      await addSearchEngine(config)
      setNewEngine({ kind: 'tavily' })
      setIsAddingEngine(false)
    } catch (error) {
      console.error('Failed to add search engine:', error)
      alert('Failed to add search engine. Please try again.')
    }
  }, [newEngine, addSearchEngine])

  const handleRemoveEngine = useCallback(async (index: number) => {
    try {
      await removeSearchEngine(index)
    } catch (error) {
      console.error('Failed to remove search engine:', error)
      alert('Failed to remove search engine. Please try again.')
    }
  }, [removeSearchEngine])

  const handleUpdateEngine = useCallback(async (index: number, updatedConfig: SearchEngineConfig) => {
    try {
      await updateSearchEngine(index, updatedConfig)
    } catch (error) {
      console.error('Failed to update search engine:', error)
      alert('Failed to update search engine. Please try again.')
    }
  }, [updateSearchEngine])

  const toggleApiKeyVisibility = (index: number) => {
    setShowApiKeys(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const getEngineLabel = (kind: SearchEngineKind) => {
    return engineOptions.find(opt => opt.value === kind)?.label || kind
  }

  return (
    <div className="space-y-6">
      {/* Search Settings Header */}
      <div>
        <h3 className="text-lg font-medium mb-2">Web Search</h3>
        <p className="text-sm text-muted-foreground">
          Configure search engines for real-time information retrieval. The AI can automatically search when needed.
        </p>
      </div>

      {/* Auto-detect toggle */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="autoDetectSearch"
          checked={settings.autoDetectNeeded}
          onChange={(e) => setAutoDetect(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <div className="flex-1">
          <label htmlFor="autoDetectSearch" className="text-sm font-medium cursor-pointer">
            Auto-detect search necessity
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            When enabled, the AI will automatically search for current information when needed. Otherwise, use the globe button to search manually.
          </p>
        </div>
      </div>

      {/* Default Engine Selection */}
      <div>
        <label className="text-sm font-medium mb-3 block">Default Search Engine</label>
        <select
          value={settings.defaultEngine}
          onChange={(e) => setDefaultEngine(e.target.value as SearchEngineKind)}
          className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
        >
          {settings.engines.map((engine, index) => (
            <option key={index} value={engine.kind}>
              {getEngineLabel(engine.kind)}
            </option>
          ))}
        </select>
      </div>

      {/* Search Engines List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium">Search Engines</h4>
          <button
            onClick={() => setIsAddingEngine(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Engine
          </button>
        </div>

        <div className="space-y-3">
          {settings.engines.map((engine, index) => (
            <div key={index} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getEngineLabel(engine.kind)}</span>
                  {engine.kind === settings.defaultEngine && (
                    <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveEngine(index)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove engine"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* API Key field for engines that need it */}
              {'apiKey' in engine && (
                <div>
                  <label className="text-sm font-medium mb-2 block">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKeys[index] ? 'text' : 'password'}
                      value={engine.apiKey}
                      onChange={(e) => {
                        const updatedEngine = { ...engine, apiKey: e.target.value }
                        handleUpdateEngine(index, updatedEngine as SearchEngineConfig)
                      }}
                      className="w-full p-2 pr-10 border border-border rounded-lg bg-background text-foreground"
                      placeholder="Enter API key..."
                    />
                    <button
                      type="button"
                      onClick={() => toggleApiKeyVisibility(index)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showApiKeys[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Search Engine ID for Google */}
              {engine.kind === 'google' && 'cx' in engine && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Custom Search Engine ID (cx)</label>
                  <input
                    type="text"
                    value={engine.cx}
                    onChange={(e) => {
                      const updatedEngine = { ...engine, cx: e.target.value }
                      handleUpdateEngine(index, updatedEngine as SearchEngineConfig)
                    }}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="Enter Custom Search Engine ID..."
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add New Engine Form */}
      {isAddingEngine && (
        <div className="border border-border rounded-lg p-4 space-y-4 bg-accent/5">
          <h4 className="text-sm font-medium">Add Search Engine</h4>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Engine Type</label>
            <select
              value={newEngine.kind}
              onChange={(e) => setNewEngine({ kind: e.target.value as SearchEngineKind })}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
            >
              {engineOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.requiresKey ? '(API Key Required)' : '(Free)'}
                </option>
              ))}
            </select>
          </div>

          {newEngine.kind && newEngine.kind !== 'duckduckgo' && (
            <div>
              <label className="text-sm font-medium mb-2 block">API Key</label>
              <input
                type="password"
                value={newEngine.apiKey || ''}
                onChange={(e) => setNewEngine(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                placeholder="Enter API key..."
              />
            </div>
          )}

          {newEngine.kind === 'google' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Search Engine ID (cx)</label>
              <input
                type="text"
                value={newEngine.cx || ''}
                onChange={(e) => setNewEngine(prev => ({ ...prev, cx: e.target.value }))}
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                placeholder="Enter Custom Search Engine ID..."
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAddEngine}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Engine
            </button>
            <button
              onClick={() => {
                setIsAddingEngine(false)
                setNewEngine({ kind: 'tavily' })
              }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-2">
        <p><strong>Setup Instructions:</strong></p>
        <ul className="space-y-1 ml-4 list-disc">
          <li><strong>Tavily:</strong> Visit <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">tavily.com <ExternalLink className="h-3 w-3" /></a> to get your API key</li>
          <li><strong>Google:</strong> Set up Custom Search at <a href="https://developers.google.com/custom-search/v1/overview" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Developers <ExternalLink className="h-3 w-3" /></a></li>
          <li><strong>Bing:</strong> Get your key from <a href="https://www.microsoft.com/en-us/bing/apis/bing-web-search-api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Bing Search API <ExternalLink className="h-3 w-3" /></a></li>
          <li><strong>Brave:</strong> Sign up at <a href="https://brave.com/search/api/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Brave Search API <ExternalLink className="h-3 w-3" /></a></li>
          <li><strong>DuckDuckGo:</strong> Free to use, limited to instant answers (not full web search)</li>
        </ul>
      </div>
    </div>
  )
}
