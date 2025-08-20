#!/bin/bash

# TailTracker iOS Build Script
# This script handles iOS builds with proper environment configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IOS_DIR="$PROJECT_ROOT/ios"

# Default values
BUILD_TYPE="development"
CLEAN_BUILD=false
SKIP_PODS=false
VERBOSE=false
ARCHIVE_PATH=""
EXPORT_PATH=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

iOS Build Script for TailTracker

OPTIONS:
    -t, --type TYPE         Build type: development, preview, production, simulator (default: development)
    -c, --clean             Clean build (removes derived data and pods)
    -s, --skip-pods         Skip pod installation
    -a, --archive PATH      Archive path for production builds
    -e, --export PATH       Export path for IPA files
    -v, --verbose           Verbose output
    -h, --help              Show this help message

EXAMPLES:
    $0                                  # Development build
    $0 -t production -c                 # Clean production build
    $0 -t simulator                     # Simulator build
    $0 -t production -a ~/Archives      # Production build with custom archive path

BUILD TYPES:
    development     - Development build with debug symbols
    preview         - Preview build for internal testing
    production      - Production build for App Store
    simulator       - iOS Simulator build

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        -s|--skip-pods)
            SKIP_PODS=true
            shift
            ;;
        -a|--archive)
            ARCHIVE_PATH="$2"
            shift 2
            ;;
        -e|--export)
            EXPORT_PATH="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate build type
case $BUILD_TYPE in
    development|preview|production|simulator)
        ;;
    *)
        print_error "Invalid build type: $BUILD_TYPE"
        show_usage
        exit 1
        ;;
esac

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "iOS builds can only be performed on macOS"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    print_error "Xcode is not installed or xcodebuild is not in PATH"
    exit 1
fi

# Check if we're in a React Native project
if [[ ! -f "$PROJECT_ROOT/package.json" ]] || ! grep -q "react-native" "$PROJECT_ROOT/package.json"; then
    print_error "This doesn't appear to be a React Native project"
    exit 1
fi

# Check if iOS directory exists
if [[ ! -d "$IOS_DIR" ]]; then
    print_error "iOS directory not found. Run 'expo prebuild' first."
    exit 1
fi

print_status "Starting iOS build process..."
print_status "Build type: $BUILD_TYPE"
print_status "Project root: $PROJECT_ROOT"

# Set build configuration based on type
case $BUILD_TYPE in
    development|simulator)
        CONFIGURATION="Debug"
        ;;
    preview|production)
        CONFIGURATION="Release"
        ;;
esac

# Set SDK based on build type
if [[ $BUILD_TYPE == "simulator" ]]; then
    SDK="iphonesimulator"
    DESTINATION="generic/platform=iOS Simulator"
else
    SDK="iphoneos"
    DESTINATION="generic/platform=iOS"
fi

# Set default paths
if [[ -z "$ARCHIVE_PATH" ]]; then
    ARCHIVE_PATH="$PROJECT_ROOT/ios/build/Archives"
fi

if [[ -z "$EXPORT_PATH" ]]; then
    EXPORT_PATH="$PROJECT_ROOT/ios/build/Export"
fi

# Create necessary directories
mkdir -p "$ARCHIVE_PATH"
mkdir -p "$EXPORT_PATH"

# Clean build if requested
if [[ $CLEAN_BUILD == true ]]; then
    print_status "Cleaning build artifacts..."
    
    # Clean Xcode derived data
    rm -rf ~/Library/Developer/Xcode/DerivedData/TailTracker-*
    
    # Clean iOS build directory
    rm -rf "$IOS_DIR/build"
    
    # Clean CocoaPods
    if [[ -d "$IOS_DIR/Pods" ]]; then
        rm -rf "$IOS_DIR/Pods"
        rm -f "$IOS_DIR/Podfile.lock"
    fi
    
    print_success "Clean completed"
fi

# Install CocoaPods dependencies
if [[ $SKIP_PODS != true ]]; then
    print_status "Installing CocoaPods dependencies..."
    
    cd "$IOS_DIR"
    
    if ! command -v pod &> /dev/null; then
        print_error "CocoaPods is not installed. Install it with: sudo gem install cocoapods"
        exit 1
    fi
    
    # Update pod repo if needed
    if [[ ! -d ~/.cocoapods/repos/trunk ]]; then
        print_status "Setting up CocoaPods repo..."
        pod setup
    fi
    
    # Install pods
    if [[ $VERBOSE == true ]]; then
        pod install --verbose
    else
        pod install
    fi
    
    cd "$PROJECT_ROOT"
    
    print_success "CocoaPods installation completed"
fi

# Set bundle identifier based on build type
BUNDLE_IDENTIFIER="com.tailtracker.app"
case $BUILD_TYPE in
    development)
        BUNDLE_IDENTIFIER="${BUNDLE_IDENTIFIER}.dev"
        ;;
    preview)
        BUNDLE_IDENTIFIER="${BUNDLE_IDENTIFIER}.preview"
        ;;
esac

# Determine workspace and scheme
WORKSPACE="$IOS_DIR/TailTracker.xcworkspace"
SCHEME="TailTracker"

if [[ ! -f "$WORKSPACE" ]]; then
    print_error "Xcode workspace not found: $WORKSPACE"
    exit 1
