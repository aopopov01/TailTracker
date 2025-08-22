#!/bin/bash

# TailTracker Code Signing Setup Script
# Comprehensive code signing configuration for iOS and Android

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Default values
PLATFORM="both"
ENVIRONMENT="development"
FORCE_OVERWRITE=false

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -p, --platform      Platform (ios|android|both) [default: both]"
    echo "  -e, --environment   Environment (development|staging|production) [default: development]"
    echo "  -f, --force         Force overwrite existing configurations"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  - For iOS: Xcode and valid Apple Developer account"
    echo "  - For Android: Java keytool and valid keystore"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_OVERWRITE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate platform
if [[ ! "$PLATFORM" =~ ^(ios|android|both)$ ]]; then
    print_message $RED "Error: Invalid platform. Must be ios, android, or both."
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_message $RED "Error: Invalid environment. Must be development, staging, or production."
    exit 1
fi

print_message $BLUE "TailTracker Code Signing Setup"
print_message $YELLOW "Platform: $PLATFORM"
print_message $YELLOW "Environment: $ENVIRONMENT"

# Change to project directory
cd "$PROJECT_DIR"

# iOS Code Signing Setup
setup_ios_signing() {
    print_message $BLUE "\n📱 Setting up iOS Code Signing"
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_message $YELLOW "Skipping iOS setup - not running on macOS"
        return 0
    fi
    
    # Check Xcode installation
    if ! command -v xcodebuild >/dev/null 2>&1; then
        print_message $RED "Error: Xcode is not installed"
        return 1
    fi
    
    # Create iOS certificates directory
    IOS_CERTS_DIR="ios/certificates"
    mkdir -p "$IOS_CERTS_DIR"
    
    # Create signing configuration template
    cat > "$IOS_CERTS_DIR/signing-config.json" << EOF
{
  "development": {
    "bundleIdentifier": "com.tailtracker.app.dev",
    "teamId": "YOUR_DEVELOPMENT_TEAM_ID",
    "provisioningProfile": "TailTracker Dev",
    "certificateType": "iOS Development"
  },
  "staging": {
    "bundleIdentifier": "com.tailtracker.app.staging", 
    "teamId": "YOUR_TEAM_ID",
    "provisioningProfile": "TailTracker Staging",
    "certificateType": "iOS Distribution"
  },
  "production": {
    "bundleIdentifier": "com.tailtracker.app",
    "teamId": "YOUR_TEAM_ID", 
    "provisioningProfile": "TailTracker Production",
    "certificateType": "iOS Distribution"
  }
}
EOF
    
    # Create match configuration for fastlane match (if using)
    cat > "Matchfile" << EOF
# Fastlane Match Configuration for TailTracker
git_url("git@github.com:your-org/tailtracker-certificates.git")
storage_mode("git")
type("development") # Can be appstore, adhoc, development, or enterprise
app_identifier(["com.tailtracker.app", "com.tailtracker.app.dev", "com.tailtracker.app.staging"])
username("your-apple-id@example.com")
team_id("YOUR_TEAM_ID")
EOF
    
    # Create iOS signing guide
    cat > "$IOS_CERTS_DIR/README.md" << EOF
# iOS Code Signing Setup

## Prerequisites
1. Apple Developer Account
2. Xcode installed
3. Valid certificates and provisioning profiles

## Manual Setup

### 1. Certificate Creation
\`\`\`bash
# Generate certificate signing request
openssl req -new -newkey rsa:2048 -nodes -keyout TailTracker.key -out TailTracker.csr
\`\`\`

### 2. Provisioning Profiles
1. Create App IDs in Apple Developer Portal:
   - \`com.tailtracker.app\` (Production)
   - \`com.tailtracker.app.staging\` (Staging)
   - \`com.tailtracker.app.dev\` (Development)

2. Enable required capabilities:
   - Push Notifications
   - In-App Purchase
   - Location Services
   - Sign In with Apple

### 3. EAS Build Integration
Update \`eas.json\` with your credentials:
\`\`\`json
{
  "build": {
    "production": {
      "ios": {
        "simulator": false,
        "enterpriseProvisioning": "universal"
      }
    }
  }
}
\`\`\`

## Automated Setup with Match
\`\`\`bash
# Install fastlane
sudo gem install fastlane

# Initialize match
fastlane match init

# Generate certificates
fastlane match development
fastlane match appstore
\`\`\`

## EAS Credentials
\`\`\`bash
# Configure credentials with EAS
eas credentials -p ios

# Or use credentials.json
eas credentials:configure -p ios
\`\`\`
EOF
    
    print_message $GREEN "✅ iOS signing configuration created"
}

# Android Code Signing Setup
setup_android_signing() {
    print_message $BLUE "\n🤖 Setting up Android Code Signing"
    
    # Check Java keytool
    if ! command -v keytool >/dev/null 2>&1; then
        print_message $RED "Error: Java keytool is not available"
        return 1
    fi
    
    # Create Android keystore directory
    ANDROID_KEYSTORE_DIR="android/keystores"
    mkdir -p "$ANDROID_KEYSTORE_DIR"
    
    # Generate keystore for development (if not exists)
    DEV_KEYSTORE="$ANDROID_KEYSTORE_DIR/debug.keystore"
    if [[ ! -f "$DEV_KEYSTORE" || "$FORCE_OVERWRITE" == true ]]; then
        print_message $BLUE "Generating development keystore..."
        keytool -genkeypair -v -keystore "$DEV_KEYSTORE" \
            -alias tailtracker-dev \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -storepass android \
            -keypass android \
            -dname "CN=TailTracker Dev, OU=Development, O=TailTracker, L=City, S=State, C=US"
        
        print_message $GREEN "✅ Development keystore created: $DEV_KEYSTORE"
    fi
    
    # Create keystore configuration template for production
    cat > "$ANDROID_KEYSTORE_DIR/keystore-config.json" << EOF
{
  "development": {
    "keyAlias": "tailtracker-dev",
    "keyPassword": "android",
    "storeFile": "./android/keystores/debug.keystore",
    "storePassword": "android"
  },
  "staging": {
    "keyAlias": "tailtracker-staging",
    "keyPassword": "YOUR_STAGING_KEY_PASSWORD",
    "storeFile": "./android/keystores/staging.keystore",
    "storePassword": "YOUR_STAGING_STORE_PASSWORD"
  },
  "production": {
    "keyAlias": "tailtracker",
    "keyPassword": "YOUR_PRODUCTION_KEY_PASSWORD",
    "storeFile": "./android/keystores/release.keystore",
    "storePassword": "YOUR_PRODUCTION_STORE_PASSWORD"
  }
}
EOF
    
    # Create gradle.properties template
    cat > "$ANDROID_KEYSTORE_DIR/gradle.properties.template" << EOF
# Android Keystore Configuration Template
# Copy to android/gradle.properties and update with your values

# Development Keystore (already configured)
TAILTRACKER_DEV_STORE_FILE=../keystores/debug.keystore
TAILTRACKER_DEV_KEY_ALIAS=tailtracker-dev
TAILTRACKER_DEV_STORE_PASSWORD=android
TAILTRACKER_DEV_KEY_PASSWORD=android

# Staging Keystore (update with your values)
TAILTRACKER_STAGING_STORE_FILE=../keystores/staging.keystore
TAILTRACKER_STAGING_KEY_ALIAS=tailtracker-staging
TAILTRACKER_STAGING_STORE_PASSWORD=YOUR_STAGING_STORE_PASSWORD
TAILTRACKER_STAGING_KEY_PASSWORD=YOUR_STAGING_KEY_PASSWORD

# Production Keystore (update with your values)
TAILTRACKER_RELEASE_STORE_FILE=../keystores/release.keystore
TAILTRACKER_RELEASE_KEY_ALIAS=tailtracker
TAILTRACKER_RELEASE_STORE_PASSWORD=YOUR_PRODUCTION_STORE_PASSWORD
TAILTRACKER_RELEASE_KEY_PASSWORD=YOUR_PRODUCTION_KEY_PASSWORD
EOF
    
    # Update Android build.gradle with signing configurations
    if [[ -f "android/app/build.gradle" ]]; then
        print_message $BLUE "Updating Android build.gradle with signing configs..."
        
        # Create backup
        cp "android/app/build.gradle" "android/app/build.gradle.backup"
        
        # Check if signing configs already exist
        if ! grep -q "signingConfigs" "android/app/build.gradle"; then
            # Add signing configurations
            cat >> "android/app/build.gradle" << 'EOF'

// Code Signing Configurations
android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        
        staging {
            if (project.hasProperty('TAILTRACKER_STAGING_STORE_FILE')) {
                storeFile file(TAILTRACKER_STAGING_STORE_FILE)
                storePassword TAILTRACKER_STAGING_STORE_PASSWORD
                keyAlias TAILTRACKER_STAGING_KEY_ALIAS
                keyPassword TAILTRACKER_STAGING_KEY_PASSWORD
            }
        }
        
        release {
            if (project.hasProperty('TAILTRACKER_RELEASE_STORE_FILE')) {
                storeFile file(TAILTRACKER_RELEASE_STORE_FILE)
                storePassword TAILTRACKER_RELEASE_STORE_PASSWORD
                keyAlias TAILTRACKER_RELEASE_KEY_ALIAS
                keyPassword TAILTRACKER_RELEASE_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        
        staging {
            initWith release
            signingConfig signingConfigs.staging
            applicationIdSuffix ".staging"
            versionNameSuffix "-staging"
        }
    }
}
EOF
        fi
    fi
    
    # Create Android signing guide
    cat > "$ANDROID_KEYSTORE_DIR/README.md" << EOF
# Android Code Signing Setup

## Development Keystore
A debug keystore has been automatically generated for development builds.

## Production Keystore Generation
\`\`\`bash
# Generate production keystore
keytool -genkeypair -v -keystore release.keystore \\
    -alias tailtracker \\
    -keyalg RSA \\
    -keysize 2048 \\
    -validity 25000 \\
    -storepass YOUR_STORE_PASSWORD \\
    -keypass YOUR_KEY_PASSWORD \\
    -dname "CN=TailTracker, OU=Mobile, O=TailTracker Inc, L=Your City, S=Your State, C=US"
\`\`\`

## Configuration Steps
1. Copy \`gradle.properties.template\` to \`android/gradle.properties\`
2. Update with your actual keystore passwords
3. Ensure keystores are added to .gitignore
4. For production, store keystore securely (not in version control)

## EAS Build Integration
\`\`\`bash
# Configure Android credentials with EAS
eas credentials -p android

# Upload keystore
eas credentials:configure -p android --keystore-path ./android/keystores/release.keystore
\`\`\`

## Security Best Practices
- Never commit keystores to version control
- Store production passwords in secure credential management
- Backup keystores securely - losing them means you cannot update your app
- Use different keystores for different environments

## Google Play Console Setup
1. Upload your release keystore to Play Console
2. Enable Google Play App Signing (recommended)
3. Configure signing key rotation if needed
EOF
    
    print_message $GREEN "✅ Android signing configuration created"
}

# GitHub Actions Secrets Setup
setup_github_secrets() {
    print_message $BLUE "\n🔐 Setting up GitHub Actions Secrets Guide"
    
    cat > "docs/github-secrets-setup.md" << EOF
# GitHub Actions Secrets Setup

Configure the following secrets in your GitHub repository settings:

## General Secrets
\`\`\`
EXPO_TOKEN=your-expo-access-token
CODECOV_TOKEN=your-codecov-token (optional)
SLACK_WEBHOOK=your-slack-webhook-url (optional)
\`\`\`

## API & Service Secrets
\`\`\`
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anonymous-key
FIREBASE_API_KEY=your-firebase-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
APPLE_MAPS_API_KEY=your-apple-maps-api-key (optional)
STRIPE_PUBLISHABLE_KEY_TEST=your-stripe-test-publishable-key
STRIPE_PUBLISHABLE_KEY_LIVE=your-stripe-live-publishable-key
\`\`\`

## iOS Signing Secrets
\`\`\`
IOS_DIST_CERTIFICATE=base64-encoded-distribution-certificate-p12
CERT_PASSWORD=certificate-password
MATCH_PASSWORD=match-password (if using fastlane match)
\`\`\`

## Android Signing Secrets
\`\`\`
ANDROID_KEYSTORE=base64-encoded-release-keystore
ANDROID_KEYSTORE_PASSWORD=keystore-password
ANDROID_KEY_ALIAS=key-alias
ANDROID_KEY_PASSWORD=key-password
\`\`\`

## Setup Commands

### Encode iOS Certificate
\`\`\`bash
base64 -i YourCertificate.p12 -o certificate.base64
# Copy contents of certificate.base64 to IOS_DIST_CERTIFICATE secret
\`\`\`

### Encode Android Keystore
\`\`\`bash
base64 -i release.keystore -o keystore.base64
# Copy contents of keystore.base64 to ANDROID_KEYSTORE secret
\`\`\`

### Add Secrets via GitHub CLI
\`\`\`bash
gh secret set EXPO_TOKEN --body "your-token-here"
gh secret set SUPABASE_URL --body "your-supabase-url"
# ... repeat for all secrets
\`\`\`
EOF
    
    print_message $GREEN "✅ GitHub secrets setup guide created"
}

# Main execution
print_message $BLUE "Starting code signing setup...\n"

# Create docs directory if it doesn't exist
mkdir -p docs

# Setup based on platform
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    setup_ios_signing
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    setup_android_signing
fi

# Always setup GitHub secrets guide
setup_github_secrets

# Create .gitignore entries for sensitive files
print_message $BLUE "\n📝 Updating .gitignore for security"

GITIGNORE_ENTRIES="
# Code Signing - TailTracker
android/keystores/*.keystore
android/keystores/*.jks
android/app/release.keystore
android/app/*.keystore
android/service-account-key.json
ios/certificates/*.p12
ios/certificates/*.mobileprovision
ios/AuthKey*.p8
Matchfile
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots
fastlane/test_output
.env.local
.env.*.local
credentials.json
keystore.properties
gradle.properties"

if [[ -f ".gitignore" ]]; then
    # Check if entries already exist
    if ! grep -q "Code Signing - TailTracker" .gitignore; then
        echo "$GITIGNORE_ENTRIES" >> .gitignore
        print_message $GREEN "✅ Updated .gitignore with code signing exclusions"
    else
        print_message $YELLOW "ℹ️ .gitignore already contains code signing exclusions"
    fi
else
    echo "$GITIGNORE_ENTRIES" > .gitignore
    print_message $GREEN "✅ Created .gitignore with code signing exclusions"
fi

print_message $GREEN "\n🎉 Code signing setup completed!"
print_message $BLUE "\nNext steps:"
echo "1. Review the generated configuration files"
echo "2. Update placeholder values with your actual credentials"
echo "3. Configure GitHub Actions secrets (see docs/github-secrets-setup.md)"
echo "4. Test builds with different environments"
echo "5. Never commit keystores or certificates to version control"

print_message $YELLOW "\nImportant Security Notes:"
echo "- Backup your keystores and certificates securely"
echo "- Use different signing identities for different environments"
echo "- Rotate certificates before they expire"
echo "- Monitor for any signing-related security advisories"