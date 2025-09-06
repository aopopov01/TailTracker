# TailTracker - Production Build Commands
**Version**: 1.0.0  
**Date**: January 4, 2025  
**Status**: Production Ready

---

## Quick Start Production Deployment

### 🚀 One-Command Production Builds

```bash
# Build for both platforms (recommended)
npm run build:production:all

# Build for specific platform
npm run build:android:production
npm run build:ios:production
```

---

## Detailed Build Commands

### Android Production Build

```bash
# Generate production APK (for testing)
eas build --platform android --profile production

# Generate production AAB (for Play Store)
eas build --platform android --profile production-android

# Local build (requires Android Studio)
npx expo run:android --variant release
```

### iOS Production Build

```bash
# Generate production IPA (for App Store)
eas build --platform ios --profile production

# Generate iOS build for TestFlight
eas build --platform ios --profile testflight

# Local build (requires Xcode on macOS)
npx expo run:ios --configuration Release
```

---

## Build Profiles Configuration

### Production Profile (eas.json)

```json
{
  "build": {
    "production": {
      "env": {
        "NODE_ENV": "production"
      },
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "ios": {
        "buildConfiguration": "Release",
        "autoIncrement": "buildNumber",
        "simulator": false
      },
      "channel": "production"
    }
  }
}
```

---

## Pre-Build Checklist

### ✅ Environment Setup
- [ ] Production environment variables configured
- [ ] API keys updated for production services
- [ ] Certificates and signing keys ready
- [ ] EAS account properly configured

### ✅ Code Preparation
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Lint issues resolved
- [ ] Bundle size optimized

### ✅ Assets Ready
- [ ] App icons generated for all sizes
- [ ] Splash screens configured
- [ ] Screenshots prepared for stores
- [ ] Marketing materials ready

---

## Build Environment Variables

### Required Production Variables

```bash
# API Configuration
export API_BASE_URL="https://api.tailtracker.app"
export SUPABASE_URL="your-production-supabase-url"
export SUPABASE_ANON_KEY="your-production-supabase-anon-key"

# Third-party Services
export GOOGLE_MAPS_API_KEY="your-production-google-maps-api-key"
export STRIPE_PUBLISHABLE_KEY="pk_live_your-production-stripe-key"
export FIREBASE_API_KEY="your-production-firebase-api-key"

# Build Configuration
export NODE_ENV="production"
export EAS_BUILD_PROFILE="production"
```

---

## Build Validation

### After Build Completion

```bash
# Validate Android build
adb install -r tailtracker-production.aab
adb shell am start -n com.tailtracker.app/.MainActivity

# Validate iOS build (TestFlight)
# Install through TestFlight and test core functionality

# Performance validation
npm run test:performance
npm run bundle:analyze
```

### Build Success Criteria
- ✅ App launches in <3 seconds
- ✅ All core features functional
- ✅ No crashes during basic navigation
- ✅ Location services working
- ✅ Push notifications configured
- ✅ In-app purchases functional

---

## Deployment to Stores

### iOS App Store Submission

```bash
# Submit to App Store using EAS
eas submit --platform ios --profile production

# Manual submission steps:
# 1. Upload to App Store Connect
# 2. Complete metadata in App Store Connect
# 3. Submit for review
# 4. Monitor review status
```

### Google Play Store Submission

```bash
# Submit to Play Store using EAS
eas submit --platform android --profile production

# Manual submission steps:
# 1. Upload AAB to Play Console
# 2. Complete store listing
# 3. Fill out data safety form
# 4. Submit for review
```

---

## Build Troubleshooting

### Common Issues & Solutions

#### Build Failures
```bash
# Clean build cache
eas build --clear-cache --platform all --profile production

# Update EAS CLI
npm install -g @expo/eas-cli@latest

# Check build logs
eas build:view [build-id]
```

#### Certificate Issues
```bash
# Regenerate certificates
eas credentials:configure --platform ios
eas credentials:configure --platform android
```

#### Environment Variables
```bash
# Set EAS secrets
eas secret:create --name SUPABASE_URL --value "your-value"
eas secret:list
```

### Build Logs Location
- **EAS Builds**: Available in EAS dashboard
- **Local Builds**: Check Metro bundler output
- **Android**: Check `android/app/build/outputs/logs/`
- **iOS**: Check Xcode build logs

---

## Performance Optimization

### Bundle Size Optimization

```bash
# Analyze bundle size
npm run bundle:analyze

# Check for large dependencies
npx react-native-bundle-visualizer

# Optimize images
npm run assets:optimize
```

### Build Time Optimization

```bash
# Use local caching
export METRO_CACHE=1

# Parallel builds
eas build --platform all --profile production --auto-submit
```

---

## Quality Gates

### Pre-Deployment Validation

```bash
# Run full test suite
npm run test:all

# Security scan
npm audit --production
npm run security:scan

# Performance benchmarks
npm run perf:test

# Accessibility validation
npm run a11y:test
```

### Success Metrics
- Build time: <15 minutes
- Bundle size: <2MB gzipped
- Memory usage: <200MB peak
- CPU usage: <30% average
- Battery drain: <5% per hour

---

## Production Monitoring

### Post-Deployment Checks

```bash
# Monitor crash reports
# Check Sentry dashboard for real-time crashes

# Performance monitoring
# Monitor Firebase Performance for app metrics

# User analytics
# Review Mixpanel/Analytics for user behavior

# Business metrics
# Track subscription conversions and retention
```

### Alert Configuration
- Critical: >1% crash rate
- Warning: >5 second app launch
- Performance: >100MB memory usage
- Business: <10% conversion rate

---

## Rollback Procedures

### Emergency Rollback

```bash
# iOS: Reject current version in App Store Connect
# Users will revert to previous version

# Android: Create rollback release
eas build --platform android --profile production
eas submit --platform android --profile production

# Feature flag rollback
# Disable problematic features through remote config
```

### Gradual Rollback
- Reduce rollout percentage in store consoles
- Monitor key metrics during rollback
- Communicate with users via in-app messaging

---

## Build Artifacts

### Expected Output Files

#### Android
- `tailtracker-production.aab` - App Bundle for Play Store
- `tailtracker-production.apk` - APK for testing
- `mapping.txt` - ProGuard mapping file
- `output-metadata.json` - Build metadata

#### iOS
- `TailTracker.ipa` - iOS App Archive
- `TailTracker.app.dSYM` - Debug symbols
- `ExportOptions.plist` - Export configuration
- Build logs and certificates info

---

## Contact Information

### Build Support
- **Build Issues**: devops@tailtracker.com
- **Certificate Problems**: certificates@tailtracker.com
- **Store Submission**: appstore@tailtracker.com
- **Emergency Contact**: +1-555-BUILD-911

### Documentation Links
- EAS Build Documentation: https://docs.expo.dev/build/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Play Store Policies: https://play.google.com/about/developer-content-policy/

---

**Build prepared by**: DevOps Team  
**Last updated**: January 4, 2025  
**Next review**: After first production deployment