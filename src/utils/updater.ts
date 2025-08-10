import { check } from '@tauri-apps/plugin-updater'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { relaunch } from '@tauri-apps/plugin-process'
import { settings } from '../shared/settingsStore'
import { AppSettings } from '../hooks/useSettings'

export interface UpdateInfo {
  version: string
  body: string
  date: string
}

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const update = await check()
    
    if (update?.available) {
      return {
        version: update.version,
        body: update.body || 'New version available',
        date: update.date || new Date().toISOString()
      }
    }
    
    return null
  } catch (error) {
    console.error('Error checking for updates:', error)
    // Return null instead of throwing to handle network errors gracefully
    return null
  }
}

export async function promptAndInstallUpdate(): Promise<boolean> {
  try {
    const update = await check()
    
    if (!update?.available) {
      return false
    }

    const shouldUpdate = await ask(
      `Update to version ${update.version} is available!\n\n${update.body}\n\nWould you like to download and install it now?\n\nThe app will restart automatically after the update.`,
      {
        title: 'Update Available',
        kind: 'info',
        okLabel: 'Update Now',
        cancelLabel: 'Later'
      }
    )

    if (shouldUpdate) {
      await message('Downloading update...', {
        title: 'Updating',
        kind: 'info'
      })

      // Download and install the update
      await update.downloadAndInstall()
      
      // Relaunch the application
      await relaunch()
      
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error installing update:', error)
    
    await message(
      'Failed to install update. Please try again later or download manually.',
      {
        title: 'Update Error',
        kind: 'error'
      }
    )
    
    return false
  }
}

export async function checkForUpdatesOnStartup(): Promise<void> {
  // Wait a bit after startup to check for updates
  setTimeout(async () => {
    try {
      // Check if auto-update is enabled in settings
      const appSettings = await settings.get<AppSettings>('settings')
      if (!appSettings?.checkForUpdates) {
        console.log('Update check disabled in settings')
        return
      }

      const update = await check()
      
      if (update?.available) {
        if (appSettings?.autoUpdate) {
          // Auto-install update if enabled
          await message(
            `Downloading and installing update to version ${update.version}...`,
            {
              title: 'Auto-Update',
              kind: 'info'
            }
          )
          
          await update.downloadAndInstall()
          await relaunch()
        } else {
          // Just prompt the user if auto-update is disabled
          await promptAndInstallUpdate()
        }
      }
    } catch (error) {
      console.error('Failed to check for updates on startup:', error)
      // Don't show error dialogs on startup - fail silently
    }
  }, 3000) // 3 second delay
}