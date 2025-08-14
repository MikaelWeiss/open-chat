# iOS Theme System Adaptation

## Overview
Adapt the current theme system to match iOS design patterns with proper iOS colors, typography, and visual hierarchy.

## Current State
- Custom light/dark theme system
- Desktop-oriented color palette
- Non-iOS typography and spacing

## Requirements

### 1. iOS System Colors
- Replace custom colors with iOS semantic colors
- Support iOS Dynamic Type color system
- Implement proper iOS light/dark mode colors
- Use iOS accent colors and system grays

### 2. iOS Typography System
- Implement iOS text styles (Large Title, Title 1-3, Headline, Body, etc.)
- Support Dynamic Type sizing
- Use iOS-appropriate font weights
- Proper line height and letter spacing

### 3. iOS Visual Hierarchy
- Implement iOS elevation and depth principles
- Use iOS-appropriate shadows and borders
- Proper iOS corner radius standards
- iOS-style button and control styling

### 4. iOS Dark Mode
- Ensure proper iOS dark mode color handling
- Support iOS automatic theme switching
- Proper contrast ratios for accessibility
- iOS-style dark mode transitions

## Files to Modify
- `src/shared/theme.ts` - Update with iOS color system
- `tailwind.config.js` - Add iOS design tokens
- `src/styles/ios-theme.css` - New iOS-specific styles
- All component files - Apply iOS styling patterns

## Design Requirements
- Follow iOS Human Interface Guidelines exactly
- Use iOS 17+ design patterns
- Proper accessibility contrast ratios
- Support for iOS accessibility features

## Success Criteria
- App visually matches iOS system apps
- Proper iOS Dynamic Type support
- Seamless light/dark mode transitions
- Accessibility compliance with iOS standards