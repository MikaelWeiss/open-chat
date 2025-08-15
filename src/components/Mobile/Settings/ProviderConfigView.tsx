import React, { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAppStore } from '../../../stores/appStore'
import { SettingsListGroup } from './SettingsListGroup'
import { mobileFeatures } from '../../../utils/featureFlags'

interface ProviderConfigViewProps {
  providerName: string | null
  onSave: () => void
  onCancel: () => void
}

export const ProviderConfigView: React.FC<ProviderConfigViewProps> = ({
  providerName,
  onSave,
  onCancel
}) => {
  const providersRecord = useAppStore(state => state.providers)
  const providers = Object.values(providersRecord)
  const provider = providerName ? providers.find((p: any) => p.name === providerName) : null
  
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    apiKey: '', // API key is stored separately in keychain
    baseUrl: provider?.endpoint || '',
    model: provider?.enabledModels?.[0] || '',
    isActive: provider?.connected || false
  })
  
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  
  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        apiKey: '', // API key is stored separately in keychain
        baseUrl: provider.endpoint,
        model: provider.enabledModels?.[0] || '',
        isActive: provider.connected
      })
    }
  }, [provider])
  
  const handleSave = async () => {
    try {
      // For now, just call onSave - provider management implementation needed
      console.log('Save provider:', formData)
      onSave()
    } catch (error) {
      console.error('Failed to save provider:', error)
    }
  }
  
  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    // Simulate API test - replace with actual implementation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsTestingConnection(false)
    // Show success/error feedback
  }
  
  if (!mobileFeatures.iosNavigation) {
    return <div>Provider configuration not available</div>
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <SettingsListGroup title="Basic Information">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., OpenAI, Claude"
            />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., gpt-4, claude-3-sonnet"
            />
          </div>
        </div>
      </SettingsListGroup>

      <SettingsListGroup 
        title="Configuration"
        footer="Your API key is stored securely in the system keychain."
      >
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your API key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base URL (Optional)
            </label>
            <input
              type="url"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://api.openai.com/v1"
            />
          </div>
        </div>
      </SettingsListGroup>

      <SettingsListGroup title="Status">
        <div className="bg-white dark:bg-gray-800">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-base text-gray-900 dark:text-gray-100">Active</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enable this provider for chat</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </SettingsListGroup>

      {/* Action Buttons */}
      <div className="p-4 space-y-3">
        <button
          onClick={handleTestConnection}
          disabled={isTestingConnection || !formData.apiKey}
          className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTestingConnection ? 'Testing Connection...' : 'Test Connection'}
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name || !formData.apiKey || !formData.model}
            className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}