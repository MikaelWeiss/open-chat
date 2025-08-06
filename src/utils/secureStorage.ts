import { getPassword, setPassword, deletePassword } from "tauri-plugin-keyring-api"

const SERVICE_NAME = "open-chat"

/**
 * Save an API key to the system keychain
 */
export async function saveApiKey(providerId: string, apiKey: string): Promise<void> {
  try {
    await setPassword(SERVICE_NAME, `provider-${providerId}`, apiKey)
  } catch (error) {
    console.error(`Failed to save API key for provider ${providerId}:`, error)
    throw new Error(`Failed to save API key: ${error}`)
  }
}

/**
 * Retrieve an API key from the system keychain
 */
export async function getApiKey(providerId: string): Promise<string | null> {
  try {
    return await getPassword(SERVICE_NAME, `provider-${providerId}`)
  } catch (error) {
    console.error(`Failed to get API key for provider ${providerId}:`, error)
    return null
  }
}

/**
 * Delete an API key from the system keychain
 */
export async function deleteApiKey(providerId: string): Promise<void> {
  try {
    await deletePassword(SERVICE_NAME, `provider-${providerId}`)
  } catch (error) {
    console.error(`Failed to delete API key for provider ${providerId}:`, error)
    throw new Error(`Failed to delete API key: ${error}`)
  }
}

/**
 * Check if an API key exists in the system keychain
 */
export async function hasApiKey(providerId: string): Promise<boolean> {
  try {
    const apiKey = await getPassword(SERVICE_NAME, `provider-${providerId}`)
    return apiKey !== null && apiKey !== undefined && apiKey.trim() !== ''
  } catch (error) {
    return false
  }
}