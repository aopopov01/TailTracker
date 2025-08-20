#!/bin/bash

# TailTracker iOS Deployment Script
# This script handles iOS app deployment to various destinations

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
DEPLOYMENT_TARGET="testflight"
IPA_PATH=""
API_KEY_PATH=""
API_KEY_ID=""
API_ISSUER_ID=""
APP_ID=""
SKIP_VALIDATION=false
VERBOSE=false

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

iOS Deployment Script for TailTracker

OPTIONS:
    -t, --target TARGET     Deployment target: testflight, appstore, adhoc (default: testflight)
    -i, --ipa PATH          Path to IPA file
    -k, --api-key PATH      Path to App Store Connect API key (.p8 file)
    --api-key-id ID         App Store Connect API Key ID
    --api-issuer-id ID      App Store Connect API Issuer ID
    --app-id ID             App Store Connect App ID
    --skip-validation       Skip app validation before upload
    -v, --verbose           Verbose output
    -h, --help              Show this help message

EXAMPLES:
    $0                                              # Deploy to TestFlight with default settings
    $0 -t appstore                                  # Deploy to App Store
    $0 -i ./TailTracker.ipa -t testflight          # Deploy specific IPA to TestFlight
    $0 --api-key ./AuthKey.p8 --api-key-id ABC123  # Use custom API key

DEPLOYMENT TARGETS:
    testflight     - Upload to TestFlight for beta testing
    appstore       - Upload to App Store for review
    adhoc          - Export for ad-hoc distribution

PREREQUISITES:
    - Xcode Command Line Tools installed
    - App Store Connect API key configured
    - Valid signing certificates and provisioning profiles
    - Built IPA file (run build-ios.sh first)

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--target)
            DEPLOYMENT_TARGET="$2"
            shift 2
            ;;
        -i|--ipa)
            IPA_PATH="$2"
            shift 2
            ;;
        -k|--api-key)
            API_KEY_PATH="$2"
            shift 2
            ;;
        --api-key-id)
            API_KEY_ID="$2"
            shift 2
            ;;
        --api-issuer-id)
            API_ISSUER_ID="$2"
            shift 2
            ;;
        --app-id)
            APP_ID="$2"
            shift 2
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
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

# Validate deployment target
case $DEPLOYMENT_TARGET in
    testflight|appstore|adhoc)
        ;;
    *)
        print_error "Invalid deployment target: $DEPLOYMENT_TARGET"
        show_usage
        exit 1
        ;;
esac

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "iOS deployment can only be performed on macOS"
    exit 1
fi

print_status "Starting iOS deployment process..."
print_status "Deployment target: $DEPLOYMENT_TARGET"

# Try to find IPA file if not provided
if [[ -z "$IPA_PATH" ]]; then
    print_status "Searching for IPA file..."
    
    # Look in common build locations
    SEARCH_PATHS=(
        "$PROJECT_ROOT/ios/build/Export"
        "$PROJECT_ROOT/ios/build/Archives"
        "$PROJECT_ROOT/build"
        "$PROJECT_ROOT"
    )
    
    for search_path in "${SEARCH_PATHS[@]}"; do
        if [[ -d "$search_path" ]]; then
            found_ipa=$(find "$search_path" -name "*.ipa" -type f | head -1)
            if [[ -n "$found_ipa" ]]; then
                IPA_PATH="$found_ipa"
                print_status "Found IPA: $IPA_PATH"
                break
            fi
        fi
    done
    
    if [[ -z "$IPA_PATH" ]]; then
        print_error "No IPA file found. Please build the app first or specify IPA path with -i"
        print_status "Run: ./scripts/build-ios.sh -t production"
        exit 1
    fi
fi

# Validate IPA file exists
if [[ ! -f "$IPA_PATH" ]]; then
    print_error "IPA file not found: $IPA_PATH"
    exit 1
fi

# Get IPA file info
IPA_SIZE=$(du -h "$IPA_PATH" | cut -f1)
print_status "IPA file: $IPA_PATH"
print_status "IPA size: $IPA_SIZE"

