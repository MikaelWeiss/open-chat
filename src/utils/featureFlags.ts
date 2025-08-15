import { isMobile, isIOS } from './platformDetection'

export const features = {
  miniWindow: !isMobile(),
  localModels: !isMobile(),
  windowManagement: !isMobile(),
  fileSystem: !isMobile(),
  desktopContextMenus: !isMobile(),
  keyboardShortcuts: !isMobile(),
  dragAndDrop: !isMobile(),
  autoUpdater: !isMobile(),
  sidebar: !isMobile(),
  windowControls: !isMobile(),
  desktopModals: !isMobile(),
  rightClickMenus: !isMobile(),
  filePickerNative: !isMobile(),
  multiWindow: !isMobile()
}

export const mobileFeatures = {
  iosNavigation: isIOS(),
  touchGestures: isMobile(),
  hapticFeedback: isIOS(),
  safeArea: isIOS(),
  mobileKeyboard: isMobile(),
  pullToRefresh: isMobile(),
  swipeActions: isMobile(),
  actionSheets: isIOS(),
  sheets: isIOS(),
  largeTitle: isIOS()
}