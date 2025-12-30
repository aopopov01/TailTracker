#!/bin/bash

# TailTracker Production Keystore Generation Script
# This script generates the production keystore for TailTracker Android app

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYSTORE_FILE="$PROJECT_ROOT/android/app/tailtracker-release.keystore"
KEYSTORE_ALIAS="tailtracker-release"
KEYSTORE_PASSWORD="qqyQ9Q5qw7pgpjdj9QWZkYeH+hbc4E4Grct10CIu1EI="
KEY_PASSWORD="3M+IcmVFLXf3qYZZUj6VR9dLnHlNJ/B/M/cBVFlzUxQ="
CERTIFICATE_DN="CN=TailTracker,OU=Mobile Development,O=TailTracker LLC,L=San Francisco,ST=California,C=US"

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
        error "keytool not found. Please install Java JDK:"
        echo "  Ubuntu/Debian: sudo apt install default-jdk"
        echo "  macOS: brew install openjdk"
        echo "  Windows: Download from Oracle or OpenJDK website"
        exit 1
    fi
    
    # Check Java version
    local java_version=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    info "Java version: $java_version"
    
    log "Prerequisites check completed"
}

setup_directories() {
    log "Setting up directories..."
    
    # Create android/app directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/android/app"
    
    # Set secure permissions
    chmod 700 "$PROJECT_ROOT/android/app"
    
    log "Directories setup completed"
}

backup_existing_keystore() {
    if [[ -f "$KEYSTORE_FILE" ]]; then
        warning "Existing keystore found at: $KEYSTORE_FILE"
        echo ""
        read -p "Do you want to backup the existing keystore? [Y/n]: " BACKUP_EXISTING
        BACKUP_EXISTING=${BACKUP_EXISTING:-"Y"}
        
        if [[ "$BACKUP_EXISTING" =~ ^[Yy]$ ]]; then
            local backup_file="${KEYSTORE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$KEYSTORE_FILE" "$backup_file"
            log "Existing keystore backed up to: $backup_file"
        fi
        
        echo ""
        read -p "Do you want to overwrite the existing keystore? [y/N]: " OVERWRITE
        OVERWRITE=${OVERWRITE:-"N"}
        
        if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
            warning "Keystore generation cancelled by user"
            exit 0
        fi
        
        rm -f "$KEYSTORE_FILE"
    fi
}

generate_keystore() {
    log "Generating production keystore..."
    
    info "Keystore details:"
    echo "  File: $KEYSTORE_FILE"
    echo "  Alias: $KEYSTORE_ALIAS" 
    echo "  Algorithm: RSA 2048-bit"
    echo "  Validity: 30000 days (~82 years)"
    echo "  Certificate DN: $CERTIFICATE_DN"
    echo ""
    
    # Generate the keystore
    keytool -genkeypair \
        -keystore "$KEYSTORE_FILE" \
        -alias "$KEYSTORE_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 30000 \
        -dname "$CERTIFICATE_DN" \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -storetype PKCS12
    
    # Set secure file permissions
    chmod 600 "$KEYSTORE_FILE"
    
    log "Keystore generated successfully"
}

verify_keystore() {
    log "Verifying keystore..."
    
    echo ""
    echo -e "${BLUE}Keystore Information:${NC}"
    keytool -list -v -keystore "$KEYSTORE_FILE" -storepass "$KEYSTORE_PASSWORD" | head -30
    
    echo ""
    info "File permissions:"
    ls -la "$KEYSTORE_FILE"
    
    log "Keystore verification completed"
}

create_properties_file() {
    log "Creating keystore.properties file..."
    
    local properties_file="$PROJECT_ROOT/keystore.properties"
    
    if [[ -f "$properties_file" ]]; then
        warning "keystore.properties already exists"
        echo ""
        read -p "Do you want to overwrite it? [y/N]: " OVERWRITE_PROPS
        OVERWRITE_PROPS=${OVERWRITE_PROPS:-"N"}
        
        if [[ ! "$OVERWRITE_PROPS" =~ ^[Yy]$ ]]; then
            info "Skipping keystore.properties creation"
            return
        fi
    fi
    
    cat > "$properties_file" << EOF
# TailTracker Production Keystore Configuration
# This file contains sensitive information - DO NOT commit to version control
# Generated on: $(date)

# Production Keystore Configuration
MYAPP_UPLOAD_STORE_FILE=tailtracker-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=$KEYSTORE_ALIAS
MYAPP_UPLOAD_STORE_PASSWORD=$KEYSTORE_PASSWORD
MYAPP_UPLOAD_KEY_PASSWORD=$KEY_PASSWORD

# Certificate Information
# Distinguished Name: $CERTIFICATE_DN
# Key Algorithm: RSA 2048-bit
# Validity: 30000 days (~82 years)
# Store Type: PKCS12

# SECURITY NOTES:
# 1. Keep this file secure and never commit to version control
# 2. Store backup copies in secure encrypted locations
# 3. Use environment variables for CI/CD pipelines
# 4. Consider using Google Play App Signing for additional security
EOF
    
    # Set secure permissions
    chmod 600 "$properties_file"
    
    log "keystore.properties created successfully"
}

update_gitignore() {
    log "Checking .gitignore configuration..."
    
    local gitignore_file="$PROJECT_ROOT/.gitignore"
    
    # Check if .gitignore exists and contains keystore entries
    if [[ -f "$gitignore_file" ]] && grep -q "keystore.properties" "$gitignore_file"; then
        info ".gitignore already configured for keystore security"
    else
        warning ".gitignore may not be properly configured for keystore security"
        echo "Please ensure the following entries are in your .gitignore:"
        echo "  *.keystore"
        echo "  *.jks" 
        echo "  keystore.properties"
        echo "  local.properties"
    fi
}

show_next_steps() {
    echo ""
    echo -e "${GREEN}🎉 Production keystore generation completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Generated Files:${NC}"
    echo "- Keystore: $KEYSTORE_FILE"
    echo "- Configuration: $PROJECT_ROOT/keystore.properties"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Test building a signed release:"
    echo "   cd android && ./gradlew assembleRelease"
    echo ""
    echo "2. Backup the keystore securely:"
    echo "   - Copy to encrypted cloud storage"
    echo "   - Store in enterprise password manager"
    echo "   - Create physical backup in secure location"
    echo ""
    echo "3. Set up Google Play App Signing (recommended):"
    echo "   - Upload signed APK to Play Console"
    echo "   - Enroll in Google Play App Signing"
    echo "   - Google will manage distribution signing key"
    echo ""
    echo -e "${RED}🚨 CRITICAL SECURITY REMINDERS:${NC}"
    echo "- NEVER commit keystore files to version control"
    echo "- Store passwords securely (password manager/env variables)"
    echo "- Backup keystore in multiple secure locations"
    echo "- Loss of keystore = inability to update app on Play Store"
    echo ""
    echo -e "${YELLOW}Documentation:${NC}"
    echo "- Read KEYSTORE_GENERATION_GUIDE.md for complete details"
    echo "- Follow KEYSTORE_BACKUP_STRATEGY.md for backup procedures"
}

main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                TailTracker Production Keystore               ║"
    echo "║                     Generation Script                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    setup_directories
    backup_existing_keystore
    generate_keystore
    verify_keystore
    create_properties_file
    update_gitignore
    show_next_steps
}

# Error handling
trap 'error "Keystore generation failed! Check the error messages above."; exit 1' ERR

# Run main function
main "$@"