# TailTracker QR Code & Device Connection Info

## Current Development Server Status: ✅ RUNNING

### Quick Connection Details
- **Expo Go URL**: `exp://192.168.20.112:8081`
- **Web Interface**: `http://192.168.20.112:8081`
- **Local Network**: `192.168.20.112:8081`

## Device Testing Instructions

### Method 1: QR Code (Recommended)
1. **Install Expo Go** on your mobile device:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Connect to App**:
   - Open Expo Go app
   - Scan QR code displayed in terminal when running `npx expo start`
   - Or manually enter: `exp://192.168.20.112:8081`

### Method 2: Manual URL Entry
If QR code scanning doesn't work:
1. Open Expo Go app
2. Tap "Enter URL manually"
3. Enter: `exp://192.168.20.112:8081`
4. Tap "Connect to project"

### Method 3: Tunnel Mode (Different Networks)
If you're on a different WiFi network:
```bash
npx expo start --tunnel
```
This will generate a unique URL that works from any network.

## Device Requirements

### iOS Devices
- iOS 13.0 or later
- iPhone, iPad, or iPod touch
- Expo Go app installed
- Same WiFi network as development machine

### Android Devices
- Android 6.0 (API level 23) or later
- Expo Go app installed
- Same WiFi network as development machine

## Network Requirements
- **WiFi**: Device and development machine on same network
- **Firewall**: Allow port 8081 for incoming connections
- **Internet**: Required for initial app download and updates

## Troubleshooting Connection Issues

### "Cannot connect to Metro bundler"
1. **Check Network**:
   ```bash
   ping 192.168.20.112  # From your device's network
   ```

2. **Restart Development Server**:
   ```bash
   npx expo start --clear
   ```

3. **Try Tunnel Mode**:
   ```bash
   npx expo start --tunnel
   ```

### "QR Code Not Working"
1. **Manual Entry**: Use `exp://192.168.20.112:8081`
2. **Check WiFi**: Ensure same network
3. **Camera Permission**: Allow Expo Go camera access
4. **Update Expo Go**: Ensure latest version

### "Slow Loading"
1. **Clear Cache**:
   ```bash
   npx expo start --clear
   ```

2. **Check Network Speed**: Slow WiFi affects loading
3. **Use Localhost** (for simulator testing):
   ```bash
   npx expo start --localhost
   ```

## Features to Test

### Core Functionality
- [ ] App launches successfully
- [ ] Navigation between tabs works
- [ ] Dashboard displays correctly
- [ ] Tracking screen loads
- [ ] Settings screen accessible

### Device-Specific Features
- [ ] Touch interactions
- [ ] Screen orientation (if supported)
- [ ] Back button behavior (Android)
- [ ] Safe area handling (iPhone notch/island)

### Performance Testing
- [ ] Smooth scrolling
- [ ] Fast navigation transitions
- [ ] Hot reload functionality
- [ ] Memory usage (check device settings)

## Development Commands

### Start Development Server
```bash
# Standard start (recommended)
npx expo start

# Clear cache and start
npx expo start --clear

# Tunnel mode (different networks)
npx expo start --tunnel

# Localhost only (simulators)
npx expo start --localhost

# Production-like build
npx expo start --no-dev --minify
```

### Device Testing Scripts
```bash
# Check if everything is ready
npm run device:setup

# Quick status check
npm run device:status

# Start for device testing
npm run device:test

# Start with tunnel
npm run device:tunnel

# Clear cache and start
npm run device:clear
```

## Development Build Testing

For more advanced testing with native features:

### Build Development Apps
```bash
# iOS Development Build
npx eas build --platform ios --profile development

# Android Development Build
npx eas build --platform android --profile development
```

### Install Development Builds
- **iOS**: Install via TestFlight or direct installation
- **Android**: Download and install APK file

## Support & Documentation

- **Setup Script**: `./scripts/device-testing-setup.sh`
- **Status Check**: `./scripts/check-device-testing-status.sh`
- **Full Guide**: `DEVICE_TESTING_GUIDE.md`
- **App Config**: `app.json`
- **Build Config**: `eas.json`

---

**Last Updated**: August 22, 2025  
**Development Server**: Currently Running ✅  
**Status**: Ready for Device Testing 🚀