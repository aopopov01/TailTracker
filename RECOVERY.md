# TailTracker - Complete Recovery Guide

## 🚨 CRITICAL RECOVERY DOCUMENTATION
**This document enables 100% project restoration from GitHub backup**

---

## 1. SYSTEM REQUIREMENTS

### Development Environment
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Expo CLI**: Latest version (`npm install -g @expo/cli`)
- **EAS CLI**: Latest version (`npm install -g eas-cli`)
- **Git**: 2.x or higher

### Platform-Specific Requirements

#### iOS Development
- **macOS**: Monterey (12.0) or higher
- **Xcode**: 14.x or higher
- **iOS Simulator**: iOS 15.0+ targets
- **CocoaPods**: 1.11.x or higher
- **Apple Developer Account**: Required for device testing

#### Android Development
- **Android Studio**: Flamingo or higher
- **Android SDK**: API 31 (Android 12) minimum
- **Java**: JDK 11 or higher
- **Gradle**: 7.x or higher
- **Google Play Console**: Account required for distribution

### Backend Services
- **Supabase**: Project with PostgreSQL database
- **Stripe**: Account with test/production keys
- **Firebase**: Project for push notifications (optional)

---

## 2. COMPLETE PROJECT RESTORATION

### Step 1: Repository Clone
```bash
# Clone the repository
git clone git@github.com:aopopov01/TailTracker.git
cd TailTracker

# Verify all files are present
ls -la
```

### Step 2: Environment Setup
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..
```

### Step 3: Environment Configuration

#### Create Environment Files
```bash
# Copy environment templates
cp .env.template .env.development
cp .env.template .env.production
```

#### Required Environment Variables
Create `.env.development` and `.env.production` with:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App Configuration
APP_ENV=development # or production
API_BASE_URL=https://your-api-domain.com

# Optional Services
FIREBASE_API_KEY=your_firebase_key
```

### Step 4: Backend Configuration

#### Supabase Setup
```bash
# Navigate to backend/supabase
cd ../backend/supabase

# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db reset

# Deploy functions
supabase functions deploy
```

#### Database Schema
The following tables will be created automatically:
- `users` - User profiles and authentication
- `pets` - Pet information and tracking data
- `subscriptions` - Payment and subscription management
- `notifications` - Push notification logs
- `safe_zones` - GPS geofencing data

---

## 3. BUILD AND DEPLOYMENT SETUP

### iOS Build Configuration

#### Code Signing Setup
```bash
# Navigate to iOS directory
cd mobile/ios

# Install certificates (requires Apple Developer Account)
# Add your team ID to project.pbxproj
# Configure provisioning profiles in Xcode
```

#### Build Commands
```bash
# Development build
npx expo run:ios --device

# Production build
eas build --platform ios --profile production
```

### Android Build Configuration

#### Keystore Generation
```bash
# Generate production keystore
cd mobile
./generate-production-keystore.sh

# Store keystore securely - CRITICAL FOR UPDATES
# Backup location: android/app/tailtracker-release.keystore
```

#### Build Commands
```bash
# Development build
npx expo run:android --device

# Production build
eas build --platform android --profile production
```

---

## 4. CRITICAL FILES AND LOCATIONS

### Essential Configuration Files
```
TailTracker/
├── .gitignore                    # Security exclusions
├── RECOVERY.md                   # This file
├── mobile/
│   ├── package.json             # Dependencies
│   ├── app.json                 # App configuration
│   ├── eas.json                 # Build configuration
│   ├── .env.template            # Environment template
│   └── android/app/
│       └── tailtracker-release.keystore  # CRITICAL - Store securely
└── backend/supabase/
    ├── migrations/              # Database schema
    ├── functions/               # Edge functions
    └── config.toml             # Supabase configuration
```

### Sensitive Files (NOT in Repository)
These files must be recreated from secure storage:
- `.env.development`
- `.env.production`
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)
- `tailtracker-release.keystore` (Android signing)
- Apple certificates and provisioning profiles

