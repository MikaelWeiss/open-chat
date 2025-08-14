# Mobile Detection & Platform Awareness

## Overview
Implement mobile platform detection and conditionally render UI components based on whether the app is running on iOS mobile vs desktop.

## Current State
- App has basic `isMiniWindow` detection via URL parameters
- No iOS mobile platform detection
- Desktop-oriented layout and interactions

## Implementation

### 1. Platform Detection Service
Create `src/utils/platformDetection.ts`:
```typescript
export const isMobile = () => {
  // Tauri mobile detection
  return navigator.userAgent.includes('Mobile') || window.innerWidth < 768
}

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export const isTauriMobile = () => {
  return window.__TAURI__ && isMobile()
}
```

### 2. Update App.tsx
- Add mobile detection hook
- Conditionally disable desktop-only features on mobile:
  - Mini window functionality
  - Window dragging/resizing
  - Desktop keyboard shortcuts
  - Ollama auto-start (mobile doesn't support local models)

### 3. Mobile-Specific Constants
Update `src/shared/constants.ts`:
- Add mobile-specific dimensions
- Mobile-friendly touch targets (44px minimum)
- iOS-specific spacing standards

## Files to Modify
- `src/App.tsx` - Add mobile detection and conditional logic
- `src/shared/constants.ts` - Add mobile constants
- `src/utils/platformDetection.ts` - New file for platform detection

## Success Criteria
- App detects iOS mobile platform correctly
- Desktop-only features are disabled on mobile
- Mobile-specific UI patterns are enabled
- No console errors related to missing desktop APIs on mobile