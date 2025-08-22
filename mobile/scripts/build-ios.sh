#!/bin/bash

# TailTracker iOS Build Script
# Enhanced build script for iOS with comprehensive validation and optimization

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
ENVIRONMENT="development"
DEVICE_TYPE="device"
CLEAN_BUILD=false
RUN_TESTS=true
ARCHIVE_BUILD=false
UPLOAD_ARTIFACTS=false

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
    echo "  -e, --environment    Environment (development|staging|production) [default: development]"
    echo "  -d, --device         Device type (device|simulator) [default: device]"
    echo "  -c, --clean         Perform clean build"
    echo "  --no-tests          Skip running tests"
    echo "  -a, --archive       Create archive build"
    echo "  -u, --upload        Upload build artifacts"
    echo "  -h, --help          Show this help message"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--device)
            DEVICE_TYPE="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        --no-tests)
            RUN_TESTS=false
            shift
            ;;
        -a|--archive)
            ARCHIVE_BUILD=true
            shift
            ;;
        -u|--upload)
            UPLOAD_ARTIFACTS=true
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

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_message $RED "Error: Invalid environment. Must be development, staging, or production."
    exit 1
fi

# Validate device type
if [[ ! "$DEVICE_TYPE" =~ ^(device|simulator)$ ]]; then
    print_message $RED "Error: Invalid device type. Must be device or simulator."
    exit 1
fi

print_message $BLUE "Starting TailTracker iOS Build Process"
print_message $YELLOW "Environment: $ENVIRONMENT"
print_message $YELLOW "Device Type: $DEVICE_TYPE"
print_message $YELLOW "Clean Build: $CLEAN_BUILD"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_message $RED "Error: iOS builds can only be performed on macOS"
    exit 1
fi

# Change to project directory
cd "$PROJECT_DIR"

# Load environment variables
ENV_FILE=".env.${ENVIRONMENT}"
if [[ -f "$ENV_FILE" ]]; then
    print_message $GREEN "Loading environment variables from $ENV_FILE"
    set -a  # Automatically export all variables
    source "$ENV_FILE"
    set +a
else
    print_message $YELLOW "Warning: Environment file $ENV_FILE not found. Using default values."
fi

# Pre-build validation
print_message $BLUE "Running pre-build validation..."

# Check Xcode installation
if ! command -v xcodebuild >/dev/null 2>&1; then
    print_message $RED "Error: Xcode is not installed or not in PATH"
    exit 1
fi

# Check Xcode version
XCODE_VERSION=$(xcodebuild -version | head -n 1 | sed 's/Xcode //')
print_message $YELLOW "Xcode version: $XCODE_VERSION"

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_NODE_VERSION="18.0.0"
if ! npx semver -r ">=$REQUIRED_NODE_VERSION" "$NODE_VERSION" >/dev/null 2>&1; then
    print_message $RED "Error: Node.js version $NODE_VERSION is not compatible. Required: >=$REQUIRED_NODE_VERSION"
    exit 1
fi

# Check CocoaPods installation
if ! command -v pod >/dev/null 2>&1; then
    print_message $RED "Error: CocoaPods is not installed"
    exit 1
fi

# Check if required files exist
REQUIRED_FILES=("package.json" "app.json" "eas.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_message $RED "Error: Required file $file not found"
        exit 1
    fi
done

# Check if iOS directory exists
if [[ ! -d "ios" ]]; then
    print_message $YELLOW "iOS directory not found. Running prebuild..."
    npx expo prebuild --platform ios --clean
fi

# Install dependencies
print_message $BLUE "Installing dependencies..."
npm ci

# Install iOS dependencies
print_message $BLUE "Installing iOS dependencies..."
cd ios
pod install --repo-update
cd ..

# Run linting
print_message $BLUE "Running code quality checks..."
npm run lint || {
    print_message $RED "Linting failed. Please fix linting errors before building."
    exit 1
}

# Run type checking
npm run type-check || {
    print_message $RED "Type checking failed. Please fix TypeScript errors before building."
    exit 1
}

# Run tests if enabled
if [[ "$RUN_TESTS" == true ]]; then
    print_message $BLUE "Running tests..."
    npm run test -- --passWithNoTests || {
        print_message $RED "Tests failed. Please fix failing tests before building."
        exit 1
    }
fi

# Clean build if requested
if [[ "$CLEAN_BUILD" == true ]]; then
    print_message $BLUE "Performing clean build..."
    rm -rf node_modules/.cache
    rm -rf ios/build
    
    # Clean Xcode build
    cd ios
    xcodebuild clean -workspace TailTracker.xcworkspace -scheme TailTracker
    cd ..
    
    # Clean derived data
    rm -rf ~/Library/Developer/Xcode/DerivedData/TailTracker-*
fi

# Set EAS build profile based on environment
case $ENVIRONMENT in
    development)
        EAS_PROFILE="development"
        ;;
    staging)
        EAS_PROFILE="preview"
        ;;
    production)
        EAS_PROFILE="production"
        ;;
esac

# Build the app
print_message $BLUE "Building iOS app for $ENVIRONMENT environment..."

# Set build command based on environment and device type
if [[ "$DEVICE_TYPE" == "simulator" ]]; then
    BUILD_COMMAND="eas build --platform ios --profile simulator --local"
elif [[ "$ENVIRONMENT" == "development" ]]; then
    BUILD_COMMAND="eas build --platform ios --profile development --local"
else
    BUILD_COMMAND="eas build --platform ios --profile $EAS_PROFILE"
fi

