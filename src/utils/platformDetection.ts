export const isMobile = () => {
  // Tauri mobile detection
  return navigator.userAgent.includes('Mobile') || window.innerWidth < 768
}

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export const isTauriMobile = () => {
  return (window as any).__TAURI__ && isMobile()
}

export const isDesktop = () => {
  return !isMobile()
}

export const getPlatform = () => {
  if (isIOS()) return 'ios'
  if (isMobile()) return 'mobile'
  return 'desktop'
}