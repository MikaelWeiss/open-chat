import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import clsx from 'clsx'

interface ConversationSettings {
  temperature?: number
  topP?: number
  topK?: number
  maxTokens?: number
  systemPrompt?: string
  stopSequences?: string[]
}

interface ConversationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: ConversationSettings
  onSave: (settings: ConversationSettings) => void
}

export default function ConversationSettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSave 
}: ConversationSettingsModalProps) {
  const [stopSequenceInput, setStopSequenceInput] = useState('')

  useEffect(() => {
    setStopSequenceInput(settings.stopSequences?.join(', ') || '')
  }, [settings])

  // Auto-save helper function
  const updateSetting = (key: keyof ConversationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    onSave(newSettings)
  }

  // Handle stop sequences with auto-save
  const handleStopSequenceChange = (value: string) => {
    setStopSequenceInput(value)
    const stopSequences = value
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    updateSetting('stopSequences', stopSequences.length > 0 ? stopSequences : undefined)
  }

  const handleReset = () => {
    const defaultSettings: ConversationSettings = {
      temperature: 0.7,
      topP: 0.95,
      topK: undefined,
      maxTokens: undefined,
      systemPrompt: '',
      stopSequences: undefined
    }
    onSave(defaultSettings)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border rounded-xl w-[500px] max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">Conversation Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Advanced settings for this conversation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Temperature</label>
              <div className="group relative">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
                  Controls randomness. Lower values make output more focused and deterministic.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature ?? 0.7}
                onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature ?? 0.7}
                onChange={(e) => updateSetting('temperature', parseFloat(e.target.value) || 0.7)}
                className="w-16 px-2 py-1 text-sm bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Top P */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Top P</label>
              <div className="group relative">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
                  Nucleus sampling. Controls diversity by considering only tokens with cumulative probability up to P.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.topP ?? 0.95}
                onChange={(e) => updateSetting('topP', parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={settings.topP ?? 0.95}
                onChange={(e) => updateSetting('topP', parseFloat(e.target.value) || 0.95)}
                className="w-16 px-2 py-1 text-sm bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Top K */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Top K</label>
              <div className="group relative">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
                  Limits selection to top K most likely tokens. Leave empty to disable.
                </div>
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.topK ?? ''}
              onChange={(e) => updateSetting('topK', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Disabled"
              className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Max Tokens</label>
              <div className="group relative">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
                  Maximum number of tokens to generate. Leave empty for model default.
                </div>
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="8192"
              value={settings.maxTokens ?? ''}
              onChange={(e) => updateSetting('maxTokens', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Model default"
              className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">System Prompt</label>
              <div className="group relative">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
                  Instructions that guide the AI's behavior throughout the conversation.
                </div>
              </div>
            </div>
            <textarea
              value={settings.systemPrompt ?? ''}
              onChange={(e) => updateSetting('systemPrompt', e.target.value)}
              placeholder="Enter system prompt..."
              rows={3}
              className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Stop Sequences */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Stop Sequences</label>
              <div className="group relative">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
                  Comma-separated sequences where generation should stop.
                </div>
              </div>
            </div>
            <input
              type="text"
              value={stopSequenceInput}
              onChange={(e) => handleStopSequenceChange(e.target.value)}
              placeholder="\\n, END, ..."
              className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  )
}