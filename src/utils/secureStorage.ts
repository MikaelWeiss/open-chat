// Platform-specific keychain imports
import { getPassword, setPassword, deletePassword } from "tauri-plugin-keyring-api"
import { invoke } from '@tauri-apps/api/core'
import { BaseDirectory, readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs'

const SERVICE_NAME = "open-chat"
const KEYS_FILE = "keys.enc"

// Check if we're in development mode
const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'

// Platform detection
async function getPlatform(): Promise<string> {
  try {
    const { platform } = await import('@tauri-apps/plugin-os')
    return await platform()
  } catch {
    // Fallback for older versions or if plugin not available
    return 'unknown'
  }
}

// Check if we're on mobile platform
async function isMobilePlatform(): Promise<boolean> {
  const platformName = await getPlatform()
  return platformName === 'ios' || platformName === 'android'
}

// Simple XOR encryption for dev mode storage
const ENCRYPTION_KEY = "open-chat-2024-secure-key-storage-v1-dev-only"

function simpleEncrypt(text: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    )
  }
  return btoa(result) // Base64 encode for storage
}

function simpleDecrypt(encrypted: string): string {
  try {
    const decoded = atob(encrypted) // Base64 decode
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      )
    }
    return result
  } catch (error) {
    console.error('Failed to decrypt:', error)
    return ''
  }
}

// In-memory cache for API keys (used in both dev and prod for performance)
const keyCache = new Map<string, string>()
let devKeysData: Record<string, string> = {}
let devInitialized = false

async function loadDevKeys(): Promise<void> {
  try {
    if (await exists(KEYS_FILE, { baseDir: BaseDirectory.AppData })) {
      const encrypted = await readTextFile(KEYS_FILE, { baseDir: BaseDirectory.AppData })
      const decrypted = simpleDecrypt(encrypted)
      if (decrypted) {
        devKeysData = JSON.parse(decrypted)
        // Populate cache
        Object.entries(devKeysData).forEach(([key, value]) => {
          keyCache.set(key, value)
        })
      }
    }
  } catch (error) {
    console.error('Failed to load dev keys:', error)
    devKeysData = {}
  }
}

async function saveDevKeys(): Promise<void> {
  try {
    const encrypted = simpleEncrypt(JSON.stringify(devKeysData))
    await writeTextFile(KEYS_FILE, encrypted, { baseDir: BaseDirectory.AppData })
  } catch (error) {
    console.error('Failed to save dev keys:', error)
    throw error
  }
}

async function ensureDevInitialized() {
  if (!devInitialized) {
    await loadDevKeys()
    devInitialized = true
  }
}

/**
 * Save an API key - uses encrypted file in dev, keychain in prod
 */
export async function saveApiKey(providerId: string, apiKey: string): Promise<void> {
  const key = `provider-${providerId}`
  
  try {
    if (isDev) {
      // Development: Use encrypted file storage
      await ensureDevInitialized()
      devKeysData[key] = apiKey
      keyCache.set(key, apiKey)
      await saveDevKeys()
      console.log(`[DEV MODE] Saved API key for ${providerId} to encrypted file`)
    } else {
      // Production: Use platform-specific keychain
      const isMobile = await isMobilePlatform()
      
      if (isMobile) {
        // Mobile: Use keychain plugin (iOS/Android)
        await invoke('plugin:keychain|save_item', { key, password: apiKey })
        keyCache.set(key, apiKey)
        console.log(`Saved API key for ${providerId} to mobile keychain`)
      } else {
        // Desktop: Use keyring plugin (Windows/macOS/Linux)
        await setPassword(SERVICE_NAME, key, apiKey)
        keyCache.set(key, apiKey)
        console.log(`Saved API key for ${providerId} to desktop keyring`)
      }
    }
  } catch (error) {
    console.error(`Failed to save API key for provider ${providerId}:`, error)
    throw new Error(`Failed to save API key: ${error}`)
  }
}

/**
 * Retrieve an API key - uses encrypted file in dev, keychain in prod
 */
export async function getApiKey(providerId: string): Promise<string | null> {
  const key = `provider-${providerId}`
  
  // Check cache first (for both dev and prod)
  if (keyCache.has(key)) {
    return keyCache.get(key) || null
  }
  
  try {
    if (isDev) {
      // Development: Use encrypted file storage
      await ensureDevInitialized()
      const value = devKeysData[key] || null
      if (value) {
        keyCache.set(key, value)
      }
      return value
    } else {
      // Production: Use platform-specific keychain
      const isMobile = await isMobilePlatform()
      
      if (isMobile) {
        // Mobile: Use keychain plugin (iOS/Android)
        const result = await invoke<string>('plugin:keychain|get_item', { key })
        if (result) {
          keyCache.set(key, result)
        }
        return result || null
      } else {
        // Desktop: Use keyring plugin (Windows/macOS/Linux)
        const value = await getPassword(SERVICE_NAME, key)
        if (value) {
          keyCache.set(key, value)
        }
        return value
      }
    }
  } catch (error) {
    console.error(`Failed to get API key for provider ${providerId}:`, error)
    return null
  }
}

/**
 * Delete an API key - uses encrypted file in dev, keychain in prod
 */
export async function deleteApiKey(providerId: string): Promise<void> {
  const key = `provider-${providerId}`
  
  try {
    keyCache.delete(key) // Clear cache in both modes
    
    if (isDev) {
      // Development: Use encrypted file storage
      await ensureDevInitialized()
      delete devKeysData[key]
      await saveDevKeys()
      console.log(`[DEV MODE] Deleted API key for ${providerId} from encrypted file`)
    } else {
      // Production: Use platform-specific keychain
      const isMobile = await isMobilePlatform()
      
      if (isMobile) {
        // Mobile: Use keychain plugin (iOS/Android)
        await invoke('plugin:keychain|remove_item', { key })
        console.log(`Deleted API key for ${providerId} from mobile keychain`)
      } else {
        // Desktop: Use keyring plugin (Windows/macOS/Linux)
        await deletePassword(SERVICE_NAME, key)
        console.log(`Deleted API key for ${providerId} from desktop keyring`)
      }
    }
  } catch (error) {
    console.error(`Failed to delete API key for provider ${providerId}:`, error)
    throw new Error(`Failed to delete API key: ${error}`)
  }
}

/**
 * Check if an API key exists - uses encrypted file in dev, keychain in prod
 */
export async function hasApiKey(providerId: string): Promise<boolean> {
  const key = `provider-${providerId}`
  
  // Check cache first
  if (keyCache.has(key)) {
    return true
  }
  
  try {
    if (isDev) {
      // Development: Use encrypted file storage
      await ensureDevInitialized()
      return key in devKeysData
    } else {
      // Production: Use platform-specific keychain
      const isMobile = await isMobilePlatform()
      
      if (isMobile) {
        // Mobile: Use keychain plugin (iOS/Android)
        const result = await invoke<string>('plugin:keychain|get_item', { key })
        return result !== null && result !== undefined && result.trim() !== ''
      } else {
        // Desktop: Use keyring plugin (Windows/macOS/Linux)
        const apiKey = await getPassword(SERVICE_NAME, key)
        return apiKey !== null && apiKey !== undefined && apiKey.trim() !== ''
      }
    }
  } catch (error) {
    return false
  }
}