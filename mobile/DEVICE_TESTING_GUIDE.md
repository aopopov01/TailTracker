# TailTracker Device Testing Guide

## Overview
This guide provides comprehensive instructions for testing the TailTracker mobile app on physical devices using both Expo Go and development builds.

## Prerequisites Verification

### Required Software
- ✅ Node.js 18.0.0+ 
- ✅ Expo CLI (`npm install -g @expo/cli`)
- ✅ EAS CLI (`npm install -g eas-cli`) - for development builds
- ✅ Expo Go app on your testing device

### Network Requirements
- Device and development machine on same WiFi network
- Firewall allows ports: 8081, 19000-19002
- Local IP: **192.168.20.112**
- Dev Server: **http://192.168.20.112:8081**

## Testing Methods

### Method 1: Expo Go Testing (Recommended)

#### Quick Start
```bash
# Start development server
expo start

# Alternative start commands
expo start --clear          # Clear Metro cache
expo start --tunnel         # Use tunnel for different networks  
expo start --lan            # Force LAN mode
expo start --localhost      # Local testing only
```

#### Connection Steps
1. **Start Development Server**
   ```bash
   cd /home/he_reat/Desktop/Projects/TailTracker/mobile
   expo start
   ```

2. **Connect via QR Code**
   - Open Expo Go app on your device
   - Scan the QR code displayed in terminal
   - App will load automatically

3. **Manual Connection**
   - Open Expo Go app
   - Enter URL manually: `exp://192.168.20.112:8081`
   - Tap "Connect"

4. **Deep Link Testing**
   - Test custom scheme: `tailtracker://`
   - Verify navigation and routing

### Method 2: Development Build Testing

#### Build Development Version
```bash
# iOS Development Build
eas build --platform ios --profile development

# Android Development Build  
eas build --platform android --profile development

# Simulator Build (iOS)
eas build --platform ios --profile simulator
```

#### Installation
1. **iOS**: Install via TestFlight or direct download
2. **Android**: Install APK file directly on device
3. **Simulator**: Drag and drop to iOS Simulator

## Asset Verification Checklist

### Required Assets
- ✅ App Icon: `./assets/images/icon.png` (1024x1024)
- ✅ Adaptive Icon: `./assets/images/adaptive-icon.png` (Android)
- ✅ Splash Screen: `./assets/images/splash.png`
- ✅ Notification Icon: `./assets/images/notification-icon.png`
- ✅ Sound Files: `./assets/sounds/notification.wav`

### Platform-Specific Icons
- **iOS Icons**: `./assets/icons/ios/` (Multiple sizes)
- **Android Icons**: `./assets/icons/android/` (Multiple densities)

## Permission Testing

### iOS Permissions to Test
```
✅ Location (When in Use)
✅ Location (Always) 
✅ Location (Background)
✅ Camera Access
✅ Photo Library Access
✅ Face ID/Touch ID
✅ Push Notifications
```

### Android Permissions to Test
```
✅ Fine Location
✅ Background Location
✅ Camera
✅ Storage Access
✅ Push Notifications
✅ Boot Completed (Background)
```

### Permission Testing Flow
1. **Fresh Install**: All permissions should prompt
2. **Grant/Deny Testing**: Test app behavior with denied permissions
3. **Settings Integration**: Verify "Go to Settings" flows work
4. **Background Testing**: Test location tracking in background

## Performance Testing

### Key Metrics to Monitor
- **App Launch Time**: < 3 seconds cold start
- **Navigation Speed**: Smooth 60fps transitions
- **Memory Usage**: Monitor in development tools
- **Battery Impact**: Test location services efficiency

### Performance Testing Commands
```bash
# Start with performance monitoring
expo start --no-dev --minify

# Bundle size analysis
npx @next/bundle-analyzer

# Memory profiling (development build required)
# Use Xcode Instruments or Android Studio Profiler
```

## Network Configuration

### Connection Methods

#### 1. LAN Mode (Default)
```bash
expo start --lan
# URL: http://192.168.20.112:8081
# Works: Same WiFi network only
```

#### 2. Tunnel Mode (Remote Access)
```bash
expo start --tunnel
# URL: Generates unique ngrok URL
# Works: Any network, slower performance
```

#### 3. Localhost Mode (Local Only)
```bash
expo start --localhost
# URL: http://localhost:8081
# Works: Same machine only (simulators)
```

### Firewall Configuration
```bash
# Required Inbound Ports
8081    # Metro bundler
19000   # Expo DevTools
19001   # Expo CLI
19002   # Expo messaging

# Required Outbound Ports  
80      # HTTP
443     # HTTPS
8081    # Metro communication
```

## Feature Testing Checklist

### Core App Features
- [ ] **Navigation**: Test all tab navigation
- [ ] **Dashboard**: Verify stats and activity display
- [ ] **Pet Tracking**: Test map integration (placeholder)
- [ ] **Settings**: Verify all settings screens
- [ ] **Hot Reload**: Test code changes reflect instantly

