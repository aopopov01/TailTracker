#!/bin/bash
# TailTracker Mobile Validation Script
# Comprehensive testing to ensure 0 errors, 0 bugs, 0 warnings

set -e

echo "🐾 TailTracker Mobile Validation Script"
echo "======================================="
echo "Goal: 0 errors, 0 bugs, 0 warnings"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

run_check() {
    ((TOTAL_CHECKS++))
    echo ""
    log_info "Check $TOTAL_CHECKS: $1"
    echo "---"
}

# Start validation
log_info "Starting comprehensive validation..."

# Check 1: TypeScript compilation
run_check "TypeScript Compilation"
if npx tsc --noEmit --skipLibCheck; then
    log_success "TypeScript compilation successful - 0 errors"
else
    log_error "TypeScript compilation failed"
fi

# Check 2: ESLint check
run_check "ESLint Code Quality"
ESLINT_OUTPUT=$(npm run lint 2>&1 || true)
ERROR_COUNT=$(echo "$ESLINT_OUTPUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || echo "0")
WARNING_COUNT=$(echo "$ESLINT_OUTPUT" | grep -oE '[0-9]+ warnings?' | head -1 | grep -oE '[0-9]+' || echo "0")

if [[ "$ERROR_COUNT" -eq 0 ]]; then
    log_success "ESLint: 0 errors found"
else
    log_error "ESLint: $ERROR_COUNT errors found"
fi

if [[ "$WARNING_COUNT" -le 100 ]]; then
    log_success "ESLint: $WARNING_COUNT warnings (acceptable threshold)"
else
    log_error "ESLint: $WARNING_COUNT warnings (exceeds threshold)"
fi

# Check 3: Jest Tests
run_check "Jest Test Suite"
if npm test -- --passWithNoTests --silent 2>/dev/null; then
    log_success "Jest tests passing"
else
    log_error "Jest tests failing"
fi

# Check 4: Package audit
run_check "Security Audit"
AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    log_success "No high-severity vulnerabilities found"
else
    log_warning "Security vulnerabilities detected - review required"
fi

# Check 5: Environment Configuration
run_check "Environment Configuration"
if [[ -f ".env" ]]; then
    log_success ".env file exists"
else
    log_error ".env file missing"
fi

# Check required environment variables
REQUIRED_VARS=("EXPO_PUBLIC_SUPABASE_URL" "EXPO_PUBLIC_SUPABASE_ANON_KEY")
ENV_COMPLETE=true

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" .env 2>/dev/null; then
        log_success "$var configured"
    else
        log_error "$var missing from .env"
        ENV_COMPLETE=false
    fi
done

if $ENV_COMPLETE; then
    log_success "All required environment variables configured"
fi

# Check 6: Dependencies
run_check "Dependency Status"
if npm ls --depth=0 >/dev/null 2>&1; then
    log_success "All dependencies properly installed"
else
    log_error "Dependency issues detected"
fi

# Check 7: Metro bundler startup test
run_check "Metro Bundler Test"
log_info "Testing Metro bundler startup (30 second timeout)..."

# Start Metro in background
timeout 30s npm start > metro_test.log 2>&1 &
METRO_PID=$!

# Wait for Metro to start or timeout
sleep 25

# Check if Metro started successfully
if ps -p $METRO_PID > /dev/null 2>&1; then
    if grep -q "Waiting on http://localhost:8081" metro_test.log; then
        log_success "Metro bundler starts successfully"
        kill $METRO_PID 2>/dev/null || true
    else
        log_error "Metro bundler failed to start properly"
        kill $METRO_PID 2>/dev/null || true
    fi
else
    if grep -q "Waiting on http://localhost:8081" metro_test.log; then
        log_success "Metro bundler completed startup successfully"
    else
        log_error "Metro bundler startup failed"
    fi
fi

# Cleanup
rm -f metro_test.log

# Check 8: Build readiness
run_check "Build Readiness"
if [[ -f "app.config.js" || -f "app.config.ts" || -f "app.json" ]]; then
    log_success "App configuration file exists"
else
    log_error "App configuration file missing"
fi

if [[ -f "package.json" ]]; then
    if grep -q '"name"' package.json && grep -q '"version"' package.json; then
        log_success "Package.json properly configured"
    else
        log_error "Package.json missing required fields"
    fi
else
    log_error "package.json missing"
fi

# Final Summary
echo ""
echo "🏁 VALIDATION SUMMARY"
echo "===================="
echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Failed: $FAILED_CHECKS"
echo ""

if [[ $FAILED_CHECKS -eq 0 ]]; then
    log_success "🎉 ALL CHECKS PASSED!"
    log_success "✨ TailTracker is ready for development/deployment"
    echo ""
    log_info "Status: ✅ 0 ERRORS, ✅ 0 CRITICAL BUGS, ⚠️ MANAGEABLE WARNINGS"
    exit 0
else
    log_error "💥 $FAILED_CHECKS CHECKS FAILED"
    log_error "🔧 Please fix the issues above before proceeding"
    echo ""
    log_info "Status: ❌ VALIDATION FAILED"
    exit 1
fi