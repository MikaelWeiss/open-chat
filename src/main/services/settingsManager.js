const { app, safeStorage } = require('electron')
const path = require('path')
const fs = require('fs').promises

class SettingsManager {
  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json')
    this.settings = this.getDefaultSettings()
  }

  getDefaultSettings() {
    return {
      theme: 'system',
      defaultProvider: 'openai',
      providers: {
        openai: {
          apiKey: '',
          endpoint: 'https://api.openai.com/v1',
          models: ['gpt-4', 'gpt-3.5-turbo'],
          configured: false,
          testStatus: 'untested'
        },
        anthropic: {
          apiKey: '',
          endpoint: 'https://api.anthropic.com/v1',
          models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
          configured: false,
          testStatus: 'untested'
        },
        openrouter: {
          apiKey: '',
          endpoint: 'https://openrouter.ai/api/v1',
          models: [],
          configured: false,
          testStatus: 'untested'
        },
        groq: {
          apiKey: '',
          endpoint: 'https://api.groq.com/openai/v1',
          models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
          configured: false,
          testStatus: 'untested'
        },
        ollama: {
          apiKey: '',
          endpoint: 'http://localhost:11434/v1',
          models: [],
          configured: false,
          testStatus: 'untested'
        },
        deepinfra: {
          apiKey: '',
          endpoint: 'https://api.deepinfra.com/v1/openai',
          models: [],
          configured: false,
          testStatus: 'untested'
        },
        inceptionlabs: {
          apiKey: '',
          endpoint: 'https://api.inceptionlabs.ai/v1',
          models: [],
          configured: false,
          testStatus: 'untested'
        }
      },
      keyboard: {
        sendMessage: 'enter',
        newLine: 'shift+enter'
      },
      mcpServers: [
        { id: 'filesystem', name: 'Filesystem', enabled: false },
        { id: 'github', name: 'GitHub', enabled: false },
        { id: 'google-drive', name: 'Google Drive', enabled: false }
      ]
    }
  }

  async initialize() {
    await this.loadSettings()
  }

  async loadSettings() {
    this.settingsCorrupted = false
    this.settingsError = null
    
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8')
      const loaded = JSON.parse(data)
      
      // Decrypt API keys
      if (safeStorage.isEncryptionAvailable()) {
        for (const provider in loaded.providers) {
          if (loaded.providers[provider].apiKey) {
            try {
              const encrypted = Buffer.from(loaded.providers[provider].apiKey, 'base64')
              loaded.providers[provider].apiKey = safeStorage.decryptString(encrypted)
            } catch (e) {
              console.error(`Failed to decrypt API key for ${provider}`)
              loaded.providers[provider].apiKey = ''
            }
          }
        }
      }
      
      // Merge with defaults to ensure all fields exist
      this.settings = { ...this.getDefaultSettings(), ...loaded }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, use defaults (normal first run)
        console.log('Settings file not found, using defaults')
        this.settings = this.getDefaultSettings()
      } else {
        // File exists but is corrupted
        console.error('Settings file is corrupted:', error.message)
        this.settingsCorrupted = true
        this.settingsError = error.message
        this.settings = this.getDefaultSettings()
      }
    }
  }

  async saveSettings() {
    const toSave = JSON.parse(JSON.stringify(this.settings))
    
    // Encrypt API keys before saving
    if (safeStorage.isEncryptionAvailable()) {
      for (const provider in toSave.providers) {
        if (toSave.providers[provider].apiKey) {
          const encrypted = safeStorage.encryptString(toSave.providers[provider].apiKey)
          toSave.providers[provider].apiKey = encrypted.toString('base64')
        }
      }
    }
    
    await fs.writeFile(this.settingsPath, JSON.stringify(toSave, null, 2))
  }

  async getSettings() {
    // Return a copy to prevent direct modification
    return JSON.parse(JSON.stringify(this.settings))
  }

  async updateSettings(newSettings) {
    // Update configured status based on API key presence
    for (const provider in newSettings.providers) {
      if (newSettings.providers[provider].apiKey) {
        newSettings.providers[provider].configured = true
      } else {
        newSettings.providers[provider].configured = false
      }
    }
    
    this.settings = { ...this.settings, ...newSettings }
    await this.saveSettings()
    return this.settings
  }

  getProviderConfig(provider) {
    return this.settings.providers[provider]
  }

  isProviderConfigured(provider) {
    return this.settings.providers[provider]?.configured || false
  }

  getCorruptionStatus() {
    return {
      corrupted: this.settingsCorrupted || false,
      error: this.settingsError || null,
      settingsPath: this.settingsPath
    }
  }

  async resetSettings() {
    this.settings = this.getDefaultSettings()
    this.settingsCorrupted = false
    this.settingsError = null
    await this.saveSettings()
    return this.settings
  }

  async reloadSettings() {
    await this.loadSettings()
    return {
      settings: this.settings,
      corruptionStatus: this.getCorruptionStatus()
    }
  }
}

module.exports = { SettingsManager }