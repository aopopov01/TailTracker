#!/bin/bash

# TailTracker Supabase Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
PROJECT_DIR=$(dirname "$(readlink -f "$0")")
ROOT_DIR=$(dirname "$PROJECT_DIR")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_PROJECT_ID="${SUPABASE_STAGING_PROJECT_ID}"
PRODUCTION_PROJECT_ID="${SUPABASE_PRODUCTION_PROJECT_ID}"

echo -e "${GREEN}🚀 Starting TailTracker Supabase deployment for ${ENVIRONMENT}${NC}"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}❌ Error: Environment must be 'staging' or 'production'${NC}"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if required environment variables are set
if [[ "$ENVIRONMENT" == "staging" && -z "$STAGING_PROJECT_ID" ]]; then
    echo -e "${RED}❌ Error: SUPABASE_STAGING_PROJECT_ID environment variable is not set${NC}"
    exit 1
fi

if [[ "$ENVIRONMENT" == "production" && -z "$PRODUCTION_PROJECT_ID" ]]; then
    echo -e "${RED}❌ Error: SUPABASE_PRODUCTION_PROJECT_ID environment variable is not set${NC}"
    exit 1
fi

# Set project ID based on environment
if [[ "$ENVIRONMENT" == "staging" ]]; then
    PROJECT_ID="$STAGING_PROJECT_ID"
else
    PROJECT_ID="$PRODUCTION_PROJECT_ID"
fi

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  Environment: $ENVIRONMENT"
echo "  Project ID: $PROJECT_ID"
echo "  Project Directory: $PROJECT_DIR"

# Link to Supabase project
echo -e "${YELLOW}🔗 Linking to Supabase project...${NC}"
cd "$PROJECT_DIR"
supabase link --project-ref "$PROJECT_ID"

if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Failed to link to Supabase project${NC}"
    exit 1
fi

# Run database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
supabase db push

if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi

# Deploy Edge Functions
echo -e "${YELLOW}⚡ Deploying Edge Functions...${NC}"

# List of functions to deploy
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
    echo -e "  📦 Deploying function: $func"
    supabase functions deploy "$func" --no-verify-jwt
    
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Failed to deploy function: $func${NC}"
        exit 1
    fi
done

# Set environment variables for functions
echo -e "${YELLOW}🔧 Setting environment variables...${NC}"

# Load environment variables based on environment
if [[ "$ENVIRONMENT" == "staging" ]]; then
    ENV_FILE="$PROJECT_DIR/.env.staging"
else
    ENV_FILE="$PROJECT_DIR/.env.production"
fi

if [[ -f "$ENV_FILE" ]]; then
    echo -e "  📄 Loading environment variables from $ENV_FILE"
    
    # Read environment variables and set them in Supabase
    while IFS='=' read -r key value; do
        # Skip empty lines and comments
        if [[ -z "$key" || "$key" =~ ^#.* ]]; then
            continue
        fi
        
        # Remove quotes if present
        value=$(echo "$value" | sed 's/^"//;s/"$//')
        
        echo -e "    🔑 Setting $key"
        supabase secrets set "$key=$value"
    done < "$ENV_FILE"
else
    echo -e "${YELLOW}⚠️  Warning: Environment file $ENV_FILE not found${NC}"
fi

# Setup storage buckets
echo -e "${YELLOW}🗄️  Setting up storage buckets...${NC}"
supabase db push

# Verify deployment
echo -e "${YELLOW}✅ Verifying deployment...${NC}"

# Check if functions are responding
echo -e "  🔍 Testing Edge Functions..."
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')

if [[ -n "$SUPABASE_URL" && -n "$SUPABASE_ANON_KEY" ]]; then
    # Test a simple function
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        "$SUPABASE_URL/functions/v1/pets" || echo "000")
    
    if [[ "$HTTP_STATUS" == "401" || "$HTTP_STATUS" == "200" ]]; then
        echo -e "    ✅ Edge Functions are responding"
    else
        echo -e "    ⚠️  Edge Functions may not be responding correctly (HTTP $HTTP_STATUS)"
    fi
else
    echo -e "    ⚠️  Could not retrieve Supabase credentials for testing"
fi

# Setup webhooks for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${YELLOW}🔗 Setting up production webhooks...${NC}"
    
    WEBHOOK_URL="$SUPABASE_URL/functions/v1/stripe-webhook"
    echo -e "  📍 Stripe webhook URL: $WEBHOOK_URL"
    echo -e "  💡 Don't forget to configure this URL in your Stripe dashboard"
fi

# Generate deployment summary
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Deployment Summary:${NC}"
echo "  Environment: $ENVIRONMENT"
echo "  Project ID: $PROJECT_ID"
echo "  Supabase URL: $SUPABASE_URL"
echo "  Functions deployed: ${#FUNCTIONS[@]}"
echo ""

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${YELLOW}🔥 Post-deployment checklist for production:${NC}"
    echo "  1. ✅ Update Stripe webhook URL: $WEBHOOK_URL"
    echo "  2. ✅ Update mobile app API endpoints"
    echo "  3. ✅ Test payment flows"
    echo "  4. ✅ Test real-time notifications"
    echo "  5. ✅ Verify RLS policies"
    echo "  6. ✅ Run end-to-end tests"
else
    echo -e "${YELLOW}🧪 Staging deployment notes:${NC}"
    echo "  1. ✅ Test all API endpoints"
    echo "  2. ✅ Verify database migrations"
    echo "  3. ✅ Test file uploads"
    echo "  4. ✅ Test authentication flows"
fi

echo ""
echo -e "${GREEN}🚀 TailTracker backend is now live on $ENVIRONMENT!${NC}"