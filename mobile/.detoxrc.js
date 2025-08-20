module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  configurations: {
    android: {
      type: 'android.emulator',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      device: {
        avdName: 'Pixel_4_API_30',
      },
    },
    ios: {
      type: 'ios.simulator',
      build: 'xcodebuild -workspace ios/TailTracker.xcworkspace -scheme TailTracker -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/TailTracker.app',
      device: {
        type: 'iPhone 14 Pro',
        os: 'iOS 16.0',
      },
    },
    'ios.release': {
      type: 'ios.simulator',
      build: 'xcodebuild -workspace ios/TailTracker.xcworkspace -scheme TailTracker -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/TailTracker.app',
      device: {
        type: 'iPhone 14 Pro',
        os: 'iOS 16.0',
      },
    },
    'ios.device': {
      type: 'ios.device',
      build: 'xcodebuild -workspace ios/TailTracker.xcworkspace -scheme TailTracker -configuration Release -sdk iphoneos -derivedDataPath ios/build',
      binaryPath: 'ios/build/Build/Products/Release-iphoneos/TailTracker.app',
      device: {
        type: 'iPhone',
      },
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/TailTracker.app',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/TailTracker.app',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14 Pro',
        os: 'iOS 16.0',
      },
    },
    device: {
      type: 'ios.device',
      device: {
        type: 'iPhone',
      },
    },
  },
};