---

## 5. DEPENDENCIES AND SERVICES

### External API Requirements
1. **Supabase Project**
   - PostgreSQL database
   - Real-time subscriptions
   - Row Level Security enabled
   - Storage bucket configured

2. **Stripe Account**
   - Test and production keys
   - Webhook endpoints configured
   - Products and prices created

3. **Apple Developer Account** (iOS)
   - Team ID and certificates
   - App Store Connect access
   - Push notification certificates

4. **Google Play Console** (Android)
   - Developer account
   - App signing keys
   - Play Console API access

### Third-Party Integrations
- **Firebase**: Push notifications (optional)
- **Sentry**: Error tracking (optional)
- **Analytics**: Mixpanel/Google Analytics (optional)

---

## 6. TESTING AND VALIDATION

### Pre-Launch Checklist
```bash
# Run all tests
cd mobile
npm run test
npm run test:e2e

# Validate build
eas build --platform all --profile preview

# Test on devices
npx expo run:ios --device
npx expo run:android --device
```

### Critical Test Scenarios
1. **User Authentication**: Registration and login
2. **Pet Management**: Add, edit, delete pets
3. **GPS Tracking**: Location updates and safe zones
4. **Payment Processing**: Subscription purchase/cancellation
5. **Push Notifications**: Delivery and handling
6. **Data Sync**: Real-time updates across devices

---

## 7. PRODUCTION DEPLOYMENT

### Pre-Deployment Steps
1. Update version numbers in `app.json`
2. Configure production environment variables
3. Build and test production versions
4. Validate all integrations with production APIs

### iOS Deployment
```bash
# Production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest
```

### Android Deployment
```bash
# Production build
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --latest
```

---

## 8. DISASTER RECOVERY PROCEDURES

### Complete Loss Scenario
1. **Repository Recovery**: Clone from GitHub
2. **Environment Rebuild**: Recreate all .env files
3. **Service Reconnection**: Restore API keys and credentials
4. **Database Restore**: Run migrations and restore data
5. **Build Environment**: Recreate certificates and signing keys

### Data Loss Scenarios
- **Database**: Supabase automatic backups (restore from dashboard)
- **User Data**: Implement regular backup procedures
- **Payment Data**: Stripe retains all transaction history

### Key Management
- **Store all certificates and keys in secure vault**
- **Maintain backup copies of keystores**
- **Document all API keys and service credentials**
- **Regular backup testing procedures**

---

## 9. SUPPORT AND TROUBLESHOOTING

### Common Issues
1. **Build Failures**: Check Node.js version and clear cache
2. **Code Signing**: Verify certificates and provisioning profiles
3. **API Errors**: Validate environment variables and service status
4. **Database Issues**: Check Supabase connection and migrations

### Contact Information
- **Repository**: https://github.com/aopopov01/TailTracker
- **Issues**: GitHub Issues tab
- **Documentation**: README.md files in each directory

### Emergency Contacts
- **Apple Developer Support**: For iOS issues
- **Google Play Support**: For Android issues
- **Supabase Support**: For backend issues
- **Stripe Support**: For payment issues

---

## 10. VERSION CONTROL

### Current Repository State
- **Main Branch**: Production-ready code
- **Development Branches**: Feature development
- **Tagged Releases**: Stable versions for recovery

### Recovery Point Tags
Each major milestone is tagged for easy recovery:
- `v1.0.0-production-ready`: First production release
- `v1.1.0-payment-integration`: Stripe integration complete
- `v1.2.0-store-submission`: App store ready

### Branch Strategy
- `main`: Production code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `hotfix/*`: Critical fixes

---

**🔐 SECURITY NOTICE**: This recovery guide contains references to sensitive information. Ensure all actual API keys, certificates, and credentials are stored securely and never committed to version control.

**📅 Last Updated**: 2025-08-22
**📋 Recovery Test Status**: ✅ Validated
**🏷️ Version**: 1.0.0