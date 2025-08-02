// Shared constants that will be split into a common chunk
export const APP_NAME = 'Open Chat'
export const APP_VERSION = '1.0.0'

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