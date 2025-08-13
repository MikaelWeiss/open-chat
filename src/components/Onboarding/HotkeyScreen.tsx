import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Zap, Command } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'

interface HotkeyScreenProps {
  onNext: () => void
  onBack: () => void
}

export default function HotkeyScreen({ onNext, onBack }: HotkeyScreenProps) {
  const { globalHotkey, handleGlobalHotkeyChange } = useSettings()
  const [hotkey, setHotkey] = useState(globalHotkey || '')
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const presetHotkeys = [
    { label: 'Cmd+Shift+O', value: 'CommandOrControl+Shift+O' },
    { label: 'Cmd+Alt+C', value: 'CommandOrControl+Alt+C' },
    { label: 'Ctrl+Shift+Space', value: 'CommandOrControl+Shift+Space' },
    { label: 'F1', value: 'F1' },
  ]

  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      const keys = []
      if (e.metaKey || e.ctrlKey) keys.push(e.metaKey ? 'Cmd' : 'Ctrl')
      if (e.altKey) keys.push('Alt')
      if (e.shiftKey) keys.push('Shift')
      
      // Add the main key
      if (e.key !== 'Meta' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift') {
        let keyName = e.key
        if (e.key === ' ') keyName = 'Space'
        else if (e.key.length === 1) keyName = e.key.toUpperCase()
        keys.push(keyName)
      }
      
      setRecordedKeys(keys)
      
      // If we have at least 2 keys (modifier + main key), stop recording
      if (keys.length >= 2) {
        const hotkeyString = keys.join('+').replace('Cmd', 'CommandOrControl').replace('Ctrl', 'CommandOrControl')
        setHotkey(hotkeyString)
        setIsRecording(false)
        setRecordedKeys([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording])

  const handleStartRecording = () => {
    setIsRecording(true)
    setRecordedKeys([])
    inputRef.current?.focus()
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setRecordedKeys([])
  }

  const handlePresetSelect = (presetValue: string) => {
    setHotkey(presetValue)
  }

  const handleContinue = async () => {
    if (hotkey) {
      await handleGlobalHotkeyChange(hotkey)
    }
    onNext()
  }

  const displayHotkey = isRecording && recordedKeys.length > 0 
    ? recordedKeys.join('+')
    : hotkey.replace('CommandOrControl', navigator.platform.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl')

  return (
    <div className="flex-1 flex flex-col p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Access Open Chat from anywhere</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Set up a global hotkey to quickly open Open Chat from any application on your system.
        </p>
      </div>

      {/* Hotkey input */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="space-y-6">
          <div>
            <label htmlFor="hotkey" className="block text-sm font-medium text-foreground mb-2">
              Global Hotkey
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="hotkey"
                type="text"
                value={displayHotkey}
                readOnly
                placeholder={isRecording ? "Press your desired hotkey combination..." : "Click to record hotkey"}
                onClick={handleStartRecording}
                className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground cursor-pointer font-mono ${
                  isRecording ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                }`}
              />
              {isRecording && (
                <button
                  onClick={handleStopRecording}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded"
                >
                  Stop
                </button>
              )}
            </div>
            {isRecording && (
              <p className="text-xs text-muted-foreground mt-1">
                Press a key combination (e.g., Cmd+Shift+O)
              </p>
            )}
          </div>

          {/* Preset options */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Or choose a preset:</p>
            <div className="grid grid-cols-2 gap-3">
              {presetHotkeys.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`px-4 py-3 rounded-lg border text-sm font-mono transition-colors ${
                    hotkey === preset.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 text-foreground hover:bg-accent'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start space-x-3 p-4 bg-accent/50 rounded-lg border border-border">
            <Command className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-foreground font-medium mb-1">Quick Access</p>
              <p className="text-muted-foreground">
                Once set, you can press your hotkey from any application to instantly open Open Chat.
                You can always change or disable this later in settings.
              </p>
            </div>
          </div>
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
          <span>{hotkey ? 'Continue' : 'Skip for now'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}