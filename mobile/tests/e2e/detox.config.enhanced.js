/**
 * Enhanced Detox Configuration for TailTracker E2E Testing
 * Supports multiple test environments and comprehensive device coverage
 */

module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  skipLegacyWorkersInjection: true,
  
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/TailTracker.app',
      build: 'xcodebuild -workspace ios/TailTracker.xcworkspace -scheme TailTracker -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/TailTracker.app',
      build: 'xcodebuild -workspace ios/TailTracker.xcworkspace -scheme TailTracker -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [
        8081, // Metro bundler
        9090, // Mock server
      ]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },

  devices: {
    'simulator': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14 Pro'
      }
    },
    'simulator.iphone13': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 13'
      }
    },
    'simulator.iphone15': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro'
      }
    },
    'simulator.ipad': {
      type: 'ios.simulator',
      device: {
        type: 'iPad Pro (12.9-inch) (6th generation)'
      }
    },
    'emulator': {
      type: 'android.emulator',
      device: {
        avdName: 'TailTracker_Test_API_34'
      }
    },
    'emulator.pixel7': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34'
      }
    },
    'emulator.tablet': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_Tablet_API_34'
      }
    },
    'attached': {
      type: 'android.attached',
      device: {
        adbName: '.*' // Any attached device
      }
    }
  },

  configurations: {
    // iOS Configurations
    'ios.sim.debug': {
      app: 'ios.debug',
      device: 'simulator',
      artifacts: {
        plugins: {
          log: 'all',
          screenshot: {
            shouldTakeAutomaticSnapshots: true,
            keepOnlyFailedTestsArtifacts: false,
            takeWhen: {
              testStart: true,
              testDone: true,
              testFailure: true
            }
          },
          video: {
            enabled: true,
            keepOnlyFailedTestsArtifacts: false
          },
          instruments: {
            enabled: process.env.CI !== 'true'
          }
        }
      }
    },
    'ios.sim.release': {
      app: 'ios.release',
      device: 'simulator',
      artifacts: {
        plugins: {
          log: 'failing',
          screenshot: 'failing',
          video: 'failing'
        }
      }
    },

    // Android Configurations
    'android.emu.debug': {
      app: 'android.debug',
      device: 'emulator',
      artifacts: {
        plugins: {
          log: 'all',
          screenshot: {
            shouldTakeAutomaticSnapshots: true,
            keepOnlyFailedTestsArtifacts: false,
            takeWhen: {
              testStart: true,
              testDone: true,
              testFailure: true
            }
          },
          video: {
            enabled: true,
            keepOnlyFailedTestsArtifacts: false,
            android: {
              bitRate: 4000000
            }
          }
        }
      }
    },
    'android.emu.release': {
      app: 'android.release',
      device: 'emulator',
      artifacts: {
        plugins: {
          log: 'failing',
          screenshot: 'failing',
          video: 'failing'
        }
      }
    },

    // Cross-platform test suites
    'ios.regression': {
      app: 'ios.debug',
      device: 'simulator.iphone14',
      testRunner: {
        args: {
          testNamePattern: '^((?!@android-only).)*$', // Exclude Android-only tests
          maxWorkers: 1,
          verbose: true
        }
      }
    },
    'android.regression': {
      app: 'android.debug',
      device: 'emulator.pixel7',
      testRunner: {
        args: {
          testNamePattern: '^((?!@ios-only).)*$', // Exclude iOS-only tests
          maxWorkers: 1,
          verbose: true
        }
      }
    },

    // Performance testing configurations
    'ios.performance': {
      app: 'ios.release',
      device: 'simulator.iphone13',
      behavior: {
        init: {
          exposeGlobals: false
        },
        launchApp: 'manual'
      },
      artifacts: {
        plugins: {
          instruments: {
            enabled: true,
            fps: {
              enabled: true
            }
          },
          timeline: {
            enabled: true
          }
        }
      }
    },
    'android.performance': {
      app: 'android.release',
      device: 'emulator.pixel7',
      behavior: {
        init: {
          exposeGlobals: false
        },
        launchApp: 'manual'
      }
    },

    // Device-specific configurations
    'ios.iphone13': {
      app: 'ios.debug',
      device: 'simulator.iphone13'
    },
    'ios.iphone15': {
      app: 'ios.debug',
      device: 'simulator.iphone15'
    },
    'ios.ipad': {
      app: 'ios.debug',
      device: 'simulator.ipad'
    },
    'android.pixel7': {
      app: 'android.debug',
      device: 'emulator.pixel7'
    },
    'android.tablet': {
      app: 'android.debug',
      device: 'emulator.tablet'
    }
  },

  artifacts: {
    rootDir: './artifacts',
    plugins: {
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false
      },
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
        takeWhen: {
          testStart: false,
          testDone: true,
          testFailure: true
        }
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
        android: {
          bitRate: 4000000,
          timeLimit: 300000, // 5 minutes
          verbose: false
        },
        simulator: {
          codec: 'h264',
          fps: 10
        }
      }
    }
  },

  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobals: true
    },
    launchApp: 'auto',
    cleanup: {
      shutdownDevice: false
    }
  },

  logger: {
    level: process.env.CI ? 'info' : 'debug',
    overrideConsole: true,
    options: {
      showLoggerName: true,
      showLevel: true,
      showMetadata: false
    }
  },

  // Session configuration
  session: {
    server: 'ws://localhost:8099',
    sessionId: 'TailTracker-E2E-Session',
    debugSynchronization: process.env.DEBUG_SYNC === 'true' ? 10000 : 3000
  }
};