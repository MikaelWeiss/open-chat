/**
 * Settings Management Example
 * 
 * This example demonstrates how to work with application settings,
 * including provider configuration, UI preferences, and keyboard shortcuts.
 * 
 * Usage: node examples/settings-management.js
 */

const { SettingsManager } = require('../src/main/services/settingsManager')

async function settingsManagementExample() {
  // Initialize settings manager
  const settingsManager = new SettingsManager()
  await settingsManager.initialize()

  try {
    console.log('⚙️  Settings Management Example\n')

    // Get current settings
    console.log('📖 Getting current settings...')
    const currentSettings = await settingsManager.getSettings()
    console.log('✅ Current settings loaded')
    console.log('   Providers configured:', Object.keys(currentSettings.providers || {}).length)
    console.log('   Theme:', currentSettings.ui?.theme || 'default')
    console.log('   Global hotkey:', currentSettings.keyboard?.globalHotkey || 'none')

    // Example: Configure Anthropic provider
    console.log('\n🔧 Configuring Anthropic provider...')
    const anthropicSettings = {
      providers: {
        ...currentSettings.providers,
        anthropic: {
          apiKey: 'sk-ant-example-key-placeholder',
          models: [
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-3-opus-20240229'
          ],
          enabled: true,
          baseUrl: 'https://api.anthropic.com',
          defaultModel: 'claude-3-sonnet-20240229'
        }
      }
    }

    await settingsManager.updateSettings(anthropicSettings)
    console.log('✅ Anthropic provider configured')

    // Example: Configure UI preferences
    console.log('\n🎨 Configuring UI preferences...')
    const uiSettings = {
      ui: {
        theme: 'dark',
        fontSize: 'medium',
        sidebarWidth: 280,
        showUsageStats: true,
        enableAnimations: true,
        compactMode: false
      }
    }

    await settingsManager.updateSettings(uiSettings)
    console.log('✅ UI preferences updated')
    console.log('   Theme set to:', uiSettings.ui.theme)
    console.log('   Sidebar width:', uiSettings.ui.sidebarWidth)

    // Example: Configure keyboard shortcuts
    console.log('\n⌨️  Configuring keyboard shortcuts...')
    const keyboardSettings = {
      keyboard: {
        globalHotkey: 'CommandOrControl+Shift+Space',
        shortcuts: {
          newConversation: 'CommandOrControl+N',
          toggleSidebar: 'CommandOrControl+B',
          focusInput: 'CommandOrControl+L',
          deleteConversation: 'CommandOrControl+D'
        }
      }
    }

    await settingsManager.updateSettings(keyboardSettings)
    console.log('✅ Keyboard shortcuts configured')
    console.log('   Global hotkey:', keyboardSettings.keyboard.globalHotkey)
    console.log('   New conversation:', keyboardSettings.keyboard.shortcuts.newConversation)

    // Example: Configure usage tracking
    console.log('\n📊 Configuring usage tracking...')
    const usageSettings = {
      usage: {
        trackTokens: true,
        trackCosts: true,
        resetInterval: 'monthly',
        showInSidebar: true,
        alertThresholds: {
          dailyTokens: 50000,
          dailyCost: 10.00,
          monthlyTokens: 1000000,
          monthlyCost: 200.00
        }
      }
    }

    await settingsManager.updateSettings(usageSettings)
    console.log('✅ Usage tracking configured')
    console.log('   Token tracking:', usageSettings.usage.trackTokens)
    console.log('   Cost tracking:', usageSettings.usage.trackCosts)
    console.log('   Reset interval:', usageSettings.usage.resetInterval)

    // Get updated settings to verify changes
    console.log('\n🔍 Verifying updated settings...')
    const updatedSettings = await settingsManager.getSettings()
    
    console.log('✅ Settings verification:')
    console.log('   Anthropic enabled:', updatedSettings.providers?.anthropic?.enabled)
    console.log('   Theme:', updatedSettings.ui?.theme)
    console.log('   Global hotkey:', updatedSettings.keyboard?.globalHotkey)
    console.log('   Usage tracking:', updatedSettings.usage?.trackTokens)

    // Example: Check for settings corruption
    console.log('\n🔍 Checking settings integrity...')
    const corruptionStatus = await settingsManager.getCorruptionStatus()
    
    if (corruptionStatus.isCorrupted) {
      console.log('❌ Settings corruption detected:')
      console.log('   Error:', corruptionStatus.error)
      console.log('   Path:', corruptionStatus.settingsPath)
      console.log('   Backup available:', corruptionStatus.hasBackup)
    } else {
      console.log('✅ Settings integrity check passed')
      console.log('   Settings path:', corruptionStatus.settingsPath)
      console.log('   File size:', corruptionStatus.fileSize, 'bytes')
    }

    // Example: Export settings for backup
    console.log('\n💾 Exporting settings for backup...')
    const exportedSettings = await settingsManager.getSettings()
    const settingsJson = JSON.stringify(exportedSettings, null, 2)
    
    console.log('✅ Settings exported (sample):')
    console.log('   Settings size:', settingsJson.length, 'characters')
    console.log('   Providers:', Object.keys(exportedSettings.providers || {}).join(', '))
    console.log('   First 200 chars:', settingsJson.substring(0, 200) + '...')

    // Example: Reset specific settings section
    console.log('\n🔄 Demonstrating partial settings reset...')
    const resetUiSettings = {
      ui: {
        theme: 'system',
        fontSize: 'medium',
        sidebarWidth: 240,
        showUsageStats: false,
        enableAnimations: true,
        compactMode: false
      }
    }

    await settingsManager.updateSettings(resetUiSettings)
    console.log('✅ UI settings reset to defaults')

    // Final settings summary
    console.log('\n📋 Final settings summary:')
    const finalSettings = await settingsManager.getSettings()
    console.log('   Configured providers:', Object.keys(finalSettings.providers || {}).length)
    console.log('   Theme:', finalSettings.ui?.theme)
    console.log('   Global hotkey configured:', !!finalSettings.keyboard?.globalHotkey)
    console.log('   Usage tracking enabled:', finalSettings.usage?.trackTokens)

  } catch (error) {
    console.error('❌ Error in settings example:', error.message)
    
    // Try to get corruption status for debugging
    try {
      const corruptionStatus = await settingsManager.getCorruptionStatus()
      if (corruptionStatus.isCorrupted) {
        console.error('   Settings corruption detected during error handling')
        console.error('   Corruption details:', corruptionStatus.error)
      }
    } catch (statusError) {
      console.error('   Could not check corruption status:', statusError.message)
    }
  }
}

