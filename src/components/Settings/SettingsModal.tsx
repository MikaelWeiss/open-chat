import { X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [theme, setTheme] = useState('system')
  const [sendKey, setSendKey] = useState('enter')
  
  if (!isOpen) return null

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'providers', label: 'Providers' },
    { id: 'mcp', label: 'MCP Servers' },
  ]

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border rounded-xl w-[800px] max-h-[600px] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-border p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-lg transition-colors',
                  activeTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && <GeneralSettings theme={theme} setTheme={setTheme} sendKey={sendKey} setSendKey={setSendKey} />}
            {activeTab === 'providers' && <ProvidersSettings />}
            {activeTab === 'mcp' && <MCPSettings />}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-accent rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function GeneralSettings({ theme, setTheme, sendKey, setSendKey }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Keyboard Shortcuts</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Send Message</label>
            <select
              value={sendKey}
              onChange={(e) => setSendKey(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="enter">Enter</option>
              <option value="cmd-enter">Cmd/Ctrl + Enter</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {sendKey === 'enter' ? 'Shift+Enter for new line' : 'Enter for new line'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProvidersSettings() {
  const [providers] = useState([
    { id: 'openai', name: 'OpenAI', configured: true },
    { id: 'anthropic', name: 'Anthropic', configured: false },
    { id: 'local', name: 'Local LLM', configured: false },
  ])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">LLM Providers</h3>
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">{provider.name}</h4>
                <span
                  className={clsx(
                    'text-xs px-2 py-1 rounded',
                    provider.configured
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-yellow-500/20 text-yellow-500'
                  )}
                >
                  {provider.configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">API Key</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                {provider.id === 'local' && (
                  <div>
                    <label className="text-sm font-medium">Start Command</label>
                    <input
                      type="text"
                      placeholder="ollama serve"
                      className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium">Endpoint URL</label>
                  <input
                    type="url"
                    placeholder={
                      provider.id === 'openai'
                        ? 'https://api.openai.com/v1'
                        : provider.id === 'anthropic'
                        ? 'https://api.anthropic.com'
                        : 'http://localhost:8080'
                    }
                    className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MCPSettings() {
  const [servers] = useState([
    { id: 'filesystem', name: 'Filesystem', enabled: true },
    { id: 'github', name: 'GitHub', enabled: false },
    { id: 'google-drive', name: 'Google Drive', enabled: false },
  ])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">MCP Servers</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Model Context Protocol servers extend your AI's capabilities with tools and resources.
        </p>
        
        <div className="space-y-3">
          {servers.map((server) => (
            <div
              key={server.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div>
                <h4 className="font-medium">{server.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {server.id === 'filesystem' && 'Access local files and directories'}
                  {server.id === 'github' && 'Interact with GitHub repositories'}
                  {server.id === 'google-drive' && 'Access Google Drive files'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={server.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>

        <button className="mt-4 px-4 py-2 bg-secondary hover:bg-accent rounded-lg transition-colors">
          Add MCP Server
        </button>
      </div>
    </div>
  )
}