// Shared constants that will be split into a common chunk
export const APP_NAME = 'Open Chat'
export const APP_VERSION = '0.1.0'

export const KEYBOARD_SHORTCUTS = {
  NEW_CONVERSATION: { mac: '⌘N', pc: 'Ctrl+N' },
  NEW_CONVERSATION_ALT: { mac: '⌘T', pc: 'Ctrl+T' },
  TOGGLE_SETTINGS: { mac: '⌘,', pc: 'Ctrl+,' },
  SHOW_SHORTCUTS: { mac: '⌘/', pc: 'Ctrl+/' },
  FOCUS_INPUT: { mac: '⌘L', pc: 'Ctrl+L' },
  TOGGLE_SIDEBAR: { mac: '⌘S', pc: 'Ctrl+S' },
  ESCAPE: 'Esc'
} as const

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
] as const

export const DEFAULT_SIDEBAR_WIDTH = 320

// TelemetryDeck Configuration
export const TELEMETRY_CONFIG = {
  // Replace with your actual TelemetryDeck App ID
  APP_ID: '5E5DB279-2E23-4ADC-83FF-281CDB44D606',
  // Enable test mode in development
  TEST_MODE: import.meta.env.DEV || false,
} as const
