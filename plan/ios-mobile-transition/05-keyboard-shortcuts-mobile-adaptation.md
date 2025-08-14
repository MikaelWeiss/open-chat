# Keyboard Shortcuts Mobile Adaptation

## Overview
Disable desktop keyboard shortcuts on mobile and replace with iOS-appropriate gestures and touch interactions.

## Current State
- Desktop keyboard shortcuts throughout the app
- Shortcuts modal for reference
- No touch/gesture alternatives

## Implementation

### 1. Mobile Input Detection
Update `src/hooks/useKeyboardShortcuts.tsx`:
- Detect mobile platform and disable desktop shortcuts
- Maintain essential shortcuts for external keyboards
- Add mobile-specific gesture handling

### 2. Essential Mobile Shortcuts
Keep only relevant shortcuts for external keyboard users:
- `Cmd+N` - New conversation (if external keyboard)
- `Cmd+L` - Focus input
- `Escape` - Dismiss modals/keyboards

### 3. Touch Gesture Replacements
Replace keyboard shortcuts with iOS gestures:
- **New Conversation**: Pull down on conversation list
- **Toggle Settings**: Navigation bar button
- **Focus Input**: Tap input area
- **Close Modal**: Swipe down or tap outside

### 4. iOS Gesture Library
Create `src/utils/gestures.ts`:
- Swipe gesture detection
- Long press handling
- Pull-to-refresh implementation
- iOS-style gesture recognition

### 5. Haptic Feedback
Add iOS haptic feedback for interactions:
- Light haptic for button taps
- Medium haptic for gesture completion
- Heavy haptic for important actions
- Selection haptic for list navigation

## Files to Modify
- `src/hooks/useKeyboardShortcuts.tsx` - Mobile adaptations
- `src/utils/gestures.ts` - New gesture utilities
- `src/components/Shortcuts/ShortcutsModal.tsx` - Mobile conditional rendering
- `src/App.tsx` - Update shortcut initialization

## Mobile Gesture Patterns
- **Swipe down**: Dismiss modals/keyboard
- **Pull down**: Refresh or new conversation
- **Swipe left**: Delete/archive actions
- **Long press**: Context menus
- **Pinch**: Not applicable for this app

## Success Criteria
- No desktop keyboard shortcuts interfere on mobile
- Essential shortcuts work with external keyboards
- iOS gestures replace keyboard functionality
- Proper haptic feedback throughout the app