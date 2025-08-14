# Mobile Settings Interface

## Overview
Redesign the settings interface to follow iOS conventions with native list styles, proper navigation, and mobile-optimized interactions.

## Current State
- Desktop modal-based settings
- Multi-column layout
- Desktop-style form elements
- Not optimized for touch interaction

## Implementation

### 1. iOS Settings Navigation
Create `src/components/Mobile/Settings/MobileSettingsView.tsx`:
- iOS-style grouped table view
- Navigation stack for sub-settings
- Proper iOS section headers and footers
- Native iOS disclosure indicators

### 2. Settings List Groups
Transform settings into iOS-grouped lists:
- **General Settings Group**
  - Theme selection (iOS picker style)
  - Name input (iOS text field)
  - Privacy policy (disclosure)
- **AI Providers Group**
  - Provider list with disclosure indicators
  - Add provider button (iOS style)
  - Provider configuration screens
- **About Group**
  - App version
  - Links to support/feedback

### 3. Provider Configuration
Create mobile provider setup screens:
- Full-screen provider config
- iOS-style form fields
- Native API key input (secure)
- Model selection picker
- Test connection button

### 4. iOS Form Elements
Replace desktop form elements with iOS equivalents:
- UISegmentedControl for theme selection
- UITextField for text inputs
- UISwitch for toggles
- UIPickerView for model selection
- Native alert dialogs

### 5. Navigation Patterns
- Push/pop navigation between settings screens
- iOS-style back buttons with proper titles
- Sheet presentation for some modals
- Proper iOS navigation bar styling

## Files to Modify
- `src/components/Mobile/Settings/MobileSettingsView.tsx` - New mobile settings
- `src/components/Mobile/Settings/ProviderConfigView.tsx` - Provider setup
- `src/components/Settings/SettingsModal.tsx` - Add mobile conditional rendering
- `src/components/Mobile/Settings/SettingsListGroup.tsx` - iOS list component

## Design Considerations
- Use iOS system colors and typography
- Proper iOS table view styling
- Native iOS form validation
- iOS-style error handling and alerts
- Accessibility with VoiceOver support

## Success Criteria
- Settings look identical to iOS Settings app
- Smooth navigation between settings screens
- Proper iOS form interactions
- All provider configuration works on mobile