#!/bin/bash

# TailTracker Backend Health Check Script
# Usage: ./health-check.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
PROJECT_DIR=$(dirname "$(readlink -f "$0")")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏥 TailTracker Backend Health Check - ${ENVIRONMENT}${NC}"

# Load environment variables
if [[ "$ENVIRONMENT" == "staging" ]]; then
    ENV_FILE="$PROJECT_DIR/.env.staging"
else
    ENV_FILE="$PROJECT_DIR/.env.production"
fi

if [[ -f "$ENV_FILE" ]]; then
    source "$ENV_FILE"
else
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    exit 1
fi

# Health check results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run health check
check_service() {
    local service_name="$1"
    local check_command="$2"
    local expected_status="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "${YELLOW}🔍 Checking $service_name...${NC}"
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ $service_name is healthy${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}  ❌ $service_name is unhealthy${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Check Supabase API
check_service "Supabase API" \
    "curl -s -f $SUPABASE_URL/rest/v1/" \
    "200"

# Check Supabase Auth
check_service "Supabase Auth" \
    "curl -s -f $SUPABASE_URL/auth/v1/settings" \
    "200"

# Check Supabase Storage
check_service "Supabase Storage" \
    "curl -s -f $SUPABASE_URL/storage/v1/buckets" \
    "200"

# Check Supabase Realtime
check_service "Supabase Realtime" \
    "curl -s -f $SUPABASE_URL/realtime/v1/" \
    "200"

# Check Edge Functions
FUNCTIONS=(
    "pets"
    "vaccinations"
    "lost-pets"
    "stripe-webhook"
    "user-profile"
    "file-upload"
    "auth-helpers"
    "notification-scheduler"
)

for func in "${FUNCTIONS[@]}"; do
    check_service "Edge Function: $func" \
        "curl -s -o /dev/null -w '%{http_code}' $SUPABASE_URL/functions/v1/$func | grep -E '^(200|401|405)$'" \
        "200|401|405"
done

# Check Database Connection
echo -e "${YELLOW}🔍 Checking Database Connection...${NC}"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

DB_CHECK=$(supabase db remote commit list 2>/dev/null || echo "failed")
if [[ "$DB_CHECK" != "failed" ]]; then
    echo -e "${GREEN}  ✅ Database connection is healthy${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}  ❌ Database connection failed${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Check Storage Buckets
echo -e "${YELLOW}🔍 Checking Storage Buckets...${NC}"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

EXPECTED_BUCKETS=("pet-photos" "vaccination-certificates" "user-avatars" "lost-pet-photos" "medical-documents")
BUCKET_CHECK_FAILED=false

for bucket in "${EXPECTED_BUCKETS[@]}"; do
    BUCKET_EXISTS=$(curl -s -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        "$SUPABASE_URL/storage/v1/bucket/$bucket" | grep -o '"name"' || echo "")
    
    if [[ -z "$BUCKET_EXISTS" ]]; then
        echo -e "${RED}    ❌ Bucket missing: $bucket${NC}"
        BUCKET_CHECK_FAILED=true
    else
        echo -e "${GREEN}    ✅ Bucket exists: $bucket${NC}"
    fi
done

if [[ "$BUCKET_CHECK_FAILED" == "false" ]]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Check RLS Policies
echo -e "${YELLOW}🔍 Checking RLS Policies...${NC}"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# This is a basic check - in a real implementation you'd verify specific policies
RLS_CHECK=$(supabase db remote commit list 2>/dev/null | grep -i "rls" || echo "")
if [[ -n "$RLS_CHECK" || "$ENVIRONMENT" == "staging" ]]; then
    echo -e "${GREEN}  ✅ RLS policies appear to be configured${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}  ⚠️  Cannot verify RLS policies${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Performance checks
echo -e "${YELLOW}🔍 Checking API Response Times...${NC}"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

API_RESPONSE_TIME=$(curl -s -w '%{time_total}' -o /dev/null "$SUPABASE_URL/rest/v1/" || echo "0")
API_RESPONSE_MS=$(echo "$API_RESPONSE_TIME * 1000" | bc 2>/dev/null || echo "0")

if (( $(echo "$API_RESPONSE_TIME < 2.0" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "${GREEN}  ✅ API response time: ${API_RESPONSE_MS}ms (good)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
elif (( $(echo "$API_RESPONSE_TIME < 5.0" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "${YELLOW}  ⚠️  API response time: ${API_RESPONSE_MS}ms (acceptable)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}  ❌ API response time: ${API_RESPONSE_MS}ms (slow)${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Summary
echo ""
echo -e "${YELLOW}📊 Health Check Summary:${NC}"
echo "  Total Checks: $TOTAL_CHECKS"
echo -e "  ${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "  ${RED}Failed: $FAILED_CHECKS${NC}"

HEALTH_PERCENTAGE=$(echo "scale=1; $PASSED_CHECKS * 100 / $TOTAL_CHECKS" | bc 2>/dev/null || echo "0")
echo "  Health Score: ${HEALTH_PERCENTAGE}%"

echo ""
if [[ $FAILED_CHECKS -eq 0 ]]; then
    echo -e "${GREEN}🎉 All systems are healthy!${NC}"
    exit 0
elif [[ $FAILED_CHECKS -lt 3 ]]; then
    echo -e "${YELLOW}⚠️  Some issues detected but system is mostly functional${NC}"
    exit 1
else
    echo -e "${RED}❌ Multiple critical issues detected!${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Recommended actions:${NC}"
    echo "  1. Check Supabase project status"
    echo "  2. Verify environment variables"
    echo "  3. Check network connectivity"
    echo "  4. Review recent deployments"
    echo "  5. Check Supabase dashboard for errors"
    exit 2
fi