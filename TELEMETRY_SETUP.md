# TelemetryDeck Analytics Setup

This document explains the TelemetryDeck analytics integration for tracking daily active users.

## Implementation

TelemetryDeck analytics has been integrated into the main Electron process (`src/main/main.js`) to track daily active users.

### Configuration

1. **App ID Required**: You need to replace `YOUR_TELEMETRY_DECK_APP_ID` on line 18 of `src/main/main.js` with your actual TelemetryDeck App ID from your dashboard.

2. **User Identification**: Currently using a simple anonymous identifier (`'anonymous-user'`). TelemetryDeck automatically hashes this for privacy.

### Tracked Events

- `app.launched` - Fired when the app first starts
- `app.activated` - Fired when the app is activated (e.g., clicked from dock on macOS)

### Getting Your App ID

1. Go to [TelemetryDeck Dashboard](https://dashboard.telemetrydeck.com)
2. Create or select your app
3. Copy the App ID
4. Replace `YOUR_TELEMETRY_DECK_APP_ID` in the code

### Privacy

- User identifiers are cryptographically anonymized
- No personal data is sent to TelemetryDeck
- Only usage analytics (app launches/activations) are tracked

### Dependencies

- `@telemetrydeck/sdk` v2.0.4 - Added to package.json
- Node.js `crypto` module for Electron compatibility