fi

# Build arguments
BUILD_ARGS=(
    -workspace "$WORKSPACE"
    -scheme "$SCHEME"
    -configuration "$CONFIGURATION"
    -sdk "$SDK"
    -destination "$DESTINATION"
    -derivedDataPath "$IOS_DIR/build"
)

# Add verbose flag if requested
if [[ $VERBOSE == true ]]; then
    BUILD_ARGS+=(-verbose)
fi

print_status "Building iOS app..."
print_status "Configuration: $CONFIGURATION"
print_status "SDK: $SDK"
print_status "Bundle Identifier: $BUNDLE_IDENTIFIER"

if [[ $BUILD_TYPE == "simulator" ]]; then
    # Build for simulator
    print_status "Building for iOS Simulator..."
    
    xcodebuild build "${BUILD_ARGS[@]}"
    
    if [[ $? -eq 0 ]]; then
        print_success "iOS Simulator build completed successfully"
        
        # Find the built app
        APP_PATH=$(find "$IOS_DIR/build/Build/Products/$CONFIGURATION-iphonesimulator" -name "*.app" | head -1)
        if [[ -n "$APP_PATH" ]]; then
            print_success "Built app location: $APP_PATH"
        fi
    else
        print_error "iOS Simulator build failed"
        exit 1
    fi
    
elif [[ $BUILD_TYPE == "production" ]]; then
    # Archive for production
    ARCHIVE_NAME="TailTracker-$(date +%Y%m%d-%H%M%S).xcarchive"
    FULL_ARCHIVE_PATH="$ARCHIVE_PATH/$ARCHIVE_NAME"
    
    print_status "Creating production archive..."
    
    xcodebuild archive \
        "${BUILD_ARGS[@]}" \
        -archivePath "$FULL_ARCHIVE_PATH"
    
    if [[ $? -eq 0 ]]; then
        print_success "Archive created successfully: $FULL_ARCHIVE_PATH"
        
        # Export IPA
        print_status "Exporting IPA..."
        
        # Create export options plist
        EXPORT_OPTIONS_PLIST="$IOS_DIR/ExportOptions.plist"
        cat > "$EXPORT_OPTIONS_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>$BUNDLE_IDENTIFIER</key>
        <string>match AppStore $BUNDLE_IDENTIFIER</string>
    </dict>
</dict>
</plist>
EOF

        IPA_EXPORT_PATH="$EXPORT_PATH/$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$IPA_EXPORT_PATH"
        
        xcodebuild -exportArchive \
            -archivePath "$FULL_ARCHIVE_PATH" \
            -exportPath "$IPA_EXPORT_PATH" \
            -exportOptionsPlist "$EXPORT_OPTIONS_PLIST"
        
        if [[ $? -eq 0 ]]; then
            print_success "IPA exported successfully to: $IPA_EXPORT_PATH"
            
            # Find the exported IPA
            IPA_FILE=$(find "$IPA_EXPORT_PATH" -name "*.ipa" | head -1)
            if [[ -n "$IPA_FILE" ]]; then
                print_success "IPA file: $IPA_FILE"
                
                # Show file size
                IPA_SIZE=$(du -h "$IPA_FILE" | cut -f1)
                print_status "IPA size: $IPA_SIZE"
            fi
        else
            print_error "IPA export failed"
            exit 1
        fi
        
        # Clean up export options plist
        rm -f "$EXPORT_OPTIONS_PLIST"
        
    else
        print_error "Archive creation failed"
        exit 1
    fi
    
else
    # Regular build for development/preview
    print_status "Building iOS app..."
    
    xcodebuild build "${BUILD_ARGS[@]}"
    
    if [[ $? -eq 0 ]]; then
        print_success "iOS build completed successfully"
        
        # Find the built app
        APP_PATH=$(find "$IOS_DIR/build/Build/Products" -name "*.app" | head -1)
        if [[ -n "$APP_PATH" ]]; then
            print_success "Built app location: $APP_PATH"
        fi
    else
        print_error "iOS build failed"
        exit 1
    fi
fi

# Build summary
print_status "Build Summary:"
print_status "  Type: $BUILD_TYPE"
print_status "  Configuration: $CONFIGURATION"
print_status "  SDK: $SDK"
print_status "  Bundle ID: $BUNDLE_IDENTIFIER"

if [[ $BUILD_TYPE == "production" ]]; then
    print_status "  Archive: $FULL_ARCHIVE_PATH"
    print_status "  Export: $IPA_EXPORT_PATH"
fi

print_success "iOS build process completed successfully!"

# Show next steps
case $BUILD_TYPE in
    simulator)
        print_status "Next steps:"
        print_status "  1. Open iOS Simulator"
        print_status "  2. Install the app: xcrun simctl install booted '$APP_PATH'"
        print_status "  3. Launch the app from the simulator"
        ;;
    production)
        print_status "Next steps:"
        print_status "  1. Upload to App Store Connect using Xcode or Transporter"
        print_status "  2. Submit for review in App Store Connect"
        print_status "  3. Monitor build processing status"
        ;;
    *)
        print_status "Next steps:"
        print_status "  1. Test the build on a physical device"
        print_status "  2. Verify all features work correctly"
        print_status "  3. Distribute for internal testing"
        ;;
esac