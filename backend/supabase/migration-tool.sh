#!/bin/bash

# TailTracker Database Migration Tool
# Usage: ./migration-tool.sh [command] [options]

set -e

PROJECT_DIR=$(dirname "$(readlink -f "$0")")
MIGRATIONS_DIR="$PROJECT_DIR/migrations"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-development}
DRY_RUN=${DRY_RUN:-false}

show_help() {
    echo -e "${GREEN}TailTracker Database Migration Tool${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  create <name>        Create a new migration file"
    echo "  migrate              Run pending migrations"
    echo "  rollback <version>   Rollback to specific version"
    echo "  status               Show migration status"
    echo "  validate             Validate database schema"
    echo "  reset                Reset database (DANGEROUS)"
    echo "  history              Show migration history"
    echo ""
    echo "Options:"
    echo "  --environment <env>  Set environment (development, staging, production)"
    echo "  --dry-run           Show what would be done without executing"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 create add_user_preferences"
    echo "  $0 migrate --environment staging"
    echo "  $0 rollback 003 --dry-run"
    echo "  $0 status"
}

get_next_version() {
    local last_version
    last_version=$(ls "$MIGRATIONS_DIR" | grep -E '^[0-9]{3}_' | sort | tail -1 | cut -d'_' -f1)
    
    if [[ -z "$last_version" ]]; then
        echo "001"
    else
        printf "%03d" $((10#$last_version + 1))
    fi
}

create_migration() {
    local name="$1"
    if [[ -z "$name" ]]; then
        echo -e "${RED}❌ Error: Migration name is required${NC}"
        echo "Usage: $0 create <migration_name>"
        exit 1
    fi
    
    local version
    version=$(get_next_version)
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    local filename="${version}_${name}.sql"
    local filepath="$MIGRATIONS_DIR/$filename"
    
    # Create migration file
    cat > "$filepath" << EOF
-- TailTracker Database Migration: $name
-- Version: $version
-- Timestamp: $timestamp
-- Description: [Add description here]

-- Migration SQL
BEGIN;

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example_table (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Record migration
SELECT record_migration(
    '$version',
    '$name',
    '[Add description here]',
    current_user,
    '[checksum]',
    NULL,
    TRUE,
    NULL,
    -- Rollback SQL (optional)
    'DROP TABLE IF EXISTS example_table;'
);

COMMIT;

-- Rollback SQL (for manual rollback if needed)
-- BEGIN;
-- DROP TABLE IF EXISTS example_table;
-- SELECT record_migration('$version', '$name', 'Rollback: $name', current_user, NULL, NULL, FALSE, 'Manual rollback', NULL);
-- COMMIT;
EOF

    echo -e "${GREEN}✅ Created migration file: $filename${NC}"
    echo -e "${BLUE}📝 Edit the file to add your migration SQL${NC}"
    echo -e "${BLUE}📁 File location: $filepath${NC}"
}

get_current_version() {
    supabase db remote commit list 2>/dev/null | head -1 | awk '{print $1}' || echo "000"
}

get_pending_migrations() {
    local current_version
    current_version=$(get_current_version)
    
    find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort | while read -r file; do
        local version
        version=$(basename "$file" | cut -d'_' -f1)
        if [[ "$version" > "$current_version" ]]; then
            echo "$file"
        fi
    done
}

run_migration() {
    local migration_file="$1"
    local filename
    filename=$(basename "$migration_file")
    local version
    version=$(echo "$filename" | cut -d'_' -f1)
    local name
    name=$(echo "$filename" | cut -d'_' -f2- | sed 's/\.sql$//')
    
    echo -e "${YELLOW}🔄 Running migration: $filename${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${BLUE}[DRY RUN] Would execute: $migration_file${NC}"
        return 0
    fi
    
    local start_time
    start_time=$(date +%s%3N)
    
    # Execute migration
    if supabase db remote exec --file "$migration_file"; then
        local end_time
        end_time=$(date +%s%3N)
        local execution_time
        execution_time=$((end_time - start_time))
        
        echo -e "${GREEN}✅ Migration $filename completed in ${execution_time}ms${NC}"
        return 0
    else
        echo -e "${RED}❌ Migration $filename failed${NC}"
        return 1
    fi
}

migrate() {
    echo -e "${GREEN}🚀 Starting database migration${NC}"
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}🧪 DRY RUN MODE - No changes will be made${NC}"
    fi
    
    local pending_migrations
    pending_migrations=$(get_pending_migrations)
    
    if [[ -z "$pending_migrations" ]]; then
        echo -e "${GREEN}✅ No pending migrations${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}📋 Pending migrations:${NC}"
    echo "$pending_migrations" | while read -r file; do
        echo "  - $(basename "$file")"
    done
    
    if [[ "$DRY_RUN" != "true" ]]; then
        echo ""
        read -p "Continue with migration? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Migration cancelled"
            exit 0
        fi
    fi
    
    local success_count=0
    local total_count=0
    
    echo "$pending_migrations" | while read -r migration_file; do
        total_count=$((total_count + 1))
        if run_migration "$migration_file"; then
            success_count=$((success_count + 1))
        else
            echo -e "${RED}❌ Migration failed, stopping${NC}"
            exit 1
        fi
    done
    
    echo ""
    echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
    echo -e "${BLUE}📊 Executed $success_count/$total_count migrations${NC}"
}

rollback_migration() {
    local target_version="$1"
    if [[ -z "$target_version" ]]; then
        echo -e "${RED}❌ Error: Target version is required${NC}"
        echo "Usage: $0 rollback <version>"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  WARNING: Rolling back to version $target_version${NC}"
    echo -e "${RED}This will undo database changes and may result in data loss!${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${BLUE}[DRY RUN] Would rollback to version $target_version${NC}"
        return 0
    fi
    
    read -p "Are you sure you want to rollback? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Rollback cancelled"
        exit 0
    fi
    
    # This would execute the rollback function in the database
    supabase db remote exec --stdin << EOF
SELECT rollback_migration('$target_version');
EOF
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Rollback to version $target_version completed${NC}"
    else
        echo -e "${RED}❌ Rollback failed${NC}"
        exit 1
    fi
}

show_status() {
    echo -e "${GREEN}📊 TailTracker Database Migration Status${NC}"
    echo ""
    
    local current_version
    current_version=$(get_current_version)
    echo -e "${BLUE}Current Version: $current_version${NC}"
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    
    local pending_count
    pending_count=$(get_pending_migrations | wc -l)
    echo -e "${BLUE}Pending Migrations: $pending_count${NC}"
    
    if [[ $pending_count -gt 0 ]]; then
        echo ""
        echo -e "${YELLOW}Pending migrations:${NC}"
        get_pending_migrations | while read -r file; do
            echo "  - $(basename "$file")"
        done
    fi
    
    echo ""
    echo -e "${YELLOW}Recent migrations:${NC}"
    
    # Show recent migration history from database
    supabase db remote exec --stdin << 'EOF' || echo "Could not fetch migration history"
SELECT 
    version,
    name,
    applied_at,
    CASE WHEN success THEN '✅' ELSE '❌' END as status
FROM migration_history 
ORDER BY applied_at DESC 
LIMIT 10;
EOF
}

validate_schema() {
    echo -e "${GREEN}🔍 Validating database schema${NC}"
    
    supabase db remote exec --stdin << 'EOF'
SELECT validate_schema();
EOF
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Schema validation completed${NC}"
    else
        echo -e "${RED}❌ Schema validation failed${NC}"
        exit 1
    fi
}

show_history() {
    echo -e "${GREEN}📜 Migration History${NC}"
    echo ""
    
    supabase db remote exec --stdin << 'EOF'
SELECT 
    version,
    name,
    description,
    applied_at,
    applied_by,
    execution_time_ms,
    CASE WHEN success THEN '✅ Success' ELSE '❌ Failed' END as status
FROM migration_history 
ORDER BY version DESC;
EOF
}

reset_database() {
    echo -e "${RED}🚨 WARNING: This will completely reset the database!${NC}"
    echo -e "${RED}ALL DATA WILL BE LOST!${NC}"
    echo ""
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo -e "${RED}❌ Cannot reset production database${NC}"
        exit 1
    fi
    
    read -p "Type 'RESET' to confirm: " confirmation
    if [[ "$confirmation" != "RESET" ]]; then
        echo "Reset cancelled"
        exit 0
    fi
    
    echo -e "${YELLOW}🔄 Resetting database...${NC}"
    supabase db reset
    
    echo -e "${GREEN}✅ Database reset completed${NC}"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        create)
            create_migration "$2"
            exit 0
            ;;
        migrate)
            migrate
            exit 0
            ;;
        rollback)
            rollback_migration "$2"
            exit 0
            ;;
        status)
            show_status
            exit 0
            ;;
        validate)
            validate_schema
            exit 0
            ;;
        history)
            show_history
            exit 0
            ;;
        reset)
            reset_database
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# If no command provided, show help
show_help