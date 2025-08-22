/**
 * TailTracker Device Testing Configuration
 * This file contains optimal settings for device testing
 */

module.exports = {
  // Network Configuration
  network: {
    // Local development server
    host: '192.168.20.112', // Current local IP
    port: 8081,
    protocol: 'http',
    
    // Alternative connection methods
    alternatives: {
      localhost: 'http://localhost:8081',
      tunnel: 'Generated via ngrok when using --tunnel flag',
      lan: 'http://192.168.20.112:8081',
    },
    
    // Firewall requirements
    firewall: {
      inbound: [8081, 19000, 19001, 19002],
      outbound: [8081, 443, 80],
    },
  },
  
  // Expo Go Configuration
  expoGo: {
    qrCodeUrl: 'exp://192.168.20.112:8081',
    deepLinkScheme: 'tailtracker',
    manifestUrl: 'http://192.168.20.112:8081/manifest',
    
    // Testing commands
    commands: {
      start: 'expo start',
      startTunnel: 'expo start --tunnel',
      startLan: 'expo start --lan',
      startLocalhost: 'expo start --localhost',
      qrCode: 'expo start --go',
    },
  },
  
  // Development Build Configuration
  developmentBuild: {
    ios: {
      profile: 'development',
      buildCommand: 'eas build --platform ios --profile development',
      simulator: true,
      device: true,
    },
    android: {
      profile: 'development', 
      buildCommand: 'eas build --platform android --profile development',
      buildType: 'apk',
      gradleCommand: ':app:assembleDebug',
    },
  },
  
  // Asset Verification
  assets: {
    required: [
      './assets/images/icon.png',
      './assets/images/adaptive-icon.png',
      './assets/images/splash.png',
      './assets/images/notification-icon.png',
      './assets/sounds/notification.wav',
    ],
    icons: {
      ios: './assets/icons/ios/',
      android: './assets/icons/android/',
    },
    screenshots: {
      ios: './screenshots/ios/',
      android: './screenshots/android/',
    },
  },
  
  // Performance Settings
  performance: {
    hotReload: true,
    fastRefresh: true,
    bundleSize: {
      warning: '50MB',
      error: '100MB',
    },
    metro: {
      maxWorkers: 4,
      cache: true,
      watchFolders: ['src', 'assets', 'app'],
    },
  },
  
  // Permission Testing
  permissions: {
    ios: [
      'NSLocationWhenInUseUsageDescription',
      'NSLocationAlwaysAndWhenInUseUsageDescription', 
      'NSLocationAlwaysUsageDescription',
      'NSCameraUsageDescription',
      'NSPhotoLibraryUsageDescription',
      'NSFaceIDUsageDescription',
    ],
    android: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
  },
  
  // Common Issues & Solutions
  troubleshooting: {
    networkConnection: {
      symptoms: ['QR code not working', 'Cannot connect to dev server'],
      solutions: [
        'Check if devices are on same WiFi network',
        'Verify firewall allows port 8081',
        'Try tunnel mode: expo start --tunnel',
        'Restart Metro bundler: expo start --clear',
      ],
    },
    bundleLoading: {
      symptoms: ['Bundle loading slow', 'Assets not loading'],
      solutions: [
        'Clear Metro cache: expo start --clear',
        'Check asset paths in app.json',
        'Verify network connectivity',
        'Try localhost mode if on same machine',
      ],
    },
    permissions: {
      symptoms: ['Permission denied errors', 'Features not working'],
      solutions: [
        'Check app.json permissions configuration',
        'Verify iOS Info.plist entries',
        'Test permission requests manually',
        'Check Android manifest permissions',
      ],
    },
  },
};