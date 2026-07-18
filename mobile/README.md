# ApplyGuard PH — Mobile App (Capacitor)

This directory contains the Capacitor configuration for building ApplyGuard PH as a native iOS/Android app. The same React SPA codebase powers both the web app and the mobile app.

## Prerequisites

- Node.js 20+
- **iOS:** Xcode 15+ (macOS only)
- **Android:** Android Studio + JDK 17+

## Quick Start

```bash
# 1. Build the web app
npm run build

# 2. Add platforms (first time only)
npx cap add ios
npx cap add android

# 3. Sync web assets into native projects
npx cap sync

# 4. Open native IDE
npx cap open ios     # opens Xcode
npx cap open android # opens Android Studio
```

## Platform-specific notes

### iOS
- Open `ios/App/App.xcworkspace` in Xcode
- Set Team under Signing & Capabilities
- Build target: `App` on a connected device or simulator

### Android
- Open `android/` in Android Studio
- Accept Gradle sync prompts
- Build target: `app` on emulator or connected device

## Live Reload (development)

To run the mobile app pointing at your local dev server:

```bash
npm run dev                                    # in one terminal
npx cap copy                                   # copy web assets
npx cap sync                                   # sync plugins
```

Then in `capacitor.config.ts`, set:
```ts
server: { url: "http://192.168.x.x:5173", cleartext: true }
```

## App ID & Signing

- **App ID:** `ph.applyguard.app`
- **iOS Bundle ID:** `ph.applyguard.app`
- **Android Package:** `ph.applyguard.app`

Update these in `capacitor.config.ts` before publishing.

## Plugins Used

| Plugin | Purpose |
|--------|---------|
| `@capacitor/status-bar` | Native status bar styling (dark, brand green) |
| `@capacitor/splash-screen` | Launch screen with brand colors |

## Icon & Splash Assets

Run `npx @capacitor/assets generate` after placing a 1024×1024 `icon.png` and 2732×2732 `splash.png` in `resources/`.
