#!/bin/bash

# TailTracker Android Release Build Script
# This script builds optimized production releases for Google Play Store

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
BUILD_TYPE="release"
FLAVOR=""
OUTPUT_DIR="$PROJECT_ROOT/build-output"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --flavor)
      FLAVOR="$2"
      shift 2
      ;;
    --build-type)
      BUILD_TYPE="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --flavor FLAVOR       Build flavor (lite, premium)"
      echo "  --build-type TYPE     Build type (release, debug)"
      echo "  --output-dir DIR      Output directory for build artifacts"
      echo "  --help               Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check for Android SDK
    if [[ -z "$ANDROID_HOME" && -z "$ANDROID_SDK_ROOT" ]]; then
        error "Android SDK not found. Please set ANDROID_HOME or ANDROID_SDK_ROOT."
        exit 1
    fi
    
    # Check for Java
    if ! command -v java &> /dev/null; then
        error "Java not found. Please install Java 11 or later."
        exit 1
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js not found. Please install Node.js 18 or later."
        exit 1
    fi
    
    # Check for Yarn
    if ! command -v yarn &> /dev/null; then
        warning "Yarn not found. Using npm instead."
    fi
    
    log "Prerequisites check completed"
}

setup_environment() {
    log "Setting up build environment..."
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Set build timestamp
    BUILD_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    export BUILD_TIMESTAMP
    
    # Set version info
    PACKAGE_VERSION=$(node -p "require('$PROJECT_ROOT/package.json').version")
    export PACKAGE_VERSION
    
    info "Build timestamp: $BUILD_TIMESTAMP"
    info "Package version: $PACKAGE_VERSION"
    info "Build type: $BUILD_TYPE"
    info "Flavor: ${FLAVOR:-default}"
    info "Output directory: $OUTPUT_DIR"
}

install_dependencies() {
    log "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    if command -v yarn &> /dev/null; then
        yarn install --frozen-lockfile
    else
        npm ci
    fi
    
    log "Dependencies installed"
}

run_prebuild_checks() {
    log "Running prebuild checks..."
    
    # Type checking
    if [[ -f "$PROJECT_ROOT/tsconfig.json" ]]; then
        log "Running TypeScript type checking..."
        if command -v yarn &> /dev/null; then
            yarn type-check
        else
            npm run type-check
        fi
    fi
    
    # Linting
    log "Running ESLint..."
    if command -v yarn &> /dev/null; then
        yarn lint
    else
        npm run lint
    fi
    
    # Unit tests
    log "Running unit tests..."
    if command -v yarn &> /dev/null; then
        yarn test --watchAll=false --coverage=false
    else
        npm test -- --watchAll=false --coverage=false
    fi
    
    log "Prebuild checks completed"
}

prepare_android_build() {
    log "Preparing Android build..."
    
    cd "$ANDROID_DIR"
    
    # Clean previous builds
    log "Cleaning previous builds..."
    ./gradlew clean
    
    # Generate Metro bundle
    log "Generating Metro bundle..."
    cd "$PROJECT_ROOT"
    if command -v yarn &> /dev/null; then
        yarn react-native bundle \
            --platform android \
            --dev false \
            --entry-file index.js \
            --bundle-output android/app/src/main/assets/index.android.bundle \
            --assets-dest android/app/src/main/res/ \
            --reset-cache
    else
        npx react-native bundle \
            --platform android \
            --dev false \
            --entry-file index.js \
            --bundle-output android/app/src/main/assets/index.android.bundle \
            --assets-dest android/app/src/main/res/ \
            --reset-cache
    fi
    
    log "Android build preparation completed"
}

