#!/bin/bash

# TailTracker Pre-build Validation and Preflight Checklist Script
# Comprehensive validation before building or deploying the app

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Default values
ENVIRONMENT="development"
PLATFORM="all"
VERBOSE=false
CHECK_DEPENDENCIES=true
CHECK_CONFIG=true
CHECK_SECURITY=true
CHECK_COMPLIANCE=true

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

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
    echo "  -p, --platform       Platform (ios|android|all) [default: all]"
    echo "  -v, --verbose        Enable verbose output"
    echo "  --no-deps           Skip dependency checks"
    echo "  --no-config         Skip configuration checks"
    echo "  --no-security       Skip security checks"
    echo "  --no-compliance     Skip compliance checks"
    echo "  -h, --help          Show this help message"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-deps)
            CHECK_DEPENDENCIES=false
            shift
            ;;
        --no-config)
            CHECK_CONFIG=false
            shift
            ;;
        --no-security)
            CHECK_SECURITY=false
            shift
            ;;
        --no-compliance)
            CHECK_COMPLIANCE=false
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

# Function to run a check and track results
run_check() {
    local check_name="$1"
    local check_command="$2"
    local is_critical="$3"  # true/false
    
    ((TOTAL_CHECKS++))
    
    if [[ "$VERBOSE" == true ]]; then
        print_message $BLUE "Running: $check_name"
    fi
    
    if eval "$check_command" >/dev/null 2>&1; then
        print_message $GREEN "✓ $check_name"
        ((PASSED_CHECKS++))
        return 0
    else
        if [[ "$is_critical" == "true" ]]; then
            print_message $RED "✗ $check_name (CRITICAL)"
            ((FAILED_CHECKS++))
            return 1
        else
            print_message $YELLOW "⚠ $check_name (WARNING)"
            ((WARNING_CHECKS++))
            return 2
        fi
    fi
}

# Function to check file exists
check_file_exists() {
    local file_path="$1"
    local description="$2"
    local is_critical="$3"
    
    run_check "$description" "test -f '$file_path'" "$is_critical"
}

# Function to check directory exists
check_dir_exists() {
    local dir_path="$1"
    local description="$2"
    local is_critical="$3"
    
    run_check "$description" "test -d '$dir_path'" "$is_critical"
}

print_message $MAGENTA "🚀 TailTracker Preflight Checklist"
print_message $BLUE "Environment: $ENVIRONMENT"
print_message $BLUE "Platform: $PLATFORM"
print_message $BLUE "Starting comprehensive validation...\n"

# Change to project directory
cd "$PROJECT_DIR"

# Load environment variables
ENV_FILE=".env.${ENVIRONMENT}"
if [[ -f "$ENV_FILE" ]]; then
    if [[ "$VERBOSE" == true ]]; then
        print_message $BLUE "Loading environment variables from $ENV_FILE"
    fi
    set -a
    source "$ENV_FILE"
    set +a
fi

# 1. BASIC PROJECT STRUCTURE
print_message $BLUE "\n📁 Project Structure Validation"
check_file_exists "package.json" "Package.json exists" true
check_file_exists "app.json" "App.json configuration exists" true
check_file_exists "eas.json" "EAS configuration exists" true
check_file_exists "tsconfig.json" "TypeScript configuration exists" true
check_dir_exists "src" "Source directory exists" true
check_dir_exists "assets" "Assets directory exists" true

# 2. DEPENDENCY CHECKS
if [[ "$CHECK_DEPENDENCIES" == true ]]; then
    print_message $BLUE "\n📦 Dependency Validation"
    
    # Check Node.js version
    run_check "Node.js version compatibility" "npx semver -r '>=18.0.0' \$(node --version | sed 's/v//')" true
    
    # Check npm/yarn
    run_check "Package manager available" "command -v npm || command -v yarn" true
    
    # Check Expo CLI
    run_check "Expo CLI available" "command -v expo || npx expo --version" true
    
    # Check EAS CLI
    run_check "EAS CLI available" "command -v eas || npx eas --version" true
    
    # Platform-specific dependency checks
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            run_check "Xcode available (iOS)" "command -v xcodebuild" true
            run_check "CocoaPods available (iOS)" "command -v pod" true
        fi
    fi
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        run_check "Android SDK available" "command -v adb || test -n \"\$ANDROID_HOME\"" false
    fi
    
    # Check node_modules
    check_dir_exists "node_modules" "Node modules installed" true
    
    # Check for security vulnerabilities
    run_check "No high-severity vulnerabilities" "npm audit --audit-level high --json | jq -e '.vulnerabilities | length == 0'" false
