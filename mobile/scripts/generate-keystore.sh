#!/bin/bash

# TailTracker Android Keystore Generation Script
# This script generates keystores for development and production signing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYSTORE_DIR="$PROJECT_ROOT/android/keystores"
KEYSTORE_TYPE=""
OUTPUT_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --type)
      KEYSTORE_TYPE="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 --type TYPE [--output FILE]"
      echo ""
      echo "Types:"
      echo "  debug      Generate debug keystore for development"
      echo "  upload     Generate upload keystore for Google Play signing"
      echo "  release    Generate release keystore for manual signing"
      echo ""
      echo "Options:"
      echo "  --output FILE    Output file name (optional)"
      echo "  --help          Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 --type debug"
      echo "  $0 --type upload --output my-upload-key.keystore"
      echo "  $0 --type release"
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
    
    # Check for keytool
    if ! command -v keytool &> /dev/null; then
        error "keytool not found. Please install Java JDK."
        exit 1
    fi
    
    # Check keystore type
    if [[ -z "$KEYSTORE_TYPE" ]]; then
        error "Keystore type not specified. Use --type [debug|upload|release]"
        exit 1
    fi
    
    if [[ "$KEYSTORE_TYPE" != "debug" && "$KEYSTORE_TYPE" != "upload" && "$KEYSTORE_TYPE" != "release" ]]; then
        error "Invalid keystore type: $KEYSTORE_TYPE. Use debug, upload, or release."
        exit 1
    fi
    
    log "Prerequisites check completed"
}

setup_directories() {
    log "Setting up directories..."
    
    # Create keystore directory
    mkdir -p "$KEYSTORE_DIR"
    
    # Set appropriate permissions
    chmod 700 "$KEYSTORE_DIR"
    
    log "Directories setup completed"
}

get_keystore_info() {
    case $KEYSTORE_TYPE in
        debug)
            KEYSTORE_NAME="${OUTPUT_FILE:-debug.keystore}"
            KEY_ALIAS="androiddebugkey"
            VALIDITY_DAYS="30000"  # ~82 years
            USE_DEFAULTS=true
            ;;
        upload)
            KEYSTORE_NAME="${OUTPUT_FILE:-tailtracker-upload-key.keystore}"
            KEY_ALIAS="upload"
            VALIDITY_DAYS="30000"  # ~82 years
            USE_DEFAULTS=false
            ;;
        release)
            KEYSTORE_NAME="${OUTPUT_FILE:-tailtracker-release-key.keystore}"
            KEY_ALIAS="release"
            VALIDITY_DAYS="30000"  # ~82 years
            USE_DEFAULTS=false
            ;;
    esac
    
    KEYSTORE_PATH="$KEYSTORE_DIR/$KEYSTORE_NAME"
}

