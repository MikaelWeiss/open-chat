# iOS Safe Area Handling

## Overview
Implement proper iOS safe area handling for all screen sizes including iPhone X-style notches, Dynamic Island, and home indicator.

## Current State
- No safe area considerations
- Fixed positioning may interfere with iOS system UI
- Content may be obscured by notches/status bar

## Implementation

### 1. Safe Area CSS Variables
Create `src/styles/safe-area.css`:
```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-right: env(safe-area-inset-right);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
}

.safe-area-top {
  padding-top: var(--safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: var(--safe-area-inset-bottom);
}

.safe-area-full {
  padding-top: var(--safe-area-inset-top);
  padding-right: var(--safe-area-inset-right);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
}
```

### 2. Navigation Bar Safe Area
Update navigation components:
- Add safe area padding to top navigation bars
- Ensure navigation buttons don't overlap notch/Dynamic Island
- Proper spacing from status bar

### 3. Chat Input Safe Area
Update message input positioning:
- Account for home indicator on bottom
- Keyboard-aware positioning with safe areas
- Proper spacing from bottom of screen

### 4. Modal Safe Area Handling
Update modal presentations:
- Sheet modals respect safe areas automatically
- Full-screen modals need manual safe area handling
- Action sheets positioned correctly above home indicator

### 5. Responsive Safe Area Handling
Handle different iPhone models:
- iPhone models without notch (iPhone 8 and earlier)
- iPhone X-style notch models
- iPhone 14 Pro Dynamic Island
- Future iPhone form factors

## Files to Modify
- `src/styles/safe-area.css` - New safe area styles
- `src/components/Chat/ChatView.tsx` - Safe area in chat
- `src/components/Chat/MessageInput.tsx` - Input safe area
- `src/components/Mobile/NavigationStack.tsx` - Navigation safe area
- `tailwind.config.js` - Add safe area utilities

## Tailwind Configuration
Add safe area utilities to Tailwind:
```javascript
module.exports = {
  theme: {
    extend: {
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
    }
  }
}
```

## Testing Considerations
- Test on various iPhone simulators
- Verify safe area handling in landscape orientation
- Test with accessibility features (larger text, etc.)
- Ensure proper handling when keyboard is shown

## Success Criteria
- No content obscured by notch, Dynamic Island, or status bar
- Proper spacing from home indicator
- Navigation elements are always accessible
- Clean appearance on all iPhone models