build_android_app() {
    log "Building Android app..."
    
    cd "$ANDROID_DIR"
    
    # Determine build command based on flavor and build type
    if [[ -n "$FLAVOR" ]]; then
        GRADLE_TASK="assemble${FLAVOR^}${BUILD_TYPE^}"
        BUNDLE_TASK="bundle${FLAVOR^}${BUILD_TYPE^}"
    else
        GRADLE_TASK="assemble${BUILD_TYPE^}"
        BUNDLE_TASK="bundle${BUILD_TYPE^}"
    fi
    
    # Build APK for testing
    log "Building APK with task: $GRADLE_TASK"
    ./gradlew "$GRADLE_TASK" \
        -x test \
        -x lint \
        --no-daemon \
        --max-workers=4 \
        --parallel
    
    # Build AAB for Play Store (only for release builds)
    if [[ "$BUILD_TYPE" == "release" ]]; then
        log "Building AAB with task: $BUNDLE_TASK"
        ./gradlew "$BUNDLE_TASK" \
            -x test \
            -x lint \
            --no-daemon \
            --max-workers=4 \
            --parallel
    fi
    
    log "Android app build completed"
}

copy_build_artifacts() {
    log "Copying build artifacts..."
    
    # Create timestamped subdirectory
    ARTIFACT_DIR="$OUTPUT_DIR/$BUILD_TIMESTAMP"
    mkdir -p "$ARTIFACT_DIR"
    
    # Find and copy APK files
    find "$ANDROID_DIR/app/build/outputs/apk" -name "*.apk" -type f | while read -r apk_file; do
        apk_name=$(basename "$apk_file")
        apk_name_with_timestamp="${apk_name%.apk}-${BUILD_TIMESTAMP}.apk"
        cp "$apk_file" "$ARTIFACT_DIR/$apk_name_with_timestamp"
        log "Copied APK: $apk_name_with_timestamp"
    done
    
    # Find and copy AAB files (App Bundles)
    if [[ "$BUILD_TYPE" == "release" ]]; then
        find "$ANDROID_DIR/app/build/outputs/bundle" -name "*.aab" -type f | while read -r aab_file; do
            aab_name=$(basename "$aab_file")
            aab_name_with_timestamp="${aab_name%.aab}-${BUILD_TIMESTAMP}.aab"
            cp "$aab_file" "$ARTIFACT_DIR/$aab_name_with_timestamp"
            log "Copied AAB: $aab_name_with_timestamp"
        done
    fi
    
    # Copy mapping files (for crash reporting)
    if [[ "$BUILD_TYPE" == "release" ]]; then
        find "$ANDROID_DIR/app/build/outputs/mapping" -name "mapping.txt" -type f | while read -r mapping_file; do
            flavor_dir=$(dirname "$mapping_file")
            flavor_name=$(basename "$flavor_dir")
            mapping_name="mapping-${flavor_name}-${BUILD_TIMESTAMP}.txt"
            cp "$mapping_file" "$ARTIFACT_DIR/$mapping_name"
            log "Copied mapping file: $mapping_name"
        done
    fi
    
    # Create build info file
    cat > "$ARTIFACT_DIR/build-info.json" << EOF
{
    "buildTimestamp": "$BUILD_TIMESTAMP",
    "packageVersion": "$PACKAGE_VERSION",
    "buildType": "$BUILD_TYPE",
    "flavor": "${FLAVOR:-default}",
    "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
    "nodeVersion": "$(node --version)",
    "platform": "android"
}
EOF
    
    log "Build artifacts copied to: $ARTIFACT_DIR"
}

