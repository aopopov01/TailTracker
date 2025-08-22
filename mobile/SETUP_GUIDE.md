# TailTracker Mobile App Setup Guide

## 100% Self-Contained App Store Ready Configuration

This guide provides step-by-step instructions to configure TailTracker for app store submission without any external domain dependencies.

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the environment template:

```bash
cp .env.template .env.local
```

Edit `.env.local` and add your API keys (see configuration sections below).

### 3. Configure EAS Build

```bash
eas login
eas build:configure
```

### 4. Run Development Server

```bash
# Start Metro bundler
npm start

# Run on specific platform
npm run android  # Android emulator
npm run ios      # iOS simulator
```

## Required Service Configuration

### 1. Expo/EAS Configuration

**Required for: App building and distribution**

1. Create account at [expo.dev](https://expo.dev)
2. Create new project or link existing one
3. Get project ID from project settings
4. Add to `.env.local`:
   ```
   EAS_PROJECT_ID=your-expo-project-id-here
   ```

### 2. Google Maps Platform

**Required for: Location tracking, maps, and geofencing**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
   - Geocoding API
4. Create API key in "Credentials" section
5. Restrict API key to your app bundle IDs:
   - Android: `com.tailtracker.app`
   - iOS: `com.tailtracker.app`
6. Add to `.env.local`:
   ```
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   ```

### 3. Supabase Backend

**Required for: Database, authentication, file storage**

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Project Settings > API
4. Copy URL and anon key
5. Add to `.env.local`:
   ```
   SUPABASE_URL=your-supabase-project-url-here
   SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

### 4. Firebase Configuration

**Required for: Push notifications, analytics, crash reporting**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Authentication (optional providers)
4. Enable Cloud Messaging
5. Add apps for both Android and iOS
6. Download configuration files:
   - `google-services.json` → `android/app/`
   - `GoogleService-Info.plist` → `ios/`
7. Get config values from Project Settings
8. Add to `.env.local`:
   ```
   FIREBASE_API_KEY=your-firebase-api-key-here
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
   FIREBASE_APP_ID=your-firebase-app-id-here
   ```

## Optional Service Configuration

### 5. RevenueCat (for Premium Features)

**Optional: Only needed if implementing premium subscriptions**

1. Create account at [revenuecat.com](https://revenuecat.com)
2. Create new project
3. Configure store integrations:
   - Apple App Store (for iOS in-app purchases)
   - Google Play Store (for Android in-app purchases)
4. Get API key from project settings
5. Add to `.env.local`:
   ```
   REVENUECAT_API_KEY=your-revenuecat-api-key-here
   ```

### 6. Stripe (for Direct Payments)

**Optional: Alternative to app store payments**

1. Create account at [stripe.com](https://stripe.com)
2. Get publishable key from dashboard
3. Configure webhooks for your backend
4. Add to `.env.local`:
   ```
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here
   ```

### 7. Analytics Services

**Optional: For usage analytics and crash reporting**

#### Mixpanel
1. Create account at [mixpanel.com](https://mixpanel.com)
2. Create project and get token
3. Add to `.env.local`:
   ```
   MIXPANEL_TOKEN=your-mixpanel-token-here
   ```

#### Sentry
1. Create account at [sentry.io](https://sentry.io)
2. Create project and get DSN
3. Add to `.env.local`:
   ```
   SENTRY_DSN=your-sentry-dsn-here
   ```

## Build Configuration

### Android Build Setup

1. **Generate Keystore** (for production builds):
   ```bash
   npm run generate:keystore
   ```

2. **Configure Google Services**:
   - Place `google-services.json` in `android/app/`
   - Verify `GOOGLE_MAPS_API_KEY` is set in environment

3. **Build Commands**:
   ```bash
   # Development build
   eas build --platform android --profile development
   
   # Production build
   eas build --platform android --profile production
   ```

### iOS Build Setup

1. **Configure Team and Provisioning**:
   ```bash
   eas credentials
   ```

2. **Add GoogleService-Info.plist**:
   - Place file in `ios/TailTracker/`
   - Verify it's linked in Xcode project

3. **Build Commands**:
   ```bash
   # Development build
   eas build --platform ios --profile development
   
   # Production build
   eas build --platform ios --profile production
   ```

## App Store Submission

### iOS App Store

1. **Build Production IPA**:
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

3. **App Store Connect Setup**:
   - All privacy policy and terms are in-app (no external URLs needed)
   - Configure app metadata using provided templates
   - Upload screenshots using the screenshot generation tools

### Google Play Store

1. **Build Production AAB**:
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Play Store**:
   ```bash
   eas submit --platform android
   ```

3. **Play Console Setup**:
   - Complete Data Safety form using provided templates
   - All legal documents are accessible within the app
   - No external domain dependencies

## Legal Compliance

### In-App Legal Documents

The app includes complete in-app legal documents:

- **Privacy Policy**: Accessible via Settings → Privacy Policy
- **Terms of Service**: Accessible via Settings → Terms of Service
- **Data Transparency**: Shows exactly what data is collected
- **Consent Flow**: Guides users through privacy choices

### No External Dependencies

- ✅ All legal documents are self-contained within the app
- ✅ No external domain requirements
- ✅ No website dependencies for app store approval
- ✅ Complete privacy transparency built-in

## Development Commands

```bash
# Start development server
npm start

# Platform-specific development
npm run android
npm run ios

# Testing
npm test
npm run test:integration
npm run test:accessibility

# Building
npm run build:android
npm run build:ios

# Linting and type checking
npm run lint
npm run type-check

# Version management
npm run version:patch
npm run version:minor
npm run version:major
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**:
   - Ensure `.env.local` exists in project root
   - Restart Metro bundler after changes
   - Check EAS build environment variables

2. **Google Maps not working**:
   - Verify API key is correct and unrestricted for development
   - Ensure all required APIs are enabled
   - Check bundle ID restrictions for production

3. **Push notifications not working**:
   - Verify Firebase configuration files are properly placed
   - Check Firebase project settings match environment variables
   - Ensure proper permissions are requested

4. **Build failures**:
   - Clear cache: `expo r -c`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check EAS build logs for specific errors

### Support

For technical support or configuration help:
- Check the troubleshooting documentation in `/docs/`
- Review error logs and build outputs
- Ensure all required environment variables are properly set

## Security Notes

- Never commit API keys to version control
- Use different API keys for development and production
- Regularly rotate sensitive credentials
- Monitor API usage and set up billing alerts
- Restrict API keys to specific app bundles/domains