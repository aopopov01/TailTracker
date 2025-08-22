#!/bin/bash

# TailTracker Version Management Script
# Automated version bumping with Git tagging and changelog generation

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
BUMP_TYPE="patch"
DRY_RUN=false
SKIP_CHANGELOG=false
SKIP_GIT_TAG=false
PLATFORM="both"

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
    echo "  -t, --type          Bump type (major|minor|patch|prerelease) [default: patch]"
    echo "  -p, --platform      Platform (ios|android|both) [default: both]"
    echo "  --dry-run          Show what would be changed without making changes"
    echo "  --skip-changelog   Skip changelog generation"
    echo "  --skip-git-tag     Skip Git tag creation"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -t minor                    # Bump minor version for both platforms"
    echo "  $0 -t patch -p ios            # Bump patch version for iOS only"
    echo "  $0 -t major --dry-run          # Show what would change for major version bump"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            BUMP_TYPE="$2"
            shift 2
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-changelog)
            SKIP_CHANGELOG=true
            shift
            ;;
        --skip-git-tag)
            SKIP_GIT_TAG=true
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

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch|prerelease)$ ]]; then
    print_message $RED "Error: Invalid bump type. Must be major, minor, patch, or prerelease."
    exit 1
fi

# Validate platform
if [[ ! "$PLATFORM" =~ ^(ios|android|both)$ ]]; then
    print_message $RED "Error: Invalid platform. Must be ios, android, or both."
    exit 1
fi

print_message $BLUE "TailTracker Version Bump Utility"
print_message $YELLOW "Bump Type: $BUMP_TYPE"
print_message $YELLOW "Platform: $PLATFORM"
print_message $YELLOW "Dry Run: $DRY_RUN"

# Change to project directory
cd "$PROJECT_DIR"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_message $RED "Error: Not in a Git repository"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_message $RED "Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Function to get current version from package.json
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to calculate next version
calculate_next_version() {
    local current_version=$1
    local bump_type=$2
    
    case $bump_type in
        major)
            npx semver -i major "$current_version"
            ;;
        minor)
            npx semver -i minor "$current_version"
            ;;
        patch)
            npx semver -i patch "$current_version"
            ;;
        prerelease)
            npx semver -i prerelease --preid beta "$current_version"
            ;;
        *)
            echo "Invalid bump type"
            exit 1
            ;;
    esac
}

# Function to get iOS build number
get_ios_build_number() {
    if [[ -f "app.json" ]]; then
        jq -r '.expo.ios.buildNumber // "1"' app.json
    else
        echo "1"
    fi
}

# Function to get Android version code
get_android_version_code() {
    if [[ -f "app.json" ]]; then
        jq -r '.expo.android.versionCode // 1' app.json
    else
        echo "1"
    fi
}

# Function to calculate next build number
calculate_next_build_number() {
    local current_build_number=$1
    echo $((current_build_number + 1))
}

# Get current versions
CURRENT_VERSION=$(get_current_version)
NEW_VERSION=$(calculate_next_version "$CURRENT_VERSION" "$BUMP_TYPE")

# Get current build numbers
CURRENT_IOS_BUILD=$(get_ios_build_number)
CURRENT_ANDROID_VERSION_CODE=$(get_android_version_code)

# Calculate new build numbers
NEW_IOS_BUILD=$(calculate_next_build_number "$CURRENT_IOS_BUILD")
NEW_ANDROID_VERSION_CODE=$(calculate_next_build_number "$CURRENT_ANDROID_VERSION_CODE")

print_message $BLUE "\nVersion Changes:"
print_message $YELLOW "Current Version: $CURRENT_VERSION → New Version: $NEW_VERSION"

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    print_message $YELLOW "iOS Build Number: $CURRENT_IOS_BUILD → $NEW_IOS_BUILD"
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    print_message $YELLOW "Android Version Code: $CURRENT_ANDROID_VERSION_CODE → $NEW_ANDROID_VERSION_CODE"
fi

# Exit if dry run
if [[ "$DRY_RUN" == true ]]; then
    print_message $GREEN "\nDry run completed. No changes were made."
    exit 0
fi

# Confirm changes
echo ""
read -p "Proceed with version bump? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_message $YELLOW "Version bump cancelled."
    exit 0
fi

# Update package.json version
print_message $BLUE "Updating package.json..."
if command -v jq >/dev/null 2>&1; then
    jq --arg version "$NEW_VERSION" '.version = $version' package.json > package.json.tmp && mv package.json.tmp package.json
else
    # Fallback using sed
    sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
    rm package.json.bak
fi

# Update app.json
print_message $BLUE "Updating app.json..."
APP_JSON_UPDATES=()

