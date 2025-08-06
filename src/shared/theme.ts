// Shared theme utilities that will be split into a common chunk
export const applyTheme = (theme: string) => {
  const root = document.documentElement
  
  // First remove any existing theme class
  root.classList.remove('dark')
  
  // Force a reflow to ensure the class removal is applied
  root.offsetHeight
  
  if (theme === 'system') {
    // Use system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (systemPrefersDark) {
      root.classList.add('dark')
    }
  } else if (theme === 'dark') {
    root.classList.add('dark')
  } else { /* Light theme, dark class already removed */ }
  
  // Force a reflow to ensure the class addition is applied
  root.offsetHeight
}

export const setupSystemThemeListener = (currentTheme: string) => {
  if (currentTheme !== 'system') return null

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  mediaQuery.addEventListener('change', handleSystemThemeChange)
  return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
}