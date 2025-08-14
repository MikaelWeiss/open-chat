# iOS Navigation Patterns

## Overview
Replace desktop sidebar navigation with iOS-native navigation patterns including navigation stack, modal presentations, and proper iOS gestures.

## Current State
- Fixed sidebar with resizing functionality
- Desktop-style conversation list
- No iOS navigation patterns

## Implementation

### 1. Mobile Navigation Stack
Create `src/components/Mobile/NavigationStack.tsx`:
- Stack-based navigation with push/pop animations
- iOS-style navigation bar with back buttons
- Proper iOS navigation transitions

### 2. iOS Conversation List
Transform `Sidebar.tsx` into mobile-friendly conversation list:
- Full-screen conversation list view
- iOS-style section headers
- Swipe actions for delete/favorite
- Pull-to-refresh functionality
- Large title navigation bar

### 3. Modal Presentations
Update modals to use iOS presentation styles:
- Sheet presentations for settings
- Full-screen modals for onboarding
- Proper iOS modal dismissal gestures

### 4. Tab Bar Navigation (Optional)
Consider iOS tab bar for main navigation:
- Conversations tab
- Settings tab
- Potentially other features

## Files to Modify
- `src/components/Mobile/NavigationStack.tsx` - New navigation component
- `src/components/Mobile/ConversationListView.tsx` - Mobile conversation list
- `src/components/Sidebar/Sidebar.tsx` - Add mobile conditional rendering
- `src/App.tsx` - Integrate mobile navigation

## Design Considerations
- Use iOS Human Interface Guidelines spacing (8pt grid)
- iOS-style typography (SF Pro Display/Text)
- Native iOS gestures and animations
- Proper safe area handling

## Success Criteria
- Navigation feels native to iOS
- Smooth transitions between views
- Proper back button behavior
- iOS-style swipe gestures work correctly