# Set default API key paths if not provided
if [[ -z "$API_KEY_PATH" ]]; then
    # Look for API key in common locations
    API_KEY_PATHS=(
        "$IOS_DIR/AuthKey.p8"
        "$PROJECT_ROOT/ios/AuthKey.p8"
        "$PROJECT_ROOT/AuthKey.p8"
    )
    
    for key_path in "${API_KEY_PATHS[@]}"; do
        if [[ -f "$key_path" ]]; then
            API_KEY_PATH="$key_path"
            break
        fi
    done
fi

# Load configuration from .env or config file if available
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    print_status "Loading configuration from .env..."
    source "$PROJECT_ROOT/.env"
    
    # Use environment variables if not provided via command line
    [[ -z "$API_KEY_ID" && -n "$ASC_API_KEY_ID" ]] && API_KEY_ID="$ASC_API_KEY_ID"
    [[ -z "$API_ISSUER_ID" && -n "$ASC_API_ISSUER_ID" ]] && API_ISSUER_ID="$ASC_API_ISSUER_ID"
    [[ -z "$APP_ID" && -n "$ASC_APP_ID" ]] && APP_ID="$ASC_APP_ID"
fi

# Validate required parameters for App Store Connect upload
if [[ $DEPLOYMENT_TARGET != "adhoc" ]]; then
    if [[ -z "$API_KEY_PATH" || ! -f "$API_KEY_PATH" ]]; then
        print_error "App Store Connect API key not found"
        print_status "Please provide API key with -k option or place AuthKey.p8 in ios/ directory"
        exit 1
    fi
    
    if [[ -z "$API_KEY_ID" ]]; then
        print_error "App Store Connect API Key ID is required"
        print_status "Set ASC_API_KEY_ID in .env or use --api-key-id option"
        exit 1
    fi
    
    if [[ -z "$API_ISSUER_ID" ]]; then
        print_error "App Store Connect API Issuer ID is required"
        print_status "Set ASC_API_ISSUER_ID in .env or use --api-issuer-id option"
        exit 1
    fi
fi

print_status "Configuration:"
print_status "  API Key: $API_KEY_PATH"
print_status "  Key ID: $API_KEY_ID"
print_status "  Issuer ID: $API_ISSUER_ID"
[[ -n "$APP_ID" ]] && print_status "  App ID: $APP_ID"

# Validate IPA before upload (unless skipped)
if [[ $SKIP_VALIDATION != true && $DEPLOYMENT_TARGET != "adhoc" ]]; then
    print_status "Validating IPA..."
    
    # Check if xcrun altool is available (deprecated but still works)
    if command -v xcrun &> /dev/null && xcrun altool --help &> /dev/null; then
        VALIDATION_ARGS=(
            --validate-app
            --type ios
            --file "$IPA_PATH"
            --apiKey "$API_KEY_ID"
            --apiIssuer "$API_ISSUER_ID"
        )
        
        if [[ $VERBOSE == true ]]; then
            VALIDATION_ARGS+=(--verbose)
        fi
        
        if xcrun altool "${VALIDATION_ARGS[@]}"; then
            print_success "IPA validation passed"
        else
            print_error "IPA validation failed"
            print_status "Fix validation errors or use --skip-validation to bypass"
            exit 1
        fi
    else
        print_warning "altool not available, skipping validation"
    fi
fi

