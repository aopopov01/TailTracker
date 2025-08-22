#!/bin/bash

# TailTracker Device Testing Status Check
# Quick status check for device testing readiness

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOCAL_IP="192.168.20.112"
DEV_PORT="8081"

echo -e "${BLUE}TailTracker Device Testing Status${NC}"
echo -e "${BLUE}=================================${NC}"

# Check if dev server is running
if ps aux | grep -q "[e]xpo start"; then
    echo -e "${GREEN}✓ Development server is running${NC}"
    
    # Check if port is accessible
    if curl -s "http://$LOCAL_IP:$DEV_PORT" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Dev server accessible at http://$LOCAL_IP:$DEV_PORT${NC}"
    else
        echo -e "${YELLOW}⚠ Dev server running but not accessible on network${NC}"
    fi
else
    echo -e "${RED}✗ Development server not running${NC}"
    echo -e "${YELLOW}  Run: npx expo start${NC}"
fi

# Check QR code availability
echo -e "\n${BLUE}Connection Information:${NC}"
echo "Expo Go URL: exp://$LOCAL_IP:$DEV_PORT"
echo "Web Interface: http://$LOCAL_IP:$DEV_PORT"
echo "Local IP: $LOCAL_IP"

# Quick device connectivity test
echo -e "\n${BLUE}Device Testing Options:${NC}"
echo "1. Scan QR code with Expo Go app"
echo "2. Enter URL manually: exp://$LOCAL_IP:$DEV_PORT"
echo "3. Use tunnel mode: npx expo start --tunnel"

# Show current processes
echo -e "\n${BLUE}Active Processes:${NC}"
ps aux | grep -E "(expo|metro)" | grep -v grep || echo "No Expo/Metro processes found"

echo -e "\n${GREEN}Quick Commands:${NC}"
echo "npx expo start              # Start development server"
echo "npx expo start --clear      # Clear cache and restart"
echo "npx expo start --tunnel     # Enable tunnel mode"
echo "npx expo logs               # View app logs"

echo -e "\n${BLUE}Ready for device testing!${NC}"