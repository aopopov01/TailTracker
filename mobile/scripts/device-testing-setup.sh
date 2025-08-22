#!/bin/bash

# TailTracker Device Testing Setup Script
# This script prepares the app for optimal device testing experience

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_IP="192.168.20.112"
DEV_PORT="8081"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TailTracker Device Testing Setup${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
echo -e "\n${BLUE}Checking Prerequisites...${NC}"

# Check if Expo CLI is installed
if ! npx expo --version &> /dev/null; then
    print_error "Expo CLI not found. Install with: npm install -g @expo/cli"
    exit 1
fi
print_status "Expo CLI found ($(npx expo --version))"

# Check if EAS CLI is installed
if ! npx eas --version &> /dev/null; then
    print_warning "EAS CLI not found. Install for development builds: npm install -g eas-cli"
else
    print_status "EAS CLI found ($(npx eas --version))"
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE="18.0.0"
if ! dpkg --compare-versions "$NODE_VERSION" "ge" "$REQUIRED_NODE"; then
    print_error "Node.js version $NODE_VERSION is below required $REQUIRED_NODE"
    exit 1
fi
print_status "Node.js version $NODE_VERSION is compatible"

# Check if npm packages are installed
cd "$PROJECT_ROOT"
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Installing..."
    npm install
fi
print_status "Node modules verified"

# Asset verification
echo -e "\n${BLUE}Verifying Assets...${NC}"

REQUIRED_ASSETS=(
    "assets/images/icon.png"
    "assets/images/adaptive-icon.png"
    "assets/images/splash.png"
    "assets/images/notification-icon.png"
    "assets/sounds/notification.wav"
)

for asset in "${REQUIRED_ASSETS[@]}"; do
    if [ -f "$asset" ]; then
        print_status "Found $asset"
    else
        print_error "Missing required asset: $asset"
        exit 1
    fi
done

# Network configuration check
echo -e "\n${BLUE}Network Configuration...${NC}"

# Check if port 8081 is available
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Port 8081 is already in use. Current dev server may be running."
else
    print_status "Port 8081 is available"
fi

# Display network information
echo -e "\n${BLUE}Network Information:${NC}"
echo "Local IP: $LOCAL_IP"
echo "Dev Server: http://$LOCAL_IP:$DEV_PORT"
echo "QR Code URL: exp://$LOCAL_IP:$DEV_PORT"

# Metro configuration check
echo -e "\n${BLUE}Metro Configuration...${NC}"
if [ -f "metro.config.js" ]; then
    print_status "Metro configuration found"
else
    print_warning "Metro configuration not found (will use defaults)"
fi

# EAS configuration check
echo -e "\n${BLUE}EAS Build Configuration...${NC}"
if [ -f "eas.json" ]; then
    print_status "EAS configuration found"
    
    # Check build profiles
    if grep -q '"development"' eas.json; then
        print_status "Development build profile configured"
    else
        print_warning "Development build profile not found"
    fi
else
    print_error "EAS configuration missing"
fi

# Permission verification
echo -e "\n${BLUE}Permission Configuration...${NC}"

# Check iOS permissions in app.json
if grep -q "NSLocationWhenInUseUsageDescription" app.json; then
    print_status "iOS location permissions configured"
else
    print_warning "iOS location permissions may not be configured"
fi

# Check Android permissions
if grep -q "ACCESS_FINE_LOCATION" app.json; then
    print_status "Android location permissions configured"
else
    print_warning "Android location permissions may not be configured"
fi

# Firewall information
echo -e "\n${BLUE}Firewall Configuration:${NC}"
echo "Required inbound ports: 8081, 19000-19002"
echo "Required outbound ports: 80, 443, 8081"
print_warning "Ensure firewall allows these ports for device connectivity"

# Performance optimization check
echo -e "\n${BLUE}Performance Settings...${NC}"

# Check if development optimizations are in place
if [ -f "metro.config.js" ] && grep -q "watchFolders" metro.config.js; then
    print_status "Metro performance optimizations configured"
else
    print_warning "Consider adding Metro performance optimizations"
fi

# Bundle size check
BUNDLE_SIZE_LIMIT=52428800  # 50MB in bytes
if [ -d ".expo" ]; then
    print_status "Expo cache directory found"
else
    print_warning "No Expo cache found (normal for first run)"
fi

# Testing commands preparation
echo -e "\n${BLUE}Preparing Testing Commands...${NC}"

# Create convenient npm scripts if not present
if ! grep -q "test:device" package.json; then
    print_warning "Device testing scripts could be added to package.json"
fi

# Generate QR code information
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}DEVICE TESTING READY!${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${BLUE}Connection Methods:${NC}"
echo "1. Expo Go (Recommended for testing):"
echo "   - Run: expo start"
echo "   - Scan QR code with Expo Go app"
echo "   - URL: exp://$LOCAL_IP:$DEV_PORT"

echo -e "\n2. Development Build:"
echo "   - iOS: eas build --platform ios --profile development"
echo "   - Android: eas build --platform android --profile development"

echo -e "\n3. Alternative Connection Methods:"
echo "   - Tunnel: expo start --tunnel (for different networks)"
echo "   - Localhost: expo start --localhost (same machine only)"
echo "   - LAN: expo start --lan (same WiFi network)"

echo -e "\n${BLUE}Quick Start Commands:${NC}"
echo "expo start              # Start with QR code"
echo "expo start --clear      # Start with cache cleared"
echo "expo start --tunnel     # Start with tunnel for remote access"
echo "expo start --localhost  # Start for local testing only"

echo -e "\n${BLUE}Troubleshooting:${NC}"
echo "- Cannot connect: Check WiFi network and firewall"
echo "- Slow loading: Try 'expo start --clear'"
echo "- QR not working: Try tunnel mode or type URL manually"
echo "- Permission errors: Check app.json configuration"

echo -e "\n${GREEN}Ready for device testing! Run 'expo start' to begin.${NC}"