# Deploy based on target
case $DEPLOYMENT_TARGET in
    testflight)
        print_status "Uploading to TestFlight..."
        
        # Use xcrun altool for upload
        if command -v xcrun &> /dev/null && xcrun altool --help &> /dev/null; then
            UPLOAD_ARGS=(
                --upload-app
                --type ios
                --file "$IPA_PATH"
                --apiKey "$API_KEY_ID"
                --apiIssuer "$API_ISSUER_ID"
            )
            
            if [[ $VERBOSE == true ]]; then
                UPLOAD_ARGS+=(--verbose)
            fi
            
            if xcrun altool "${UPLOAD_ARGS[@]}"; then
                print_success "Upload to TestFlight completed successfully"
                print_status "Next steps:"
                print_status "  1. Go to App Store Connect"
                print_status "  2. Wait for processing to complete"
                print_status "  3. Add release notes and distribute to testers"
                print_status "  4. Monitor crash reports and feedback"
            else
                print_error "Upload to TestFlight failed"
                exit 1
            fi
        else
            print_error "xcrun altool not available"
            print_status "Install Xcode Command Line Tools: xcode-select --install"
            exit 1
        fi
        ;;
        
    appstore)
        print_status "Uploading to App Store..."
        
        if command -v xcrun &> /dev/null && xcrun altool --help &> /dev/null; then
            UPLOAD_ARGS=(
                --upload-app
                --type ios
                --file "$IPA_PATH"
                --apiKey "$API_KEY_ID"
                --apiIssuer "$API_ISSUER_ID"
            )
            
            if [[ $VERBOSE == true ]]; then
                UPLOAD_ARGS+=(--verbose)
            fi
            
            if xcrun altool "${UPLOAD_ARGS[@]}"; then
                print_success "Upload to App Store completed successfully"
                print_status "Next steps:"
                print_status "  1. Go to App Store Connect"
                print_status "  2. Wait for processing to complete"
                print_status "  3. Fill in app metadata and screenshots"
                print_status "  4. Submit for review"
                print_status "  5. Monitor review status"
            else
                print_error "Upload to App Store failed"
                exit 1
            fi
        else
            print_error "xcrun altool not available"
            exit 1
        fi
        ;;
        
    adhoc)
        print_status "Preparing ad-hoc distribution..."
        
        # For ad-hoc, we just need to ensure the IPA is properly signed
        # and provide instructions for distribution
        
        ADHOC_DIR="$PROJECT_ROOT/ios/build/AdHoc"
        mkdir -p "$ADHOC_DIR"
        
        # Copy IPA to ad-hoc directory
        ADHOC_IPA="$ADHOC_DIR/TailTracker-AdHoc-$(date +%Y%m%d-%H%M%S).ipa"
        cp "$IPA_PATH" "$ADHOC_IPA"
        
        print_success "Ad-hoc IPA prepared: $ADHOC_IPA"
        
        # Create distribution manifest for over-the-air installation
        MANIFEST_FILE="$ADHOC_DIR/manifest.plist"
        cat > "$MANIFEST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>REPLACE_WITH_YOUR_SERVER_URL/TailTracker.ipa</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>com.tailtracker.app</string>
                <key>bundle-version</key>
                <string>1.0</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>TailTracker</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>
EOF

        print_status "Next steps for ad-hoc distribution:"
        print_status "  1. Upload the IPA to your server"
        print_status "  2. Update the manifest.plist with your server URL"
        print_status "  3. Upload the manifest.plist to your server"
        print_status "  4. Share the installation URL: itms-services://?action=download-manifest&url=YOUR_MANIFEST_URL"
        print_status "  5. Users can install via Safari on iOS devices"
        print_status ""
        print_status "Files created:"
        print_status "  IPA: $ADHOC_IPA"
        print_status "  Manifest: $MANIFEST_FILE"
        ;;
esac

# Show deployment summary
print_status "Deployment Summary:"
print_status "  Target: $DEPLOYMENT_TARGET"
print_status "  IPA: $IPA_PATH"
print_status "  Size: $IPA_SIZE"

case $DEPLOYMENT_TARGET in
    testflight|appstore)
        print_status "  API Key ID: $API_KEY_ID"
        print_status "  Status: Upload completed"
        ;;
    adhoc)
        print_status "  Ad-hoc package: $ADHOC_IPA"
        print_status "  Status: Ready for distribution"
        ;;
esac

print_success "iOS deployment process completed successfully!"

# Additional tips
print_status "Tips:"
case $DEPLOYMENT_TARGET in
    testflight)
        print_status "  • TestFlight builds expire after 90 days"
        print_status "  • You can have up to 25 active TestFlight builds"
        print_status "  • External testers need explicit approval"
        print_status "  • Monitor build processing in App Store Connect"
        ;;
    appstore)
        print_status "  • App review typically takes 24-48 hours"
        print_status "  • Ensure all metadata and screenshots are complete"
        print_status "  • Test the build thoroughly before submission"
        print_status "  • Monitor review status in App Store Connect"
        ;;
    adhoc)
        print_status "  • Ad-hoc builds work only on registered devices"
        print_status "  • Ensure HTTPS for over-the-air installation"
        print_status "  • Test the installation process before distributing"
        print_status "  • Consider using enterprise distribution for larger teams"
        ;;
esac