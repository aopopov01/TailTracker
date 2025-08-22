# TailTracker Mobile App - Build & Deployment Guide

## Overview

This comprehensive guide covers the complete build and deployment process for the TailTracker mobile application. Our build system supports multiple environments, automated testing, code signing, and deployment to both iOS App Store and Google Play Store.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Build Scripts](#build-scripts)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Code Signing](#code-signing)
6. [Version Management](#version-management)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Process](#deployment-process)
9. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI and EAS CLI
- For iOS: macOS with Xcode 15+, CocoaPods
- For Android: Android SDK, Java 17+

### Initial Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd mobile
npm ci

# Setup environment variables
cp .env.template .env.development
# Edit .env.development with your configuration

# Setup code signing (follow prompts)
npm run setup:signing

# Run preflight check
npm run preflight:dev

# Build for development
npm run build:android:dev  # Android
npm run build:ios:dev      # iOS
```

## Environment Setup

### Environment Files

We maintain separate environment configurations:

- **`.env.development`** - Local development and testing
- **`.env.staging`** - Internal testing and QA
- **`.env.production`** - Production releases

### Required Environment Variables

```bash
# Core Configuration
API_BASE_URL=https://api-dev.tailtracker.app
NODE_ENV=development
APP_VARIANT=development

# Backend Services
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
FIREBASE_PROJECT_ID=tailtracker-dev
FIREBASE_API_KEY=your-firebase-api-key

# External APIs
GOOGLE_MAPS_API_KEY=your-google-maps-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-test-key

# Feature Flags
ENABLE_DEBUG_LOGGING=true
ENABLE_DEV_MENU=true
ENABLE_ANALYTICS=false
```

### Environment-Specific Settings

| Setting | Development | Staging | Production |
|---------|------------|---------|------------|
| Debug Logging | ✅ | ✅ | ❌ |
| Dev Menu | ✅ | ❌ | ❌ |
| Analytics | ❌ | ✅ | ✅ |
| Crash Reporting | ✅ | ✅ | ✅ |
| Source Maps | ✅ | ✅ | ❌ |

## Build Scripts

### Local Build Scripts

Our enhanced build scripts provide comprehensive validation and error handling:

#### Android Builds

```bash
# Basic build
npm run build:android:local

# With options
./scripts/build-android.sh --environment staging --type aab --clean

# Available options:
# --environment: development|staging|production
# --type: apk|aab
# --clean: perform clean build
# --no-tests: skip tests
# --sign: sign the build
# --upload: upload artifacts
```

#### iOS Builds

```bash
# Basic build
npm run build:ios:local

# With options  
./scripts/build-ios.sh --environment production --device device --archive

# Available options:
# --environment: development|staging|production
# --device: device|simulator
# --clean: perform clean build
# --no-tests: skip tests
# --archive: create archive
# --upload: upload artifacts
```

### EAS Builds

EAS builds are configured for cloud building and distribution:

```bash
# Development builds
npm run build:android:dev
npm run build:ios:dev

# Staging builds
npm run build:android:preview
npm run build:ios:preview

# Production builds
npm run build:android:production
npm run build:ios:production
```

### Build Profiles

| Profile | Environment | Distribution | Code Signing |
|---------|-------------|-------------|--------------|
| `development` | Development | Internal | Development |
| `preview` | Staging | Internal | AdHoc/Distribution |
| `simulator` | Development | Internal | None |
| `testflight` | Staging | TestFlight | Distribution |
| `production` | Production | Store | Distribution |

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Main CI/CD (`ci.yml`)

Triggers on pushes to `main` and `develop` branches:

- **Quality Check**: Linting, type checking, tests
- **Preflight Validation**: Environment-specific validation
- **Build**: Android and iOS builds for all environments
- **Security Scan**: Vulnerability scanning
- **Deploy**: Automatic deployment to staging/production

#### 2. E2E Testing (`e2e-testing.yml`)

Comprehensive end-to-end testing:

- **Android E2E**: Detox tests on Android emulator
- **iOS E2E**: Detox tests on iOS simulator
- **Integration Tests**: API and service integration
- **Performance Tests**: Bundle size and performance metrics
- **Accessibility Tests**: WCAG compliance validation

#### 3. Release Workflow (`release.yml`)

Manual release process:

- **Version Bump**: Automated version management
- **Pre-release Validation**: Comprehensive checks
- **Build & Sign**: Production builds with code signing
- **Store Submission**: Upload to App Store and Play Store
- **Release Notes**: Automated changelog generation

### Workflow Triggers

```yaml
# Automatic triggers
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  
# Manual triggers
workflow_dispatch:
  inputs:
    environment:
      description: 'Environment'
      type: choice
      options: [development, staging, production]
```

### Required GitHub Secrets

```bash
# Core Secrets
EXPO_TOKEN=your-expo-token
GITHUB_TOKEN=automatically-provided

# Service APIs
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
FIREBASE_API_KEY=your-firebase-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
STRIPE_PUBLISHABLE_KEY_TEST=your-stripe-test-key
STRIPE_PUBLISHABLE_KEY_LIVE=your-stripe-live-key

# iOS Code Signing
IOS_DIST_CERTIFICATE=base64-encoded-cert
CERT_PASSWORD=cert-password
MATCH_PASSWORD=match-password

# Android Code Signing
ANDROID_KEYSTORE=base64-encoded-keystore
ANDROID_KEYSTORE_PASSWORD=keystore-password
ANDROID_KEY_ALIAS=key-alias
ANDROID_KEY_PASSWORD=key-password

# Optional
CODECOV_TOKEN=codecov-token
SLACK_WEBHOOK=slack-webhook-url
```

## Code Signing

### Setup Process

```bash
# Automated setup
npm run setup:signing --platform both --environment production

# Manual setup for iOS
./scripts/setup-code-signing.sh --platform ios

# Manual setup for Android
./scripts/setup-code-signing.sh --platform android
```

### iOS Code Signing

#### Requirements
- Apple Developer Account
- Distribution Certificate
- Provisioning Profiles for each environment
- App Store Connect API Key

#### Bundle Identifiers
- Production: `com.tailtracker.app`
- Staging: `com.tailtracker.app.staging`
- Development: `com.tailtracker.app.dev`

#### Capabilities
- Push Notifications
- In-App Purchases
- Location Services
- Sign in with Apple
- App Groups
- Associated Domains

### Android Code Signing

#### Keystore Management
- **Development**: Auto-generated debug keystore
- **Staging**: Separate staging keystore
- **Production**: Secure production keystore with backup

#### Security Best Practices
- Store keystores outside version control
- Use strong passwords (generated)
- Backup keystores securely
- Enable Google Play App Signing
- Monitor certificate expiration

```bash
# Generate production keystore
keytool -genkeypair -v -keystore release.keystore \
  -alias tailtracker \
  -keyalg RSA \
  -keysize 2048 \
  -validity 25000
```

## Version Management

### Automated Version Bumping

```bash
# Patch version (1.0.0 → 1.0.1)
npm run version:patch

# Minor version (1.0.0 → 1.1.0)  
npm run version:minor

# Major version (1.0.0 → 2.0.0)
npm run version:major

# Prerelease (1.0.0 → 1.0.1-beta.0)
./scripts/version-bump.sh --type prerelease
```

### Version Strategy

| Environment | Version Format | Build Number |
|-------------|---------------|--------------|
| Development | `1.0.0-dev` | Auto-increment |
| Staging | `1.0.0-staging` | Auto-increment |
| Production | `1.0.0` | Auto-increment |

### Git Integration

Version bumping automatically:
- Updates `package.json`, `app.json`
- Updates platform-specific files
- Creates git commit and tag
- Updates `CHANGELOG.md`

```bash
# Example workflow
npm run version:minor          # Bump version
git push origin main          # Push changes
git push origin --tags        # Push tags
```

## Testing Strategy

### Test Types

1. **Unit Tests** - Component and function testing
2. **Integration Tests** - API and service integration
3. **E2E Tests** - Full application workflow testing
4. **Performance Tests** - Bundle size and runtime performance
5. **Accessibility Tests** - WCAG compliance and screen reader support

### Test Commands

```bash
# Run all tests
npm test

# Specific test types
npm run test:coverage        # Unit tests with coverage
npm run test:integration     # Integration tests
npm run test:performance     # Performance benchmarks
npm run test:accessibility   # Accessibility compliance

# E2E tests
npm run test:android        # Android E2E
npm run test:ios           # iOS E2E
```

### Test Configuration

Tests are configured with:
- **Jest** - Unit and integration testing
- **Detox** - E2E testing framework
- **Testing Library** - React Native testing utilities
- **Accessibility Testing** - axe-core integration

### Continuous Testing

- Tests run on every pull request
- E2E tests run nightly and on releases
- Performance regression detection
- Accessibility compliance monitoring

## Deployment Process

### Pre-Deployment Checklist

```bash
# Run comprehensive preflight check
npm run preflight:production

# Validate all environments
npm run preflight:dev
npm run preflight:staging  
npm run preflight:production
```

### Deployment Stages

#### 1. Development
- Automatic builds on feature branches
- Internal distribution for testing
- Development environment validation

#### 2. Staging
- Builds from `develop` branch
- Internal testing and QA
- TestFlight and Google Play Internal Testing

#### 3. Production
- Manual release workflow
- Production environment
- App Store and Google Play Store

### Store Submission

#### iOS App Store
```bash
# TestFlight (staging)
npm run submit:ios:testflight

# App Store (production)
npm run submit:ios
```

#### Google Play Store
```bash
# Internal testing (staging)
eas submit --platform android --profile preview

# Production release
npm run submit:android
```

### Release Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Development | Ongoing | Feature development, unit testing |
| QA Testing | 2-3 days | E2E testing, bug fixes |
| Store Review | 1-3 days | App store review process |
| Rollout | 1-7 days | Gradual rollout, monitoring |

## Preflight Validation

### Comprehensive Checks

Our preflight script validates:

```bash
# Project structure and dependencies
✓ Package.json exists
✓ Node.js version compatibility
✓ Required dependencies installed

# Configuration validation  
✓ Environment variables configured
✓ App configuration valid
✓ Platform-specific settings

# Code quality
✓ Linting passes
✓ TypeScript compilation
✓ Tests passing

# Security validation
✓ No hardcoded secrets
✓ Secure API configurations
✓ Certificate validity

# Build prerequisites
✓ Clean build environment
✓ Platform tools available
✓ Code signing configured
```

### Environment-Specific Validation

```bash
# Development validation
npm run preflight:dev

# Staging validation (stricter)
npm run preflight:staging

# Production validation (strictest)
npm run preflight:production
```

## Build Artifacts

### Artifact Management

Builds generate structured artifacts:

```
build-artifacts/
├── android/
│   ├── development/
│   ├── staging/
│   └── production/
└── ios/
    ├── development/
    ├── staging/
    └── production/
```

### Artifact Contents

- **Android**: APK/AAB files, ProGuard mappings, checksums
- **iOS**: App bundles, dSYM files, provisioning profiles
- **Common**: Build reports, test results, security scans

### Retention Policy

- **Development**: 7 days
- **Staging**: 30 days  
- **Production**: Permanent (with archival)

## Monitoring & Analytics

### Build Monitoring

- Build success/failure rates
- Build duration trends
- Artifact size tracking
- Dependency vulnerability monitoring

### Performance Monitoring

- Bundle size analysis
- App performance metrics
- Crash reporting integration
- User analytics (production)

### Alerting

- Build failures → Slack notifications
- Security vulnerabilities → Email alerts
- Performance regressions → Dashboard alerts

## Troubleshooting

### Common Build Issues

#### Android Build Failures

```bash
# Clean and rebuild
npm run clean
npm run build:android:local --clean

# Gradle issues
cd android && ./gradlew clean && cd ..

# Dependency conflicts
rm -rf node_modules && npm ci
```

#### iOS Build Failures

```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Pod issues
npm run ios:reset

# Code signing issues
npm run setup:signing --platform ios --force
```

#### Common Error Messages

| Error | Solution |
|-------|----------|
| "Metro bundler failed" | Clear Metro cache: `npx expo start -c` |
| "CocoaPods not found" | Install: `sudo gem install cocoapods` |
| "Keystore not found" | Run: `npm run setup:signing` |
| "Build timeout" | Increase timeout in CI configuration |

### Debugging Steps

1. **Check Environment**: Verify all environment variables
2. **Validate Configuration**: Run preflight checks
3. **Clean Build**: Perform clean build with verbose logging
4. **Check Dependencies**: Update and audit dependencies
5. **Platform Tools**: Verify Xcode/Android SDK versions
6. **Code Signing**: Validate certificates and profiles

### Performance Optimization

#### Build Speed

- Enable incremental builds
- Use build caching
- Optimize dependency resolution
- Parallel build processes

#### Bundle Size

- Enable tree shaking
- Optimize images and assets
- Use dynamic imports
- Monitor bundle analyzer reports

### Support Resources

- **Internal Wiki**: Detailed troubleshooting guides
- **Team Chat**: #mobile-development channel
- **Issue Tracking**: GitHub Issues with build labels
- **Documentation**: Keep this guide updated

---

## Maintenance Checklist

### Weekly Tasks

- [ ] Review build success rates
- [ ] Check dependency updates
- [ ] Monitor bundle size trends
- [ ] Review security scan results

### Monthly Tasks

- [ ] Update build tools and dependencies
- [ ] Review and update documentation
- [ ] Audit code signing certificates
- [ ] Performance optimization review

### Quarterly Tasks

- [ ] Review and update CI/CD pipelines  
- [ ] Security audit and penetration testing
- [ ] Build process optimization
- [ ] Team training on new tools/processes

---

*This documentation is maintained by the TailTracker mobile development team. Last updated: $(date +'%Y-%m-%d')*