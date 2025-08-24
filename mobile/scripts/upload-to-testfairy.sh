#!/bin/bash

# TestFairy Upload Script for TailTracker
# Usage: ./upload-to-testfairy.sh path/to/app.apk

set -e

# Configuration
TESTFAIRY_API_KEY="${TESTFAIRY_API_KEY}"
APP_FILE="$1"
TESTERS_GROUPS="qa-team"  # Replace with your TestFairy group names
NOTIFY="on"
COMMENT="TailTracker build uploaded via script"
MAX_DURATION="10m"
VIDEO="on"
VIDEO_QUALITY="medium"
SCREENSHOT_INTERVAL="1"

# Check if API key is set
if [ -z "$TESTFAIRY_API_KEY" ]; then
    echo "❌ Error: TESTFAIRY_API_KEY environment variable is not set"
    echo "To get your API key:"
    echo "1. Login to TestFairy dashboard"
    echo "2. Go to Account Settings > API Key"
    echo "3. Copy the API key and set it as environment variable:"
    echo "   export TESTFAIRY_API_KEY='your-api-key-here'"
    exit 1
fi

# Check if app file is provided and exists
if [ -z "$APP_FILE" ]; then
    echo "❌ Error: Please provide path to APK/IPA file"
    echo "Usage: $0 path/to/app.apk"
    exit 1
fi

if [ ! -f "$APP_FILE" ]; then
    echo "❌ Error: File '$APP_FILE' not found"
    exit 1
fi

echo "🚀 Uploading to TestFairy..."
echo "📱 App: $APP_FILE"
echo "👥 Testers: $TESTERS_GROUPS"

# Upload to TestFairy
RESPONSE=$(curl -s \
    -F api_key="$TESTFAIRY_API_KEY" \
    -F file="@$APP_FILE" \
    -F testers-groups="$TESTERS_GROUPS" \
    -F notify="$NOTIFY" \
    -F comment="$COMMENT" \
    -F max-duration="$MAX_DURATION" \
    -F video="$VIDEO" \
    -F video-quality="$VIDEO_QUALITY" \
    -F screenshot-interval="$SCREENSHOT_INTERVAL" \
    https://upload.testfairy.com/api/upload/)

echo "$RESPONSE"

# Parse response
if echo "$RESPONSE" | grep -q '"status":"ok"'; then
    DOWNLOAD_URL=$(echo "$RESPONSE" | grep -o '"build_url":"[^"]*"' | cut -d'"' -f4)
    LANDING_PAGE=$(echo "$RESPONSE" | grep -o '"landing_page_url":"[^"]*"' | cut -d'"' -f4)
    
    echo ""
    echo "✅ Upload successful!"
    echo "🔗 Download URL: $DOWNLOAD_URL"
    echo "📄 Landing Page: $LANDING_PAGE"
    echo ""
    echo "📧 Testers will receive email notifications"
    echo "🎥 Video recording enabled (max $MAX_DURATION)"
else
    echo ""
    echo "❌ Upload failed!"
    echo "Response: $RESPONSE"
    exit 1
fi