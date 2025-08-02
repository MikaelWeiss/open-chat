import { useMemo } from 'react'

interface UsePlatformInfoReturn {
  isMac: boolean
  modifierKey: string
  getModifierKeyLabel: () => string
}

export function usePlatformInfo(): UsePlatformInfoReturn {
  const isMac = useMemo(() => 
    navigator.platform.toUpperCase().indexOf('MAC') >= 0, 
    []
  )

  const modifierKey = useMemo(() => 
    isMac ? '⌘' : 'Ctrl', 
    [isMac]
  )

  const getModifierKeyLabel = useMemo(() => () => 
    isMac ? 'Cmd' : 'Ctrl', 
    [isMac]
  )

  return {
    isMac,
    modifierKey,
    getModifierKeyLabel
  }
}