# Always update version
APP_JSON_UPDATES+=(".expo.version = \"$NEW_VERSION\"")

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    APP_JSON_UPDATES+=(".expo.ios.buildNumber = \"$NEW_IOS_BUILD\"")
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    APP_JSON_UPDATES+=(".expo.android.versionCode = $NEW_ANDROID_VERSION_CODE")
fi

# Apply all updates to app.json
for update in "${APP_JSON_UPDATES[@]}"; do
    jq "$update" app.json > app.json.tmp && mv app.json.tmp app.json
done

# Update iOS Info.plist if it exists
if [[ -f "ios/TailTracker/Info.plist" && ("$PLATFORM" == "ios" || "$PLATFORM" == "both") ]]; then
    print_message $BLUE "Updating iOS Info.plist..."
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $NEW_VERSION" "ios/TailTracker/Info.plist" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_IOS_BUILD" "ios/TailTracker/Info.plist" 2>/dev/null || true
fi

# Update Android build.gradle if it exists
if [[ -f "android/app/build.gradle" && ("$PLATFORM" == "android" || "$PLATFORM" == "both") ]]; then
    print_message $BLUE "Updating Android build.gradle..."
    
    # Update versionCode
    sed -i.bak "s/versionCode [0-9]*/versionCode $NEW_ANDROID_VERSION_CODE/" android/app/build.gradle
    
    # Update versionName
    sed -i.bak "s/versionName \".*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle
    
    rm android/app/build.gradle.bak
fi

# Generate changelog if not skipped
if [[ "$SKIP_CHANGELOG" == false ]]; then
    print_message $BLUE "Generating changelog entry..."
    
    CHANGELOG_FILE="CHANGELOG.md"
    CHANGELOG_ENTRY="## [$NEW_VERSION] - $(date +%Y-%m-%d)

### Changes
- Version bump to $NEW_VERSION"

    if [[ -f "$CHANGELOG_FILE" ]]; then
        # Insert new entry after the header
        sed -i.bak "1,/^##/{ /^##/i\\
$CHANGELOG_ENTRY

; }" "$CHANGELOG_FILE"
        rm "$CHANGELOG_FILE.bak"
    else
        # Create new changelog
        cat > "$CHANGELOG_FILE" << EOF
# Changelog

All notable changes to TailTracker will be documented in this file.

$CHANGELOG_ENTRY
EOF
    fi
fi

# Commit changes
print_message $BLUE "Committing version bump..."
git add package.json app.json

# Add platform-specific files if they exist
if [[ -f "ios/TailTracker/Info.plist" ]]; then
    git add ios/TailTracker/Info.plist
fi

if [[ -f "android/app/build.gradle" ]]; then
    git add android/app/build.gradle
fi

if [[ -f "CHANGELOG.md" ]]; then
    git add CHANGELOG.md
fi

COMMIT_MESSAGE="chore: bump version to $NEW_VERSION

- Update app version to $NEW_VERSION"

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    COMMIT_MESSAGE+="\n- Update iOS build number to $NEW_IOS_BUILD"
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    COMMIT_MESSAGE+="\n- Update Android version code to $NEW_ANDROID_VERSION_CODE"
fi

git commit -m "$COMMIT_MESSAGE"

# Create Git tag if not skipped
if [[ "$SKIP_GIT_TAG" == false ]]; then
    print_message $BLUE "Creating Git tag..."
    TAG_NAME="v$NEW_VERSION"
    TAG_MESSAGE="Release $NEW_VERSION

Version: $NEW_VERSION"

    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        TAG_MESSAGE+="\niOS Build: $NEW_IOS_BUILD"
    fi

    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        TAG_MESSAGE+="\nAndroid Version Code: $NEW_ANDROID_VERSION_CODE"
    fi

    git tag -a "$TAG_NAME" -m "$TAG_MESSAGE"
    
    print_message $GREEN "Created tag: $TAG_NAME"
fi

# Summary
print_message $GREEN "\n✅ Version bump completed successfully!"
print_message $BLUE "Summary:"
print_message $YELLOW "  • Version: $CURRENT_VERSION → $NEW_VERSION"

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    print_message $YELLOW "  • iOS Build: $CURRENT_IOS_BUILD → $NEW_IOS_BUILD"
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    print_message $YELLOW "  • Android Version Code: $CURRENT_ANDROID_VERSION_CODE → $NEW_ANDROID_VERSION_CODE"
fi

print_message $BLUE "\nNext steps:"
echo "  1. Push changes: git push origin main"

if [[ "$SKIP_GIT_TAG" == false ]]; then
    echo "  2. Push tags: git push origin --tags"
fi

echo "  3. Build and test the new version"
echo "  4. Deploy to app stores when ready"

print_message $GREEN "\nVersion bump completed! 🚀"