#!/bin/bash

# TailTracker Backup Monitoring and Health Check System
# Ensures continuous preservation and 100% restoration capability

set -e

PROJECT_ROOT="/home/he_reat/Desktop/Projects/TailTracker"
HEALTH_LOG="$PROJECT_ROOT/backup-health.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_health() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$HEALTH_LOG"
}

error_health() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$HEALTH_LOG"
}

warning_health() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$HEALTH_LOG"
}

# Comprehensive health check
perform_health_check() {
    log_health "🔍 Starting TailTracker backup health check..."
    
    cd "$PROJECT_ROOT"
    
    local issues=0
    
    # Check 1: Git repository status
    if [ -d ".git" ]; then
        log_health "✅ Git repository exists"
        
        # Check remote connection
        if git ls-remote origin >/dev/null 2>&1; then
            log_health "✅ GitHub remote connection working"
        else
            error_health "❌ Cannot connect to GitHub remote"
            ((issues++))
        fi
        
        # Check for uncommitted changes
        if git diff --quiet && git diff --cached --quiet; then
            log_health "✅ Working directory clean"
        else
            warning_health "⚠️ Uncommitted changes detected"
            log_health "Running auto-backup to preserve changes..."
            ./auto-backup.sh manual "Health check detected uncommitted changes"
        fi
        
        # Check sync status
        git fetch origin main 2>/dev/null || true
        local local_hash=$(git rev-parse main 2>/dev/null || echo "none")
        local remote_hash=$(git rev-parse origin/main 2>/dev/null || echo "none")
        
        if [ "$local_hash" = "$remote_hash" ] && [ "$local_hash" != "none" ]; then
            log_health "✅ Local and remote repositories in sync"
        else
            warning_health "⚠️ Local and remote out of sync"
            log_health "Local:  $local_hash"
            log_health "Remote: $remote_hash"
        fi
        
    else
        error_health "❌ Git repository not initialized"
        ((issues++))
    fi
    
    # Check 2: Critical files
    local critical_files=("CLAUDE.md" "ERROR_LOG.md" "auto-backup.sh")
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            log_health "✅ Critical file exists: $file"
            
            # Check file size (should not be empty)
            if [ -s "$file" ]; then
                log_health "✅ File has content: $file"
            else
                error_health "❌ File is empty: $file"
                ((issues++))
            fi
        else
            error_health "❌ Critical file missing: $file"
            ((issues++))
        fi
    done
    
    # Check 3: Backup recency
    if [ -f "$PROJECT_ROOT/backup.log" ]; then
        local last_backup=$(tail -1 "$PROJECT_ROOT/backup.log" | grep -o '\[.*\]' | head -1 | tr -d '[]' || echo "unknown")
        log_health "✅ Last backup logged: $last_backup"
    else
        warning_health "⚠️ No backup log found"
    fi
    
    # Check 4: Directory structure
    local required_dirs=("error_logs")
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_health "✅ Directory exists: $dir"
        else
            warning_health "⚠️ Creating missing directory: $dir"
            mkdir -p "$dir"
        fi
    done
    
    # Check 5: SSH key availability and fingerprint verification
    if [ -f "$HOME/.ssh/id_ed25519" ]; then
        log_health "✅ SSH key exists"
        
        # Verify SSH fingerprint for security
        local expected_fingerprint="SHA256:NVCtTVbZYQraMObPNIKCGkCBGM8NujB2/6i/kTQaL2A"
        local actual_fingerprint=$(ssh-keygen -lf ~/.ssh/id_ed25519.pub 2>/dev/null | awk '{print $2}' || echo "unknown")
        
        if [ "$actual_fingerprint" = "$expected_fingerprint" ]; then
            log_health "✅ SSH fingerprint verified (WSL Ubuntu Development)"
        else
            error_health "❌ SSH fingerprint mismatch!"
            error_health "Expected: $expected_fingerprint"
            error_health "Actual: $actual_fingerprint"
            ((issues++))
        fi
    else
        error_health "❌ SSH key missing"
        ((issues++))
    fi
    
    # Check 6: Disk space
    local disk_usage=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 90 ]; then
        log_health "✅ Disk space available: ${disk_usage}% used"
    else
        error_health "❌ Disk space critical: ${disk_usage}% used"
        ((issues++))
    fi
    
    # Summary
    if [ $issues -eq 0 ]; then
        log_health "🎉 Health check PASSED - All systems operational"
        return 0
    else
        error_health "⚠️ Health check FAILED - $issues issues found"
        return 1
    fi
}