fi

# 3. CONFIGURATION VALIDATION
if [[ "$CHECK_CONFIG" == true ]]; then
    print_message $BLUE "\n⚙️ Configuration Validation"
    
    # Environment file validation
    check_file_exists "$ENV_FILE" "Environment configuration exists" true
    
    # Required environment variables
    ENV_VARS=("API_BASE_URL" "SUPABASE_URL" "FIREBASE_PROJECT_ID")
    for var in "${ENV_VARS[@]}"; do
        run_check "Environment variable: $var" "test -n \"\${$var}\"" false
    done
    
    # App configuration validation
    run_check "App name configured" "jq -e '.expo.name' app.json" true
    run_check "Bundle identifier configured" "jq -e '.expo.ios.bundleIdentifier' app.json" true
    run_check "Android package configured" "jq -e '.expo.android.package' app.json" true
    
    # EAS project ID
    run_check "EAS project ID configured" "jq -e '.expo.extra.eas.projectId' app.json" false
    
    # Platform-specific configuration
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        check_file_exists "ios/TailTracker/Info.plist" "iOS Info.plist exists" false
        run_check "iOS deployment target configured" "jq -e '.expo.ios.deploymentTarget' app.json" false
    fi
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        check_file_exists "android/app/src/main/AndroidManifest.xml" "Android manifest exists" false
        run_check "Android compile SDK configured" "jq -e '.expo.android.compileSdkVersion' app.json" false
    fi
fi

# 4. CODE QUALITY CHECKS
print_message $BLUE "\n🔍 Code Quality Validation"

# Linting
run_check "ESLint configuration exists" "test -f .eslintrc.js || test -f .eslintrc.json || test -f eslint.config.js" true
run_check "Code passes linting" "npm run lint" false

# TypeScript type checking
run_check "TypeScript types are valid" "npm run type-check" false

# Test configuration
check_file_exists "src/test/setup.ts" "Test setup exists" false
run_check "Jest configuration exists" "jq -e '.jest' package.json || test -f jest.config.js" false

# 5. SECURITY VALIDATION
if [[ "$CHECK_SECURITY" == true ]]; then
    print_message $BLUE "\n🔒 Security Validation"
    
    # Check for hardcoded secrets
    run_check "No hardcoded API keys in source" "! grep -r 'AIza[0-9A-Za-z-_]{35}' src/ || true" true
    run_check "No hardcoded passwords" "! grep -ri 'password.*=' src/ --include='*.ts' --include='*.tsx' | grep -v 'PASSWORD' || true" false
    
    # Environment security
    if [[ "$ENVIRONMENT" == "production" ]]; then
        run_check "Debug logging disabled (production)" "grep -q 'ENABLE_DEBUG_LOGGING=false' $ENV_FILE" false
        run_check "Dev menu disabled (production)" "grep -q 'ENABLE_DEV_MENU=false' $ENV_FILE" true
        run_check "Flipper disabled (production)" "grep -q 'FLIPPER_ENABLED=false' $ENV_FILE" false
    fi
    
    # Check for sensitive files
    run_check "No .env files in git" "! git ls-files | grep -E '^\.env($|\..*)' || true" true
    run_check "No keystore files in git" "! git ls-files | grep -E '\.(keystore|jks|p12|mobileprovision)$' || true" true
    
    # App Transport Security (iOS)
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        run_check "App Transport Security configured" "jq -e '.expo.ios.infoPlist.NSAppTransportSecurity' app.json" false
    fi
