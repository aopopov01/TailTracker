# TailTracker iOS Development Workflow

## Overview

This document outlines the complete iOS development workflow for TailTracker, covering setup, development, testing, and deployment processes specific to iOS development.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Testing Strategy](#testing-strategy)
6. [Build Process](#build-process)
7. [Deployment Pipeline](#deployment-pipeline)
8. [App Store Submission](#app-store-submission)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Prerequisites

### Required Software
- **macOS 12.0+** (Monterey or later)
- **Xcode 14.0+** with Command Line Tools
- **Node.js 18.0+** with npm/yarn
- **Expo CLI** (latest version)
- **CocoaPods 1.11+**
- **iOS Simulator** (via Xcode)

### Apple Developer Account
- **Apple Developer Program** membership ($99/year)
- **App Store Connect** access
- **Certificates and Provisioning Profiles** setup

### Development Tools
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Expo CLI
npm install -g @expo/cli

# Install CocoaPods
sudo gem install cocoapods

# Verify installations
xcodebuild -version
expo --version
pod --version
```

## Development Environment Setup

### 1. Clone and Setup Project
```bash
# Clone the repository
git clone https://github.com/tailtracker/mobile-app.git
cd mobile-app

# Install dependencies
npm install

# Install iOS dependencies (if prebuild exists)
cd ios && pod install && cd ..
```

### 2. Environment Configuration
```bash
# Create .env file for local development
cp .env.example .env

# Configure iOS-specific environment variables
echo "IOS_BUNDLE_ID=com.tailtracker.app.dev" >> .env
echo "IOS_TEAM_ID=YOUR_TEAM_ID" >> .env
echo "ASC_API_KEY_ID=YOUR_API_KEY_ID" >> .env
echo "ASC_API_ISSUER_ID=YOUR_ISSUER_ID" >> .env
```

### 3. iOS-Specific Setup
```bash
# Generate iOS project (if needed)
expo prebuild --platform ios --clean

# Open Xcode project
open ios/TailTracker.xcworkspace

# Configure signing in Xcode:
# 1. Select TailTracker project
# 2. Go to Signing & Capabilities
# 3. Set Team and Bundle Identifier
# 4. Enable required capabilities
```

## Project Structure

```
mobile/
├── ios/                                 # iOS native code
│   ├── TailTracker/                     # Main app target
│   │   ├── Info.plist                   # iOS app configuration
│   │   ├── AppDelegate.h/.m             # App lifecycle
│   │   └── Supporting Files/
│   ├── TailTracker.xcworkspace          # Xcode workspace
│   ├── Podfile                          # CocoaPods dependencies
│   └── build/                           # Build outputs
├── src/
│   ├── components/
│   │   └── UI/
│   │       └── iOS/                     # iOS-specific components
│   │           ├── iOSButton.tsx
│   │           ├── iOSCard.tsx
│   │           ├── iOSTextInput.tsx
│   │           ├── iOSActionSheet.tsx
│   │           ├── iOSTabBar.tsx
│   │           └── index.ts
│   ├── services/                        # iOS-specific services
│   │   ├── AppleMapsService.ts
│   │   ├── iOSNotificationService.ts
│   │   ├── AppStoreBillingService.ts
│   │   ├── iOSBiometricsService.ts
│   │   └── index.ts
│   ├── theme/
│   │   └── iOSTheme.ts                  # iOS design system
│   ├── utils/
│   │   └── iOSPerformanceOptimizations.ts
│   └── test/
│       └── ios/                         # iOS-specific tests
├── scripts/
│   ├── build-ios.sh                     # iOS build script
│   └── deploy-ios.sh                    # iOS deployment script
├── appstore/                            # App Store materials
│   ├── app-store-submission-checklist.md
│   ├── app-description.md
│   ├── screenshot-requirements.md
│   └── privacy-manifest.json
├── e2e/
│   └── tests/
│       └── ios/                         # iOS E2E tests
├── app.json                             # Expo configuration
├── eas.json                             # EAS Build configuration
└── package.json                         # Dependencies and scripts
```

## Development Workflow

### 1. Feature Development Process

#### Starting a New Feature
```bash
# Create feature branch
git checkout -b feature/ios-biometric-auth

# Start development server
npm run ios

# Or start with specific simulator
npx expo run:ios --simulator "iPhone 14 Pro"
```

#### iOS-Specific Development
```typescript
// Example: Using iOS-specific components
import { iOSButton, iOSCard } from '../components/UI/iOS';
import { AppleMapsService } from '../services';

const PetTrackingScreen = () => {
  const handleOpenMaps = async () => {
    await AppleMapsService.openLocation({
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      title: 'Pet Location'
    });
  };

  return (
    <iOSCard>
      <iOSButton
        title="Open in Maps"
        onPress={handleOpenMaps}
        type="primary"
      />
    </iOSCard>
  );
};
```

#### Human Interface Guidelines Compliance
- Use iOS-specific UI components
- Follow iOS navigation patterns
- Implement proper accessibility support
- Use iOS system colors and typography
- Handle safe areas correctly

### 2. Code Quality Standards

#### TypeScript Configuration
```json
// tsconfig.json iOS-specific settings
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "skipLibCheck": true
  },
  "include": [
    "src/**/*",
    "ios/**/*"
  ]
}
```

#### ESLint Configuration
```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

#### Pre-commit Hooks
```bash
# Install pre-commit hooks
npx husky install

# Add iOS-specific checks
echo "npm run type-check" >> .husky/pre-commit
echo "npm run test:ios" >> .husky/pre-commit
```

## Testing Strategy

### 1. Unit Testing
```bash
# Run iOS-specific unit tests
npm run test -- --testPathPattern=ios

# Run with coverage
npm run test:coverage -- --testPathPattern=ios

# Watch mode for development
npm run test:watch -- --testPathPattern=ios
```

### 2. Integration Testing
```bash
# Run iOS service integration tests
npm run test -- --testNamePattern="iOS.*Service"

# Test iOS-specific components
npm run test -- --testPathPattern="components/UI/iOS"
```

### 3. End-to-End Testing
```bash
# Build iOS app for testing
npm run build:detox:ios

# Run iOS E2E tests
npm run test:ios

# Run specific iOS test suite
npx detox test --configuration ios.release e2e/tests/ios/
```

### 4. Manual Testing Checklist
- [ ] Test on multiple iOS versions (13.0+)
- [ ] Verify on different device sizes
- [ ] Test in both light and dark modes
- [ ] Verify accessibility features
- [ ] Test background app refresh
- [ ] Validate push notifications
- [ ] Test biometric authentication
- [ ] Verify in-app purchases
- [ ] Check memory usage and performance

## Build Process

### 1. Development Builds
```bash
# Start development build
npm run ios

# Build for specific simulator
npm run build:ios:dev

# Clean build
./scripts/build-ios.sh --type development --clean
```

### 2. Preview Builds
```bash
# Build preview version
npm run build:ios:preview

# Build with EAS
npm run build:ios:preview
```

### 3. Production Builds
```bash
# Build production version
./scripts/build-ios.sh --type production --clean

# Or using EAS
npm run build:ios:production
```

### 4. Build Configuration

#### EAS Build Profiles
```json
// eas.json
{
  "build": {
    "development": {
      "ios": {
        "buildConfiguration": "Debug",
        "simulator": true,
        "enterpriseProvisioning": "universal"
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "autoIncrement": "buildNumber",
        "bundleIdentifier": "com.tailtracker.app"
      }
    }
  }
}
```

## Deployment Pipeline

### 1. Staging Deployment
```bash
# Build and deploy to staging
./scripts/build-ios.sh --type preview
./scripts/deploy-ios.sh --target testflight --ipa ./ios/build/Export/TailTracker.ipa
```

### 2. Production Deployment
```bash
# Build production version
./scripts/build-ios.sh --type production --clean

# Deploy to App Store
./scripts/deploy-ios.sh --target appstore \
  --api-key ./ios/AuthKey.p8 \
  --api-key-id $ASC_API_KEY_ID \
  --api-issuer-id $ASC_API_ISSUER_ID
```

### 3. CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/ios-deploy.yml
name: iOS Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build iOS app
        run: ./scripts/build-ios.sh --type production
        
      - name: Deploy to TestFlight
        run: ./scripts/deploy-ios.sh --target testflight
        env:
          ASC_API_KEY_ID: ${{ secrets.ASC_API_KEY_ID }}
          ASC_API_ISSUER_ID: ${{ secrets.ASC_API_ISSUER_ID }}
```

## App Store Submission

### 1. Pre-submission Checklist
```bash
# Run submission checklist script
./scripts/app-store-checklist.sh

# Validate app binary
xcrun altool --validate-app --type ios --file TailTracker.ipa \
  --apiKey $ASC_API_KEY_ID --apiIssuer $ASC_API_ISSUER_ID
```

### 2. Metadata Preparation
- App description and keywords
- Screenshots for all device sizes
- Privacy policy and support URLs
- Age rating and content warnings
- In-app purchase configurations

### 3. Binary Upload
```bash
# Upload to App Store Connect
./scripts/deploy-ios.sh --target appstore
```

### 4. App Store Connect Configuration
1. **App Information**
   - Bundle ID: `com.tailtracker.app`
   - Category: Lifestyle
   - Age Rating: 4+

2. **Pricing and Availability**
   - Free with in-app purchases
   - Available in all territories

3. **App Privacy**
   - Complete privacy questionnaire
   - Upload privacy manifest

4. **Submit for Review**
   - Add review notes for Apple
   - Submit binary and metadata

## Troubleshooting

### Common iOS Development Issues

#### 1. CocoaPods Issues
```bash
# Clear CocoaPods cache
pod cache clean --all
cd ios && pod deintegrate && pod install
```

#### 2. Xcode Build Errors
```bash
# Clean Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reset iOS simulator
xcrun simctl erase all
```

#### 3. Signing Issues
```bash
# Verify certificates
security find-identity -v -p codesigning

# Update provisioning profiles
fastlane match development --readonly
```

#### 4. Metro Bundler Issues
```bash
# Reset Metro cache
npx expo start --clear
```

### Performance Issues

#### Memory Warnings
```typescript
import { iOSPerformance } from '../utils/iOSPerformanceOptimizations';

// Handle memory warnings
iOSPerformance.addAppStateListener((state) => {
  if (state === 'background') {
    // Optimize memory usage
    iOSPerformance.optimizeMemoryUsage();
  }
});
```

#### Location Services
```typescript
import { iOSLocationOptimizer } from '../utils/iOSPerformanceOptimizations';

// Use battery-optimized location config
const locationConfig = iOSLocationOptimizer.getBatteryOptimizedLocationConfig();
```

## Best Practices

### 1. iOS-Specific Guidelines

#### User Interface
- Follow Apple Human Interface Guidelines
- Use native iOS components and patterns
- Implement proper accessibility support
- Handle different screen sizes and orientations
- Support dark mode properly

#### Performance
- Optimize for battery usage
- Use background app refresh appropriately
- Implement efficient memory management
- Optimize network requests
- Use hardware acceleration where possible

#### Security
- Implement biometric authentication
- Use Keychain for sensitive data storage
- Follow App Transport Security guidelines
- Implement certificate pinning for API calls
- Handle privacy permissions properly

### 2. Code Organization
```typescript
// Use iOS-specific file organization
src/
├── components/
│   └── iOS/          # iOS-specific components
├── services/
│   └── iOS/          # iOS-specific services
├── utils/
│   └── iOS/          # iOS-specific utilities
└── theme/
    └── iOSTheme.ts   # iOS design system
```

### 3. Testing Standards
- Write unit tests for all iOS services
- Include integration tests for Apple services
- Test on multiple iOS versions and devices
- Implement E2E tests for critical user flows
- Use accessibility testing tools

### 4. Documentation
- Document all iOS-specific features
- Include setup instructions for new developers
- Maintain troubleshooting guides
- Document deployment processes
- Keep App Store submission materials updated

## Monitoring and Analytics

### 1. Performance Monitoring
```typescript
// Track iOS-specific metrics
import { iOSPerformance } from '../utils/iOSPerformanceOptimizations';

const metrics = iOSPerformance.getPerformanceMetrics();
console.log('iOS Performance Metrics:', metrics);
```

### 2. Crash Reporting
- Integrate with Sentry or Crashlytics
- Monitor TestFlight feedback
- Track App Store reviews
- Monitor performance metrics in Xcode Organizer

### 3. User Analytics
- Track iOS-specific user behaviors
- Monitor feature adoption rates
- Analyze user engagement metrics
- Track subscription conversion rates

## Support and Resources

### Apple Documentation
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [iOS App Development](https://developer.apple.com/ios/)

### Development Tools
- [Xcode Documentation](https://developer.apple.com/xcode/)
- [TestFlight](https://developer.apple.com/testflight/)
- [App Store Connect](https://appstoreconnect.apple.com/)

### Community Resources
- [React Native iOS Documentation](https://reactnative.dev/docs/platform-specific-code#ios)
- [Expo iOS Development](https://docs.expo.dev/workflow/ios-simulator/)
- [Stack Overflow iOS Tag](https://stackoverflow.com/questions/tagged/ios)

---

**Last Updated:** December 2024
**Version:** 1.0
**Maintained by:** TailTracker iOS Development Team