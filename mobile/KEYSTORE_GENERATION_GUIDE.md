# TailTracker Android Keystore Generation Guide

## Overview
This guide documents the complete process for generating and configuring the production keystore for the TailTracker Android application. This keystore is used to sign release builds for Google Play Store distribution.

## Prerequisites

### System Requirements
- Java JDK 8 or later installed
- Access to `keytool` command (included with JDK)
- Android SDK and build tools configured
- Secure environment for keystore generation

### Install Java JDK (if not installed)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install default-jdk

# macOS (with Homebrew)
brew install openjdk

# Windows
# Download and install Oracle JDK or OpenJDK from official website
```

### Verify Installation
```bash
java -version
keytool -help
```

## Keystore Generation Process

### Step 1: Prepare Secure Environment
```bash
# Navigate to project root
cd /path/to/TailTracker/mobile

# Create secure directory for keystores (if not exists)
mkdir -p android/app

# Set secure permissions
chmod 700 android/app
```

### Step 2: Generate Secure Passwords
```bash
# Generate keystore password (save this securely)
openssl rand -base64 32

# Generate key password (save this securely) 
openssl rand -base64 32
```

**Generated Passwords for TailTracker:**
- **Keystore Password**: `qqyQ9Q5qw7pgpjdj9QWZkYeH+hbc4E4Grct10CIu1EI=`
- **Key Password**: `3M+IcmVFLXf3qYZZUj6VR9dLnHlNJ/B/M/cBVFlzUxQ=`

### Step 3: Generate Production Keystore
```bash
keytool -genkeypair \
    -keystore android/app/tailtracker-release.keystore \
    -alias tailtracker-release \
    -keyalg RSA \
    -keysize 2048 \
    -validity 30000 \
    -dname "CN=TailTracker,OU=Mobile Development,O=TailTracker LLC,L=San Francisco,ST=California,C=US" \
    -storepass "qqyQ9Q5qw7pgpjdj9QWZkYeH+hbc4E4Grct10CIu1EI=" \
    -keypass "3M+IcmVFLXf3qYZZUj6VR9dLnHlNJ/B/M/cBVFlzUxQ=" \
    -storetype PKCS12
```

### Step 4: Verify Keystore Generation
```bash
# List keystore contents
keytool -list -v -keystore android/app/tailtracker-release.keystore \
    -storepass "qqyQ9Q5qw7pgpjdj9QWZkYeH+hbc4E4Grct10CIu1EI="

# Check file permissions
ls -la android/app/tailtracker-release.keystore
```

### Step 5: Set Secure File Permissions
```bash
# Set keystore file permissions (owner read/write only)
chmod 600 android/app/tailtracker-release.keystore
```

## Configuration Files

### keystore.properties
This file contains the keystore configuration and passwords. **Never commit this to version control.**

```properties
# TailTracker Production Keystore Configuration
MYAPP_UPLOAD_STORE_FILE=tailtracker-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=tailtracker-release
MYAPP_UPLOAD_STORE_PASSWORD=qqyQ9Q5qw7pgpjdj9QWZkYeH+hbc4E4Grct10CIu1EI=
MYAPP_UPLOAD_KEY_PASSWORD=3M+IcmVFLXf3qYZZUj6VR9dLnHlNJ/B/M/cBVFlzUxQ=
```

### Android Build Configuration
The `android/app/build.gradle` has been updated to load keystore configuration:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        // Load keystore properties
        def keystorePropertiesFile = rootProject.file("keystore.properties")
        def keystoreProperties = new Properties()
        if (keystorePropertiesFile.exists()) {
            keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
            storeFile file(keystoreProperties['MYAPP_UPLOAD_STORE_FILE'])
            storePassword keystoreProperties['MYAPP_UPLOAD_STORE_PASSWORD']
            keyAlias keystoreProperties['MYAPP_UPLOAD_KEY_ALIAS']
            keyPassword keystoreProperties['MYAPP_UPLOAD_KEY_PASSWORD']
        } else {
            // Fallback for CI/CD environments using environment variables
            storeFile file(System.getenv('KEYSTORE_FILE') ?: 'tailtracker-release.keystore')
            storePassword System.getenv('KEYSTORE_PASSWORD')
            keyAlias System.getenv('KEY_ALIAS') ?: 'tailtracker-release'
            keyPassword System.getenv('KEY_PASSWORD')
        }
    }
}
```

## Keystore Specifications

### Certificate Details
- **Common Name (CN)**: TailTracker
- **Organizational Unit (OU)**: Mobile Development
- **Organization (O)**: TailTracker LLC
- **Locality (L)**: San Francisco
- **State (ST)**: California
- **Country (C)**: US

### Technical Specifications
- **Key Algorithm**: RSA
- **Key Size**: 2048 bits
- **Validity Period**: 30000 days (~82 years)
- **Store Type**: PKCS12
- **Alias**: tailtracker-release