// Helper function to demonstrate settings validation
function validateSettings(settings) {
  const errors = []
  
  // Validate providers
  if (settings.providers) {
    Object.entries(settings.providers).forEach(([providerId, config]) => {
      if (!config.apiKey || config.apiKey.length < 10) {
        errors.push(`Provider ${providerId}: API key appears invalid`)
      }
      if (!Array.isArray(config.models) || config.models.length === 0) {
        errors.push(`Provider ${providerId}: No models configured`)
      }
    })
  }
  
  // Validate UI settings
  if (settings.ui) {
    const validThemes = ['light', 'dark', 'system']
    if (settings.ui.theme && !validThemes.includes(settings.ui.theme)) {
      errors.push(`UI: Invalid theme "${settings.ui.theme}"`)
    }
    
    if (settings.ui.sidebarWidth && (settings.ui.sidebarWidth < 200 || settings.ui.sidebarWidth > 500)) {
      errors.push(`UI: Sidebar width ${settings.ui.sidebarWidth} is out of range`)
    }
  }
  
  return errors
}

// Run the example if this file is executed directly
if (require.main === module) {
  settingsManagementExample()
    .then(() => {
      console.log('\n✅ Settings example completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Settings example failed:', error)
      process.exit(1)
    })
}

module.exports = { settingsManagementExample, validateSettings }