# Execute build
eval "$BUILD_COMMAND" || {
    print_message $RED "Build failed!"
    exit 1
}

# Post-build validation
print_message $BLUE "Running post-build validation..."

# Check if build artifacts exist
if [[ "$DEVICE_TYPE" == "simulator" ]]; then
    ARTIFACT_PATH="ios/build/Build/Products/Debug-iphonesimulator/TailTracker.app"
    ARTIFACT_TYPE="app"
else
    if [[ "$ENVIRONMENT" == "development" ]]; then
        ARTIFACT_PATH="ios/build/Build/Products/Debug-iphoneos/TailTracker.app"
        ARTIFACT_TYPE="app"
    else
        # For EAS builds, artifact location will be different
        print_message $YELLOW "EAS build completed. Check EAS dashboard for build artifacts."
        ARTIFACT_PATH=""
        ARTIFACT_TYPE="ipa"
    fi
fi

# Validate local build artifacts
if [[ -n "$ARTIFACT_PATH" && -d "$ARTIFACT_PATH" ]]; then
    print_message $GREEN "Build artifact created successfully: $ARTIFACT_PATH"
    
    # Get app bundle size
    APP_SIZE=$(du -sh "$ARTIFACT_PATH" | cut -f1)
    print_message $YELLOW "Build size: $APP_SIZE"
    
    # Verify app bundle
    if [[ -f "$ARTIFACT_PATH/Info.plist" ]]; then
        BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "$ARTIFACT_PATH/Info.plist")
        APP_VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "$ARTIFACT_PATH/Info.plist")
        BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$ARTIFACT_PATH/Info.plist")
        
        print_message $YELLOW "Bundle ID: $BUNDLE_ID"
        print_message $YELLOW "App Version: $APP_VERSION"
        print_message $YELLOW "Build Number: $BUILD_NUMBER"
    fi
fi

# Create archive if requested
if [[ "$ARCHIVE_BUILD" == true && "$DEVICE_TYPE" == "device" ]]; then
    print_message $BLUE "Creating archive..."
    
    cd ios
    xcodebuild archive \
        -workspace TailTracker.xcworkspace \
        -scheme TailTracker \
        -configuration Release \
        -archivePath build/TailTracker.xcarchive \
        CODE_SIGN_IDENTITY="" \
        CODE_SIGNING_REQUIRED=NO || {
        print_message $RED "Archive creation failed!"
        exit 1
    }
    cd ..
    
    print_message $GREEN "Archive created successfully: ios/build/TailTracker.xcarchive"
fi

# Upload artifacts if requested
if [[ "$UPLOAD_ARTIFACTS" == true ]]; then
    print_message $BLUE "Uploading build artifacts..."
    
    # Create artifacts directory
    ARTIFACTS_DIR="build-artifacts/ios/$ENVIRONMENT/$(date +%Y-%m-%d_%H-%M-%S)"
    mkdir -p "$ARTIFACTS_DIR"
    
    # Copy build artifacts
    if [[ -n "$ARTIFACT_PATH" && -d "$ARTIFACT_PATH" ]]; then
        cp -R "$ARTIFACT_PATH" "$ARTIFACTS_DIR/"
    fi
    
    # Copy dSYM files for crash reporting
    DSYM_PATH="ios/build/Build/Products/Release-iphoneos/TailTracker.app.dSYM"
    if [[ -d "$DSYM_PATH" ]]; then
        cp -R "$DSYM_PATH" "$ARTIFACTS_DIR/"
    fi
    
    # Copy archive if exists
    ARCHIVE_PATH="ios/build/TailTracker.xcarchive"
    if [[ -d "$ARCHIVE_PATH" ]]; then
        cp -R "$ARCHIVE_PATH" "$ARTIFACTS_DIR/"
    fi
    
    print_message $GREEN "Build artifacts saved to: $ARTIFACTS_DIR"
fi

# Generate build report
BUILD_REPORT_FILE="build-reports/ios-build-report-$(date +%Y-%m-%d_%H-%M-%S).json"
mkdir -p "$(dirname "$BUILD_REPORT_FILE")"

cat > "$BUILD_REPORT_FILE" << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "deviceType": "$DEVICE_TYPE",
  "platform": "ios",
  "xcodeVersion": "$XCODE_VERSION",
  "nodeVersion": "$NODE_VERSION",
  "artifactPath": "$ARTIFACT_PATH",
  "bundleId": "${BUNDLE_ID:-unknown}",
  "appVersion": "${APP_VERSION:-unknown}",
  "buildNumber": "${BUILD_NUMBER:-unknown}",
  "buildSize": "${APP_SIZE:-unknown}",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

print_message $GREEN "Build report saved to: $BUILD_REPORT_FILE"

print_message $GREEN "iOS build completed successfully!"
if [[ -n "$ARTIFACT_PATH" ]]; then
    print_message $YELLOW "Build artifact: $ARTIFACT_PATH"
    print_message $YELLOW "Build size: ${APP_SIZE:-unknown}"
fi

# Show next steps
print_message $BLUE "Next steps:"
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "  1. Test the build on physical devices"
    echo "  2. Upload to TestFlight: npm run submit:ios:testflight"
    echo "  3. Monitor crash reports and analytics"
elif [[ "$DEVICE_TYPE" == "simulator" ]]; then
    echo "  1. Run on iOS Simulator: npm run ios"
    echo "  2. Test core functionality"
    echo "  3. Test on physical device when ready"
else
    echo "  1. Install on test device via Xcode"
    echo "  2. Test core functionality"
    echo "  3. Share with QA team for testing"
fi