### File Locations
- **Keystore File**: `android/app/tailtracker-release.keystore`
- **Configuration**: `keystore.properties`
- **Backup Strategy**: See `KEYSTORE_BACKUP_STRATEGY.md`

## Building Signed Release

### Command Line Build
```bash
# Navigate to android directory
cd android

# Build signed release APK
./gradlew assembleRelease

# Build signed release AAB (Android App Bundle)
./gradlew bundleRelease
```

### Build Output Locations
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

## CI/CD Configuration

### Environment Variables for CI/CD
For secure CI/CD pipelines, use environment variables instead of files:

```bash
export KEYSTORE_FILE="tailtracker-release.keystore"
export KEYSTORE_PASSWORD="qqyQ9Q5qw7pgpjdj9QWZkYeH+hbc4E4Grct10CIu1EI="
export KEY_ALIAS="tailtracker-release"
export KEY_PASSWORD="3M+IcmVFLXf3qYZZUj6VR9dLnHlNJ/B/M/cBVFlzUxQ="
```

### GitHub Actions Example
```yaml
env:
  KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
  KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
  KEY_ALIAS: tailtracker-release
  KEYSTORE_FILE: tailtracker-release.keystore

steps:
  - name: Decode keystore
    run: |
      echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > android/app/tailtracker-release.keystore
  
  - name: Build signed APK
    run: |
      cd android
      ./gradlew assembleRelease
```

## Security Best Practices

### Password Security
1. **Never hardcode passwords** in build scripts or configuration files
2. **Use environment variables** for CI/CD environments
3. **Store passwords securely** in enterprise password managers
4. **Rotate passwords annually** (requires new keystore generation)
5. **Use different passwords** for keystore and key when possible

### File Security
1. **Never commit keystores** to version control
2. **Set restrictive file permissions** (600 for keystore files)
3. **Store in secure directories** with limited access
4. **Encrypt backup copies** of keystores
5. **Use dedicated backup solutions** for critical files

### Access Control
1. **Limit access** to essential personnel only
2. **Use principle of least privilege**
3. **Log keystore access** and usage
4. **Regular security audits** of keystore access
5. **Two-person approval** for keystore changes

## Troubleshooting

### Common Issues

#### 1. Keystore Not Found
```
Error: Keystore file not found
Solution: Check file path and permissions
```

#### 2. Invalid Password
```
Error: Keystore password incorrect
Solution: Verify password in keystore.properties
```

#### 3. Certificate Expired
```
Error: Certificate has expired
Solution: Generate new keystore (requires new app on Play Store)
```

#### 4. Build Fails with Signing Error
```
Error: Failed to sign APK
Solution: Check keystore file permissions and password configuration
```

### Verification Commands
```bash
# Verify keystore exists and is readable
ls -la android/app/tailtracker-release.keystore

# List keystore contents
keytool -list -keystore android/app/tailtracker-release.keystore

# Verify certificate details
keytool -list -v -keystore android/app/tailtracker-release.keystore

# Check APK signature
apksigner verify --verbose app-release.apk
```

## Google Play Store Setup

### App Signing Options

#### Option 1: Google Play App Signing (Recommended)
1. Upload your APK/AAB signed with the upload key
2. Google re-signs with their own key for distribution
3. Enhanced security and recovery options
4. Can recover from upload key loss

#### Option 2: Manual Signing
1. Use your keystore to sign APK/AAB
2. Upload directly to Play Store
3. You manage the signing key entirely
4. No recovery if keystore is lost

### Enrolling in Google Play App Signing
1. Go to Play Console → App Signing
2. Follow the enrollment process
3. Upload your certificate or existing APK
4. Google will manage the app signing key

## Maintenance and Updates

### Annual Tasks
- [ ] Verify keystore accessibility from all backup locations
- [ ] Test release build process with current keystore
- [ ] Review and update access permissions
- [ ] Audit security practices and procedures
- [ ] Update backup copies if any changes made

### When to Generate New Keystore
- **Never** unless absolutely necessary (breaks app updates)
- Only if current keystore is permanently lost
- Only if keystore is compromised
- Consider migration to Google Play App Signing instead

### Record Keeping
- Document all keystore generation activities
- Maintain change log of keystore-related modifications
- Keep backup verification logs
- Document who has access and when access was granted

## Contact Information

### Internal Support
- **DevOps Team**: [Add contact information]
- **Security Team**: [Add contact information]
- **Project Manager**: [Add contact information]

### External Resources
- **Android Developer Documentation**: https://developer.android.com/studio/publish/app-signing
- **Google Play Console Help**: https://support.google.com/googleplay/android-developer/
- **Keystore Security Best Practices**: https://developer.android.com/studio/publish/app-signing#secure-key

---

**Important**: This keystore is critical for app distribution. Loss of the keystore means inability to update the app on Google Play Store. Always follow security best practices and maintain secure backups.