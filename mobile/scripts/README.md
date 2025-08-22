# TailTracker Build & Deployment Scripts

This directory contains comprehensive build, deployment, and automation scripts for the TailTracker mobile application.

## 🚀 Core Build Scripts

### Enhanced Build Scripts
- **`build-android.sh`** - Comprehensive Android build with validation, signing, and artifact management
- **`build-ios.sh`** - Complete iOS build with Xcode integration, code signing, and archive creation
- **`build-release.sh`** - Legacy release build script (superseded by enhanced scripts)

### Pre-build Validation
- **`preflight-check.sh`** - Comprehensive pre-build validation and checklist system
  - Project structure validation
  - Dependency checking
  - Configuration verification
  - Security scanning
  - Compliance checks

### Version Management
- **`version-bump.sh`** - Automated version bumping with Git integration
  - Semantic versioning support
  - Platform-specific build number management
  - Automatic changelog generation
  - Git tagging and commit automation

### Code Signing & Security
- **`setup-code-signing.sh`** - Complete code signing setup for iOS and Android
  - Keystore generation and management
  - Certificate configuration
  - Provisioning profile setup
  - Security best practices

## 📱 Platform-Specific Scripts

### iOS Scripts
- **`build-ios.sh`** - Enhanced iOS building with comprehensive validation
- **`deploy-ios.sh`** - iOS deployment and TestFlight submission

### Android Scripts  
- **`build-android.sh`** - Enhanced Android building with multiple output formats
- **`generate-keystore.sh`** - Android keystore generation and configuration

## 🎨 Asset Generation

### Icon Management
- **`generate-icons.js`** - Node.js-based icon generation from SVG sources
- **`generate-icons.py`** - Python icon generation with optimization
- **`generate-icons.sh`** - Shell script for batch icon processing
- **`setup-icons.sh`** - Icon setup and platform configuration
- **`svg-to-png-converter.html`** - Web-based SVG to PNG converter tool

## 📋 Quick Usage Guide

### Make Scripts Executable
```bash
chmod +x scripts/*.sh
```

### Essential Commands
```bash
# Pre-build validation
./scripts/preflight-check.sh --environment production

# Build for development
./scripts/build-android.sh --environment development
./scripts/build-ios.sh --environment development

# Version management
./scripts/version-bump.sh --type patch
./scripts/version-bump.sh --type minor --platform ios

# Setup code signing
./scripts/setup-code-signing.sh --platform both
```

### Build Options

#### Android Build Options
```bash
./scripts/build-android.sh [OPTIONS]
  -e, --environment    Environment (development|staging|production)
  -t, --type          Build type (apk|aab)
  -c, --clean         Perform clean build
  --no-tests          Skip running tests
  -s, --sign          Sign the build
  -u, --upload        Upload build artifacts
```

#### iOS Build Options
```bash
./scripts/build-ios.sh [OPTIONS]
  -e, --environment    Environment (development|staging|production)
  -d, --device         Device type (device|simulator)
  -c, --clean         Perform clean build
  --no-tests          Skip running tests
  -a, --archive       Create archive build
  -u, --upload        Upload build artifacts
```

## 🔧 Configuration

### Environment Setup
Scripts automatically load environment-specific configuration from:
- `.env.development`
- `.env.staging` 
- `.env.production`

### Build Profiles
Scripts integrate with EAS build profiles defined in `eas.json`:
- `development` - Development builds with debugging
- `preview` - Staging builds for internal testing
- `production` - Production builds for store distribution
- `simulator` - iOS simulator builds
- `testflight` - TestFlight distribution builds

## 📊 Validation & Quality

### Preflight Checks
The preflight script performs comprehensive validation:
- ✅ Project structure and dependencies
- ✅ Configuration validation
- ✅ Code quality (linting, type checking)
- ✅ Security scanning
- ✅ Compliance verification
- ✅ Build prerequisites

### Security Features
- Automatic secret detection and prevention
- Keystore and certificate management
- Environment-specific security validation
- .gitignore automation for sensitive files

## 🏗️ Build Artifacts

### Artifact Structure
```
build-artifacts/
├── android/
│   ├── development/YYYY-MM-DD_HH-MM-SS/
│   ├── staging/YYYY-MM-DD_HH-MM-SS/
│   └── production/YYYY-MM-DD_HH-MM-SS/
└── ios/
    ├── development/YYYY-MM-DD_HH-MM-SS/
    ├── staging/YYYY-MM-DD_HH-MM-SS/
    └── production/YYYY-MM-DD_HH-MM-SS/
```

### Build Reports
Each build generates comprehensive reports:
- Build metadata (versions, commit info)
- Artifact information (size, checksums)
- Validation results
- Performance metrics

## 🚨 Error Handling

### Comprehensive Error Detection
- Dependency compatibility checking
- Build tool version validation
- Configuration error detection
- Platform-specific issue identification

### Recovery Procedures
- Automatic cleanup on failure
- Detailed error reporting
- Suggested fix recommendations
- Rollback capabilities

## 🔄 CI/CD Integration

### GitHub Actions Integration
Scripts are designed to work seamlessly with our CI/CD pipeline:
- Environment variable injection
- Artifact upload automation
- Status reporting
- Notification integration

### Local Development
All scripts can be run locally with the same behavior as CI:
```bash
# Local build matching CI
./scripts/build-android.sh --environment staging --clean --upload
```

## 📚 Documentation

### Comprehensive Guides
- **[BUILD_GUIDE.md](../BUILD_GUIDE.md)** - Complete build and deployment guide
- **[DEPLOYMENT_QUICK_REFERENCE.md](../DEPLOYMENT_QUICK_REFERENCE.md)** - Quick command reference
- **Individual script help** - Run any script with `--help` flag

### Getting Help
```bash
# Get help for any script
./scripts/build-android.sh --help
./scripts/preflight-check.sh --help
./scripts/version-bump.sh --help
```

## 🧪 Testing Integration

### Automated Testing
Scripts integrate comprehensive testing:
- Unit test execution
- Integration test validation
- E2E test preparation
- Performance benchmark collection

### Quality Gates
- Code quality validation (linting, type checking)
- Security vulnerability scanning
- Dependency audit execution
- Build artifact verification

---

## 🏷️ Script Categories

| Category | Scripts | Purpose |
|----------|---------|---------|
| **Core Builds** | `build-android.sh`, `build-ios.sh` | Platform-specific building |
| **Validation** | `preflight-check.sh` | Pre-build validation |
| **Version Management** | `version-bump.sh` | Automated versioning |
| **Security** | `setup-code-signing.sh` | Code signing setup |
| **Assets** | `generate-icons.*`, `setup-icons.sh` | Asset generation |
| **Legacy** | `build-release.sh`, `deploy-ios.sh` | Legacy scripts |

---

*All scripts follow best practices for error handling, logging, and user experience. For detailed information, see the comprehensive [BUILD_GUIDE.md](../BUILD_GUIDE.md).*