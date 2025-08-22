#!/bin/bash

# TailTracker Android Build Script
# Enhanced build script for Android with comprehensive validation and optimization

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
BUILD_TYPE="apk"
CLEAN_BUILD=false
RUN_TESTS=true
SIGN_BUILD=false
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
    echo "  -t, --type          Build type (apk|aab) [default: apk]"
    echo "  -c, --clean         Perform clean build"
    echo "  --no-tests          Skip running tests"
    echo "  -s, --sign          Sign the build"
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
        -t|--type)
            BUILD_TYPE="$2"
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
        -s|--sign)
            SIGN_BUILD=true
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

# Validate build type
if [[ ! "$BUILD_TYPE" =~ ^(apk|aab)$ ]]; then
    print_message $RED "Error: Invalid build type. Must be apk or aab."
    exit 1
fi

print_message $BLUE "Starting TailTracker Android Build Process"
print_message $YELLOW "Environment: $ENVIRONMENT"
print_message $YELLOW "Build Type: $BUILD_TYPE"
print_message $YELLOW "Clean Build: $CLEAN_BUILD"

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

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_NODE_VERSION="18.0.0"
if ! npx semver -r ">=$REQUIRED_NODE_VERSION" "$NODE_VERSION" >/dev/null 2>&1; then
    print_message $RED "Error: Node.js version $NODE_VERSION is not compatible. Required: >=$REQUIRED_NODE_VERSION"
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

# Check if Android directory exists
if [[ ! -d "android" ]]; then
    print_message $YELLOW "Android directory not found. Running prebuild..."
    npx expo prebuild --platform android --clean
fi

# Install dependencies
print_message $BLUE "Installing dependencies..."
npm ci

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
    rm -rf android/app/build
    rm -rf android/build
    
    # Clean gradle
    cd android
    ./gradlew clean
    cd ..
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
print_message $BLUE "Building Android app for $ENVIRONMENT environment..."

if [[ "$BUILD_TYPE" == "aab" ]]; then
    GRADLE_COMMAND=":app:bundleRelease"
else
    GRADLE_COMMAND=":app:assembleRelease"
fi

# Set build command based on environment
if [[ "$ENVIRONMENT" == "development" ]]; then
    BUILD_COMMAND="eas build --platform android --profile development --local"
else
    BUILD_COMMAND="eas build --platform android --profile $EAS_PROFILE"
fi

# Execute build
eval "$BUILD_COMMAND" || {
    print_message $RED "Build failed!"
    exit 1
}

# Post-build validation
print_message $BLUE "Running post-build validation..."

# Check if build artifacts exist
BUILD_OUTPUT_DIR="android/app/build/outputs"
if [[ "$BUILD_TYPE" == "aab" ]]; then
    ARTIFACT_PATH="$BUILD_OUTPUT_DIR/bundle/release/app-release.aab"
else
    ARTIFACT_PATH="$BUILD_OUTPUT_DIR/apk/release/app-release.apk"
fi

if [[ -f "$ARTIFACT_PATH" ]]; then
    print_message $GREEN "Build artifact created successfully: $ARTIFACT_PATH"
    
    # Get file size
    FILE_SIZE=$(stat -c%s "$ARTIFACT_PATH" | numfmt --to=iec)
    print_message $YELLOW "Build size: $FILE_SIZE"
    
    # Verify APK/AAB integrity
    if command -v aapt >/dev/null 2>&1; then
        aapt dump badging "$ARTIFACT_PATH" > /dev/null || {
            print_message $RED "Error: Build artifact is corrupted"
            exit 1
        }
    fi
else
    print_message $RED "Error: Build artifact not found at $ARTIFACT_PATH"
    exit 1
fi

# Sign build if requested
if [[ "$SIGN_BUILD" == true ]]; then
    print_message $BLUE "Signing build..."
    
    KEYSTORE_PATH="android/app/release.keystore"
    if [[ ! -f "$KEYSTORE_PATH" ]]; then
        print_message $RED "Error: Release keystore not found at $KEYSTORE_PATH"
        exit 1
    fi
    
    # Sign the build (implementation depends on your signing setup)
    print_message $YELLOW "Note: Signing implementation depends on your specific keystore configuration"
fi

# Upload artifacts if requested
if [[ "$UPLOAD_ARTIFACTS" == true ]]; then
    print_message $BLUE "Uploading build artifacts..."
    
    # Create artifacts directory
    ARTIFACTS_DIR="build-artifacts/android/$ENVIRONMENT/$(date +%Y-%m-%d_%H-%M-%S)"
    mkdir -p "$ARTIFACTS_DIR"
    
    # Copy build artifacts
    cp "$ARTIFACT_PATH" "$ARTIFACTS_DIR/"
    
    # Copy mapping files for crash reporting
    if [[ -f "android/app/build/outputs/mapping/release/mapping.txt" ]]; then
        cp "android/app/build/outputs/mapping/release/mapping.txt" "$ARTIFACTS_DIR/"
    fi
    
    print_message $GREEN "Build artifacts saved to: $ARTIFACTS_DIR"
fi

# Generate build report
BUILD_REPORT_FILE="build-reports/android-build-report-$(date +%Y-%m-%d_%H-%M-%S).json"
mkdir -p "$(dirname "$BUILD_REPORT_FILE")"

cat > "$BUILD_REPORT_FILE" << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "buildType": "$BUILD_TYPE",
  "platform": "android",
  "nodeVersion": "$NODE_VERSION",
  "artifactPath": "$ARTIFACT_PATH",
  "buildSize": "$FILE_SIZE",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

print_message $GREEN "Build report saved to: $BUILD_REPORT_FILE"

print_message $GREEN "Android build completed successfully!"
print_message $YELLOW "Build artifact: $ARTIFACT_PATH"
print_message $YELLOW "Build size: $FILE_SIZE"

# Show next steps
print_message $BLUE "Next steps:"
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "  1. Test the build on physical devices"
    echo "  2. Upload to Google Play Console: npm run submit:android"
    echo "  3. Monitor crash reports and analytics"
else
    echo "  1. Install on test device: adb install $ARTIFACT_PATH"
    echo "  2. Test core functionality"
    echo "  3. Share with QA team for testing"
fi