generate_build_report() {
    log "Generating build report..."
    
    REPORT_FILE="$ARTIFACT_DIR/build-report.md"
    
    cat > "$REPORT_FILE" << EOF
# TailTracker Android Build Report

## Build Information
- **Build Timestamp:** $BUILD_TIMESTAMP
- **Package Version:** $PACKAGE_VERSION
- **Build Type:** $BUILD_TYPE
- **Flavor:** ${FLAVOR:-default}
- **Git Commit:** $(git rev-parse HEAD 2>/dev/null || echo 'unknown')
- **Git Branch:** $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')

## Build Artifacts

### APK Files
EOF
    
    # List APK files
    find "$ARTIFACT_DIR" -name "*.apk" -type f | while read -r apk_file; do
        apk_name=$(basename "$apk_file")
        apk_size=$(du -h "$apk_file" | cut -f1)
        echo "- $apk_name ($apk_size)" >> "$REPORT_FILE"
    done
    
    if [[ "$BUILD_TYPE" == "release" ]]; then
        echo -e "\n### AAB Files" >> "$REPORT_FILE"
        # List AAB files
        find "$ARTIFACT_DIR" -name "*.aab" -type f | while read -r aab_file; do
            aab_name=$(basename "$aab_file")
            aab_size=$(du -h "$aab_file" | cut -f1)
            echo "- $aab_name ($aab_size)" >> "$REPORT_FILE"
        done
        
        echo -e "\n### ProGuard Mapping Files" >> "$REPORT_FILE"
        # List mapping files
        find "$ARTIFACT_DIR" -name "mapping-*.txt" -type f | while read -r mapping_file; do
            mapping_name=$(basename "$mapping_file")
            echo "- $mapping_name" >> "$REPORT_FILE"
        done
    fi
    
    cat >> "$REPORT_FILE" << EOF

## Build Environment
- **Node.js Version:** $(node --version)
- **Java Version:** $(java -version 2>&1 | head -n 1)
- **Gradle Version:** $(cd "$ANDROID_DIR" && ./gradlew --version | grep "Gradle" | head -n 1)
- **Android SDK:** ${ANDROID_HOME:-${ANDROID_SDK_ROOT:-'Not set'}}

## Next Steps
1. Test the APK on physical devices
2. Upload AAB to Google Play Console (for release builds)
3. Update crash reporting service with mapping files
4. Create release notes
EOF
    
    log "Build report generated: $REPORT_FILE"
}

cleanup() {
    log "Cleaning up temporary files..."
    
    # Clean up temporary React Native files
    if [[ -f "$ANDROID_DIR/app/src/main/assets/index.android.bundle" ]]; then
        rm -f "$ANDROID_DIR/app/src/main/assets/index.android.bundle"
    fi
    
    # Clean up generated resources
    if [[ -d "$ANDROID_DIR/app/src/main/res/drawable-" ]]; then
        rm -rf "$ANDROID_DIR/app/src/main/res/drawable-"*
    fi
    if [[ -d "$ANDROID_DIR/app/src/main/res/raw" ]]; then
        rm -rf "$ANDROID_DIR/app/src/main/res/raw"
    fi
    
    log "Cleanup completed"
}

main() {
    log "Starting TailTracker Android build process..."
    
    # Record start time
    START_TIME=$(date +%s)
    
    # Run build steps
    check_prerequisites
    setup_environment
    install_dependencies
    run_prebuild_checks
    prepare_android_build
    build_android_app
    copy_build_artifacts
    generate_build_report
    cleanup
    
    # Calculate build time
    END_TIME=$(date +%s)
    BUILD_DURATION=$((END_TIME - START_TIME))
    BUILD_MINUTES=$((BUILD_DURATION / 60))
    BUILD_SECONDS=$((BUILD_DURATION % 60))
    
    log "Build completed successfully!"
    log "Build time: ${BUILD_MINUTES}m ${BUILD_SECONDS}s"
    log "Artifacts available at: $ARTIFACT_DIR"
    
    # Display next steps
    echo ""
    echo -e "${GREEN}🎉 Build completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Test the APK on physical devices"
    if [[ "$BUILD_TYPE" == "release" ]]; then
        echo "2. Upload AAB to Google Play Console"
        echo "3. Update crash reporting with mapping files"
    fi
    echo "4. Create release notes"
    echo ""
    echo -e "${BLUE}Artifacts location:${NC} $ARTIFACT_DIR"
}

# Error handling
trap 'error "Build failed! Check the logs above for details."; exit 1' ERR

# Run main function
main "$@"