# Disable Desktop-Only Features

## Overview
Identify and disable features that don't work or aren't appropriate for iOS mobile, ensuring a clean mobile experience.

## Features to Disable on Mobile

### 1. Mini Window Functionality
- Disable mini window mode detection and UI
- Remove URL parameter handling for `?window=mini`
- Hide mini window related menu items

### 2. Local Model Support (Ollama)
- Disable Ollama service initialization on mobile
- Hide local provider settings in mobile UI
- Remove Ollama auto-start and cleanup logic
- Show appropriate messaging about cloud-only models

### 3. Window Management
- Disable window resizing functionality
- Remove window dragging capabilities
- Hide window controls and decorations
- Remove updater functionality (iOS handles updates)

### 4. Desktop Context Menus
- Replace desktop context menus with iOS action sheets
- Remove right-click context menu handlers
- Implement long-press alternatives

### 5. File System Access
- Remove file drag-and-drop functionality
- Disable desktop file picker (use iOS photo picker instead)
- Remove file path display and management

## Implementation

### 1. Feature Detection Service
Create `src/utils/featureFlags.ts`:
```typescript
import { isMobile, isIOS } from './platformDetection'

export const features = {
  miniWindow: !isMobile(),
  localModels: !isMobile(),
  windowManagement: !isMobile(),
  fileSystem: !isMobile(),
  desktopContextMenus: !isMobile(),
  keyboardShortcuts: !isMobile(),
  dragAndDrop: !isMobile(),
  autoUpdater: !isMobile()
}
```

### 2. Conditional Feature Loading
Update components to check feature flags:
- Wrap desktop-only imports in feature checks
- Conditionally render desktop-specific UI elements
- Show appropriate mobile alternatives

### 3. Service Initialization
Update `src/App.tsx` initialization:
- Skip Ollama service on mobile
- Skip updater checks on mobile
- Skip window management setup on mobile

## Files to Modify
- `src/utils/featureFlags.ts` - New feature flag system
- `src/App.tsx` - Conditional service initialization
- `src/services/ollamaService.ts` - Add mobile checks
- `src/components/Settings/LocalProviderSettings.tsx` - Hide on mobile
- `src/utils/windowManager.ts` - Add mobile guards

## User Experience
- Clean mobile interface without confusing desktop features
- Appropriate messaging when desktop features aren't available
- iOS-native alternatives for essential functionality
- No broken or non-functional UI elements

## Success Criteria
- No desktop-only features visible on mobile
- No console errors from disabled services
- Appropriate user messaging for unavailable features
- Clean, focused mobile experience