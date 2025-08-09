import { check } from '@tauri-apps/plugin-updater'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { relaunch } from '@tauri-apps/plugin-process'

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
    // Re-throw the error so the UI can handle it properly
    throw new Error(`Update check failed: ${error}`)
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
    await promptAndInstallUpdate()
  }, 3000) // 3 second delay
}