### Device-Specific Features
- [ ] **iOS**:
  - [ ] Face ID/Touch ID authentication
  - [ ] iOS-specific UI components
  - [ ] Background app refresh
  - [ ] Push notifications
  
- [ ] **Android**:
  - [ ] Biometric authentication
  - [ ] Material Design components
  - [ ] Background location services
  - [ ] App shortcuts

### Integration Testing
- [ ] **Location Services**: Test GPS accuracy
- [ ] **Camera Integration**: Test photo capture
- [ ] **Push Notifications**: Test local and remote
- [ ] **Deep Linking**: Test custom URL schemes
- [ ] **Offline Mode**: Test app behavior without internet

## Troubleshooting

### Common Connection Issues

#### "Cannot connect to Metro"
**Symptoms**: QR code scanning fails, timeout errors
**Solutions**:
```bash
# Check network connectivity
ping 192.168.20.112

# Restart Metro with cleared cache
expo start --clear

# Try tunnel mode
expo start --tunnel

# Check firewall settings
sudo ufw allow 8081
```

#### "Bundle Loading Slowly"
**Symptoms**: Long loading times, timeout on device
**Solutions**:
```bash
# Clear all caches
expo start --clear
rm -rf node_modules/.cache
rm -rf .expo

# Check asset optimization
# Verify metro.config.js settings

# Use localhost for faster local testing
expo start --localhost
```

#### "Permission Denied Errors"
**Symptoms**: Features not working, permission prompts not showing
**Solutions**:
1. Check `app.json` permission configuration
2. Verify iOS `Info.plist` entries are correct
3. Test permission flows manually
4. Reset app permissions in device settings

### Development Build Issues

#### "Build Failed"
**Check**:
```bash
# Verify EAS configuration
eas build:configure

# Check build logs
eas build --platform ios --profile development --clear-cache

# Validate app.json
npx expo doctor
```

#### "App Won't Install"
**iOS Solutions**:
- Check provisioning profile
- Verify device UDID in Apple Developer
- Try TestFlight instead

**Android Solutions**:
- Enable "Install from Unknown Sources"
- Check APK signature
- Try ADB install: `adb install app.apk`

### Performance Issues

#### "App Running Slowly"
**Optimize**:
```bash
# Enable production optimizations for testing
expo start --no-dev --minify

# Check bundle size
npx expo export --platform all
du -sh dist/

# Profile with development build
# Use Xcode Instruments or Android Studio Profiler
```

## Testing Workflow

### Daily Testing Routine
1. **Morning Setup**:
   ```bash
   cd /home/he_reat/Desktop/Projects/TailTracker/mobile
   npm run preflight:dev
   expo start --clear
   ```

2. **Feature Testing**:
   - Test new features on physical device
   - Verify hot reload functionality
   - Check performance metrics

3. **Cross-Platform Testing**:
   - Test on both iOS and Android
   - Verify platform-specific features
   - Check UI consistency

4. **End-of-Day**:
   - Save any crash logs
   - Document issues found
   - Prepare for next day's testing

### Release Testing
```bash
# Pre-release testing checklist
npm run preflight:production
npm run test:integration
npm run test:accessibility

# Build release candidates
eas build --platform all --profile preview

# Test final builds before submission
```

## Quick Reference Commands

### Development Server
```bash
expo start                  # Standard start with QR
expo start --clear         # Clear cache and restart
expo start --tunnel        # Tunnel mode (slow but works anywhere)
expo start --localhost     # Local only (simulators)
expo start --lan          # LAN mode (default)
```

### Build Commands
```bash
# Development builds
eas build --platform ios --profile development
eas build --platform android --profile development

# Preview builds (internal testing)
eas build --platform all --profile preview

# Production builds
eas build --platform all --profile production
```

### Debugging Commands
```bash
# Check configuration
npx expo doctor

# View logs
npx expo logs --platform ios
npx expo logs --platform android

# Clear caches
expo start --clear
rm -rf node_modules/.cache
rm -rf .expo
```

## Support Information

### Current Configuration
- **Project**: TailTracker Mobile
- **Location**: `/home/he_reat/Desktop/Projects/TailTracker/mobile`
- **Dev Server**: `http://192.168.20.112:8081`
- **Expo Go URL**: `exp://192.168.20.112:8081`
- **Bundle ID**: `com.tailtracker.app`
- **Custom Scheme**: `tailtracker://`

### Key Files
- **App Configuration**: `app.json`
- **Build Configuration**: `eas.json`
- **Metro Configuration**: `metro.config.js`
- **Package Dependencies**: `package.json`
- **Testing Config**: `device-testing.config.js`

For additional support, run the device testing setup script:
```bash
./scripts/device-testing-setup.sh
```