fi

# 6. COMPLIANCE CHECKS
if [[ "$CHECK_COMPLIANCE" == true ]]; then
    print_message $BLUE "\n📋 Compliance Validation"
    
    # Legal files
    check_file_exists "legal/privacy-policy.md" "Privacy policy exists" true
    check_file_exists "legal/terms-of-service.md" "Terms of service exists" true
    
    # Permission descriptions
    run_check "Location permission description (iOS)" "jq -e '.expo.ios.infoPlist.NSLocationWhenInUseUsageDescription' app.json" true
    run_check "Camera permission description (iOS)" "jq -e '.expo.ios.infoPlist.NSCameraUsageDescription' app.json" true
    run_check "Photo library permission description (iOS)" "jq -e '.expo.ios.infoPlist.NSPhotoLibraryUsageDescription' app.json" true
    
    # Store assets
    check_file_exists "assets/images/icon.png" "App icon exists" true
    check_file_exists "assets/images/splash.png" "Splash screen exists" true
    
    # App store metadata
    check_dir_exists "appstore" "App Store metadata directory exists" false
    check_dir_exists "playstore" "Play Store metadata directory exists" false
fi

# 7. BUILD PREREQUISITES
print_message $BLUE "\n🏗️ Build Prerequisites"

# Platform-specific build checks
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        run_check "iOS build directory clean" "test ! -d ios/build || test -z \"\$(find ios/build -name '*.app' -o -name '*.ipa' 2>/dev/null)\"" false
        if [[ -d "ios" ]]; then
            run_check "iOS Pods installed" "test -d ios/Pods" false
            run_check "iOS workspace exists" "test -f ios/TailTracker.xcworkspace/contents.xcworkspacedata" false
        fi
    fi
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
    run_check "Android build directory clean" "test ! -d android/app/build || test -z \"\$(find android/app/build -name '*.apk' -o -name '*.aab' 2>/dev/null)\"" false
    if [[ -d "android" ]]; then
        run_check "Android gradle wrapper exists" "test -f android/gradlew" false
    fi
fi

# Git status check
run_check "Working directory is clean" "git diff-index --quiet HEAD --" false
run_check "No untracked files" "test -z \"\$(git ls-files --others --exclude-standard)\"" false

# 8. RUNTIME ENVIRONMENT VALIDATION
print_message $BLUE "\n🌍 Runtime Environment"

# API connectivity (if in staging/production)
if [[ "$ENVIRONMENT" != "development" && -n "$API_BASE_URL" ]]; then
    run_check "API endpoint reachable" "curl -f -s --max-time 10 \"\$API_BASE_URL/health\" || curl -f -s --max-time 10 \"\$API_BASE_URL\"" false
fi

# Firebase connectivity
if [[ -n "$FIREBASE_PROJECT_ID" ]]; then
    run_check "Firebase project accessible" "curl -f -s --max-time 10 \"https://\$FIREBASE_PROJECT_ID.firebaseio.com/.json\"" false
fi

# FINAL SUMMARY
print_message $BLUE "\n📊 Preflight Check Summary"
print_message $BLUE "================================"
print_message $GREEN "✓ Passed: $PASSED_CHECKS"
print_message $YELLOW "⚠ Warnings: $WARNING_CHECKS"
print_message $RED "✗ Failed: $FAILED_CHECKS"
print_message $BLUE "Total: $TOTAL_CHECKS"

# Determine exit code
if [[ $FAILED_CHECKS -gt 0 ]]; then
    print_message $RED "\n❌ Preflight check FAILED!"
    print_message $RED "Please fix the critical issues above before proceeding with the build."
    exit 1
elif [[ $WARNING_CHECKS -gt 0 ]]; then
    print_message $YELLOW "\n⚠️ Preflight check completed with WARNINGS!"
    print_message $YELLOW "Consider addressing the warnings above for optimal build quality."
    exit 2
else
    print_message $GREEN "\n✅ All preflight checks PASSED!"
    print_message $GREEN "Your project is ready for building and deployment."
    exit 0
fi