# Auto-fix common issues
auto_fix_issues() {
    log_health "🔧 Attempting to auto-fix common issues..."
    
    cd "$PROJECT_ROOT"
    
    # Fix 1: Initialize git if missing
    if [ ! -d ".git" ]; then
        log_health "Initializing Git repository..."
        git init
        git branch -m main
        git remote add origin git@github.com:aopopov01/TailTracker.git
    fi
    
    # Fix 2: Create missing directories
    mkdir -p error_logs
    
    # Fix 3: Backup any uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        log_health "Backing up uncommitted changes..."
        ./auto-backup.sh manual "Auto-fix backup of uncommitted changes"
    fi
    
    # Fix 4: Update error log if empty
    if [ ! -s "ERROR_LOG.md" ]; then
        log_health "Recreating ERROR_LOG.md..."
        cat > ERROR_LOG.md << 'EOF'
# TailTracker Error Log

## 🚨 CRITICAL: This file is the single source of truth for all errors and their fixes

**RULE**: Before attempting ANY fix, search this file first. The same error should NEVER happen twice.

## Quick Reference Index
- [TypeScript Errors](#typescript-errors)
- [React Native Errors](#react-native-errors)
- [Expo Errors](#expo-errors)
- [Supabase Errors](#supabase-errors)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)

## Error Entries

<!-- New errors will be added here -->

---

## Statistics

**Total Errors Logged**: 0
**Repeated Errors**: 0
**Prevention Success Rate**: 100%
**Last Updated**: $(date '+%Y-%m-%d')
EOF
    fi
    
    log_health "✅ Auto-fix completed"
}

# Generate comprehensive status report
generate_status_report() {
    local report_file="$PROJECT_ROOT/backup-status-report.md"
    
    cat > "$report_file" << EOF
# TailTracker Backup Status Report

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')

## 📊 Repository Statistics

**Project Location**: $PROJECT_ROOT
**Git Repository**: $(if [ -d ".git" ]; then echo "✅ Initialized"; else echo "❌ Missing"; fi)
**Remote URL**: $(git remote get-url origin 2>/dev/null || echo "Not configured")
**Current Branch**: $(git branch --show-current 2>/dev/null || echo "Unknown")
**Total Commits**: $(git rev-list --count HEAD 2>/dev/null || echo "0")
**Total Files**: $(find . -type f -not -path './.git/*' | wc -l)
**Total Lines**: $(find . -name "*.md" -o -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.sh" | xargs wc -l 2>/dev/null | tail -n1 | awk '{print $1}' || echo "0")

## 🔄 Backup Status

**Last Commit**: $(git log -1 --format="%h - %ad - %s" --date=short 2>/dev/null || echo "No commits")
**Local vs Remote**: $(
    if [ -d ".git" ]; then
        git fetch origin main 2>/dev/null || true
        local_hash=$(git rev-parse main 2>/dev/null || echo "none")
        remote_hash=$(git rev-parse origin/main 2>/dev/null || echo "none")
        if [ "$local_hash" = "$remote_hash" ] && [ "$local_hash" != "none" ]; then
            echo "✅ In Sync"
        else
            echo "⚠️ Out of Sync"
        fi
    else
        echo "❌ No Git"
    fi
)
**Uncommitted Changes**: $(if git diff --quiet && git diff --cached --quiet 2>/dev/null; then echo "✅ None"; else echo "⚠️ Present"; fi)

## 📋 Critical Files Status

$(for file in "CLAUDE.md" "ERROR_LOG.md" "auto-backup.sh" "backup-monitor.sh"; do
    if [ -f "$file" ]; then
        size=$(wc -l < "$file" 2>/dev/null || echo "0")
        echo "- **$file**: ✅ Present ($size lines)"
    else
        echo "- **$file**: ❌ Missing"
    fi
done)

## 🏥 Health Check Summary

$(perform_health_check 2>&1 | tail -n1)

## 📈 Recommendations

$(
    issues=0
    
    # Check for issues and provide recommendations
    if [ ! -d ".git" ]; then
        echo "- ⚠️ Initialize Git repository and set up remote"
        ((issues++))
    fi
    
    if ! git diff --quiet || ! git diff --cached --quiet 2>/dev/null; then
        echo "- ⚠️ Commit pending changes: \`./auto-backup.sh manual 'description'\`"
        ((issues++))
    fi
    
    if ! git ls-remote origin >/dev/null 2>&1; then
        echo "- ⚠️ Fix GitHub remote connection (check SSH keys)"
        ((issues++))
    fi
    
    if [ $issues -eq 0 ]; then
        echo "- ✅ All systems operational - no action required"
    fi
)

## 🚀 Quick Actions

\`\`\`bash
# Manual backup
./auto-backup.sh manual "description"

# Health check
./backup-monitor.sh health

# Auto-fix issues
./backup-monitor.sh fix

# List recent backups
./auto-backup.sh list

# Setup automation
./auto-backup.sh setup
\`\`\`

---

*Report generated by TailTracker Backup Monitoring System*
EOF

    log_health "📊 Status report generated: $report_file"
}

# Watch for file changes and auto-backup
watch_changes() {
    log_health "👁️ Starting file system watcher..."
    
    if ! command -v inotifywait >/dev/null 2>&1; then
        error_health "inotifywait not installed. Install with: sudo apt-get install inotify-tools"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    
    while true; do
        # Watch for file modifications, creations, and deletions
        inotifywait -r -e modify,create,delete,move \
            --exclude '\.git|node_modules|\.log$|\.tmp$' \
            "$PROJECT_ROOT" 2>/dev/null
        
        log_health "File change detected, waiting 30 seconds for more changes..."
        sleep 30
        
        # Check if there are actually changes to commit
        if ! git diff --quiet || ! git diff --cached --quiet; then
            log_health "Changes confirmed, performing auto-backup..."
            ./auto-backup.sh manual "Auto-detected file changes"
        fi
    done
}

# Main command handler
case "$1" in
    "health")
        perform_health_check
        ;;
    "fix")
        auto_fix_issues
        ;;
    "report")
        generate_status_report
        ;;
    "watch")
        watch_changes
        ;;
    "status")
        perform_health_check
        generate_status_report
        ;;
    *)
        echo "TailTracker Backup Monitoring System"
        echo ""
        echo "Usage: $0 {health|fix|report|watch|status}"
        echo ""
        echo "Commands:"
        echo "  health    - Perform comprehensive health check"
        echo "  fix       - Auto-fix common backup issues"
        echo "  report    - Generate detailed status report"
        echo "  watch     - Watch for file changes and auto-backup"
        echo "  status    - Run health check and generate report"
        echo ""
        exit 1
        ;;
esac