collect_certificate_info() {
    if [[ "$USE_DEFAULTS" == "true" ]]; then
        # Use default debug certificate information
        DNAME="CN=Android Debug,O=Android,C=US"
        KEYSTORE_PASSWORD="android"
        KEY_PASSWORD="android"
        return
    fi
    
    log "Collecting certificate information..."
    echo ""
    echo -e "${BLUE}Please provide the following information for the certificate:${NC}"
    echo ""
    
    # Collect certificate details
    read -p "First and Last Name [TailTracker]: " CN
    CN=${CN:-"TailTracker"}
    
    read -p "Organizational Unit [Mobile Development]: " OU  
    OU=${OU:-"Mobile Development"}
    
    read -p "Organization [TailTracker LLC]: " O
    O=${O:-"TailTracker LLC"}
    
    read -p "City or Locality [San Francisco]: " L
    L=${L:-"San Francisco"}
    
    read -p "State or Province [California]: " ST
    ST=${ST:-"California"}
    
    read -p "Country Code (2 letter) [US]: " C
    C=${C:-"US"}
    
    # Build distinguished name
    DNAME="CN=$CN,OU=$OU,O=$O,L=$L,ST=$ST,C=$C"
    
    echo ""
    echo -e "${BLUE}Password Configuration:${NC}"
    echo ""
    
    # Get keystore password
    while true; do
        read -s -p "Keystore Password (min 6 characters): " KEYSTORE_PASSWORD
        echo ""
        read -s -p "Confirm Keystore Password: " KEYSTORE_PASSWORD_CONFIRM
        echo ""
        
        if [[ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]]; then
            echo -e "${RED}Passwords do not match. Please try again.${NC}"
            continue
        fi
        
        if [[ ${#KEYSTORE_PASSWORD} -lt 6 ]]; then
            echo -e "${RED}Password must be at least 6 characters. Please try again.${NC}"
            continue
        fi
        
        break
    done
    
    # Get key password (can be same as keystore password)
    echo ""
    read -p "Use same password for key? [Y/n]: " SAME_PASSWORD
    SAME_PASSWORD=${SAME_PASSWORD:-"Y"}
    
    if [[ "$SAME_PASSWORD" =~ ^[Yy]$ ]]; then
        KEY_PASSWORD="$KEYSTORE_PASSWORD"
    else
        while true; do
            read -s -p "Key Password (min 6 characters): " KEY_PASSWORD
            echo ""
            read -s -p "Confirm Key Password: " KEY_PASSWORD_CONFIRM
            echo ""
            
            if [[ "$KEY_PASSWORD" != "$KEY_PASSWORD_CONFIRM" ]]; then
                echo -e "${RED}Passwords do not match. Please try again.${NC}"
                continue
            fi
            
            if [[ ${#KEY_PASSWORD} -lt 6 ]]; then
                echo -e "${RED}Password must be at least 6 characters. Please try again.${NC}"
                continue
            fi
            
            break
        done
    fi
}

generate_keystore() {
    log "Generating keystore: $KEYSTORE_NAME"
    
    # Check if keystore already exists
    if [[ -f "$KEYSTORE_PATH" ]]; then
        echo ""
        read -p "Keystore already exists. Overwrite? [y/N]: " OVERWRITE
        OVERWRITE=${OVERWRITE:-"N"}
        
        if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
            warning "Keystore generation cancelled"
            exit 0
        fi
        
        rm -f "$KEYSTORE_PATH"
    fi
    
    # Generate keystore
    keytool -genkeypair \
        -keystore "$KEYSTORE_PATH" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity "$VALIDITY_DAYS" \
        -dname "$DNAME" \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -storetype PKCS12
    
    # Set appropriate permissions
    chmod 600 "$KEYSTORE_PATH"
    
    log "Keystore generated successfully: $KEYSTORE_PATH"
}

verify_keystore() {
    log "Verifying keystore..."
    
    echo ""
    echo -e "${BLUE}Keystore Information:${NC}"
    keytool -list -v -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASSWORD" | head -20
    
    log "Keystore verification completed"
}

generate_config_info() {
    log "Generating configuration information..."
    
    CONFIG_FILE="$KEYSTORE_DIR/${KEYSTORE_TYPE}-keystore-config.txt"
    
    cat > "$CONFIG_FILE" << EOF
# TailTracker Android Keystore Configuration
# Generated on: $(date)
# Type: $KEYSTORE_TYPE

# Add these properties to your android/gradle.properties file:
MYAPP_${KEYSTORE_TYPE^^}_STORE_FILE=$KEYSTORE_NAME
MYAPP_${KEYSTORE_TYPE^^}_KEY_ALIAS=$KEY_ALIAS
MYAPP_${KEYSTORE_TYPE^^}_STORE_PASSWORD=$KEYSTORE_PASSWORD
MYAPP_${KEYSTORE_TYPE^^}_KEY_PASSWORD=$KEY_PASSWORD

# Or add to android/local.properties (more secure):
# MYAPP_${KEYSTORE_TYPE^^}_STORE_FILE=keystores/$KEYSTORE_NAME
# MYAPP_${KEYSTORE_TYPE^^}_KEY_ALIAS=$KEY_ALIAS
# MYAPP_${KEYSTORE_TYPE^^}_STORE_PASSWORD=$KEYSTORE_PASSWORD
# MYAPP_${KEYSTORE_TYPE^^}_KEY_PASSWORD=$KEY_PASSWORD

# Certificate Information:
# Distinguished Name: $DNAME
# Validity: $VALIDITY_DAYS days
# Key Algorithm: RSA 2048-bit
# Store Type: PKCS12

# Security Notes:
# - Keep this file secure and do not commit to version control
# - Store passwords in environment variables for CI/CD
# - Backup the keystore file safely
# - For production: use Google Play App Signing
EOF
    
    # Set appropriate permissions
    chmod 600 "$CONFIG_FILE"
    
    log "Configuration saved to: $CONFIG_FILE"
}

show_next_steps() {
    echo ""
    echo -e "${GREEN}🎉 Keystore generation completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Generated Files:${NC}"
    echo "- Keystore: $KEYSTORE_PATH"
    echo "- Config: $KEYSTORE_DIR/${KEYSTORE_TYPE}-keystore-config.txt"
    echo ""
    
    case $KEYSTORE_TYPE in
        debug)
            echo -e "${BLUE}Next Steps:${NC}"
            echo "1. The debug keystore is ready for development builds"
            echo "2. No additional configuration required"
            ;;
        upload)
            echo -e "${BLUE}Next Steps:${NC}"
            echo "1. Add keystore properties to android/local.properties"
            echo "2. Configure Google Play App Signing in Play Console"
            echo "3. Upload your upload certificate to Play Console"
            echo "4. Build and upload your first release"
            echo ""
            echo -e "${YELLOW}Important:${NC} Use this keystore for uploading to Google Play."
            echo "Google Play will re-sign with their own key for distribution."
            ;;
        release)
            echo -e "${BLUE}Next Steps:${NC}"
            echo "1. Add keystore properties to android/local.properties"
            echo "2. Configure signing in android/app/build.gradle"
            echo "3. Build signed release APK/AAB"
            echo "4. Backup the keystore file securely"
            echo ""
            echo -e "${RED}Critical:${NC} Keep this keystore safe! You cannot recover it if lost."
            echo "Without it, you cannot update your app on Google Play."
            ;;
    esac
    
    echo ""
    echo -e "${YELLOW}Security Reminders:${NC}"
    echo "- Never commit keystores to version control"
    echo "- Store passwords securely (use environment variables)"
    echo "- Backup keystores in multiple secure locations"
    echo "- Use Google Play App Signing for production apps"
}

main() {
    log "Starting TailTracker keystore generation..."
    
    check_prerequisites
    setup_directories
    get_keystore_info
    collect_certificate_info
    generate_keystore
    verify_keystore
    generate_config_info
    show_next_steps
}

# Error handling
trap 'error "Keystore generation failed! Check the logs above for details."; exit 1' ERR

# Run main function
main "$@"