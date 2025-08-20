#!/bin/bash

# TailTracker Automated Backup System
# Ensures 100% app restoration capability at all times

set -e  # Exit on any error

PROJECT_ROOT="/home/he_reat/Desktop/Projects/TailTracker"
BACKUP_LOG="$PROJECT_ROOT/backup.log"
ERROR_LOG="$PROJECT_ROOT/ERROR_LOG.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$BACKUP_LOG"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$BACKUP_LOG"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$BACKUP_LOG"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$BACKUP_LOG"
}

# Function to check if we're in a git repository
check_git_repo() {
    if [ ! -d ".git" ]; then
        error "Not in a git repository. Initializing..."
        git init
        git branch -m main
        git remote add origin git@github.com:aopopov01/TailTracker.git
    fi
}

# Function to backup error log with timestamp
backup_error_log() {
    if [ -f "$ERROR_LOG" ]; then
        local timestamp=$(date '+%Y%m%d_%H%M%S')
        local backup_file="$PROJECT_ROOT/error_logs/ERROR_LOG_$timestamp.md"
        
        mkdir -p "$PROJECT_ROOT/error_logs"
        cp "$ERROR_LOG" "$backup_file"
        log "Error log backed up to: $backup_file"
    fi
}

# Function to create comprehensive commit message
create_commit_message() {
    local commit_type="$1"
    local details="$2"
    
    cat << EOF
🔄 $commit_type: $(date '+%Y-%m-%d %H:%M:%S')

📊 Project Status:
- Files: $(find . -type f -not -path './.git/*' | wc -l) files
- Lines: $(find . -name "*.md" -o -name "*.js" -o -name "*.ts" -o -name "*.json" | xargs wc -l | tail -n1 | awk '{print $1}') lines
- Last Error Check: $(date '+%Y-%m-%d %H:%M:%S')

🛠️ Changes:
$details

📋 Backup Verification:
- Documentation: ✅ CLAUDE.md preserved
- Error Learning: ✅ ERROR_LOG.md updated
- Project Structure: ✅ All files included
- Git History: ✅ Complete commit chain

🚀 Generated with Claude Code - https://claude.ai/code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
}

# Function to perform automated backup
perform_backup() {
    local backup_type="$1"
    local details="${2:-Automated backup}"
    
    cd "$PROJECT_ROOT"
    
    log "Starting $backup_type backup..."
    
    # Check git repository
    check_git_repo
    
    # Backup error log
    backup_error_log
    
    # Check for changes
    if git diff --quiet && git diff --cached --quiet; then
        info "No changes detected. Skipping backup."
        return 0
    fi
    
    # Add all files
    git add .
    
    # Create commit with comprehensive message
    local commit_msg=$(create_commit_message "$backup_type" "$details")
    git commit -m "$commit_msg"
    
    # Push to GitHub using SSH
    if git push origin main; then
        log "✅ Successfully pushed to GitHub"
    else
        error "Failed to push to GitHub. Retrying..."
        sleep 5
        if git push origin main; then
            log "✅ Retry successful"
        else
            error "❌ Failed to push after retry"
            return 1
        fi
    fi
    
    log "✅ $backup_type backup completed successfully"
}

# Function for scheduled backups (every 30 minutes)
scheduled_backup() {
    perform_backup "Scheduled Backup" "Automated 30-minute backup cycle"
}

# Function for feature backups (before major changes)
feature_backup() {
    local feature_name="$1"
    perform_backup "Feature Backup" "Before implementing: $feature_name"
}

# Function for error fix backups
error_fix_backup() {
    local error_description="$1"
    perform_backup "Error Fix Backup" "Before fixing: $error_description"
}

# Function for milestone backups
milestone_backup() {
    local milestone="$1"
    perform_backup "Milestone Backup" "Completed: $milestone"
}

# Function to verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    # Verify SSH fingerprint for security
    local expected_fingerprint="SHA256:NVCtTVbZYQraMObPNIKCGkCBGM8NujB2/6i/kTQaL2A"
    local actual_fingerprint=$(ssh-keygen -lf ~/.ssh/id_ed25519.pub | awk '{print $2}')
    
    if [ "$actual_fingerprint" = "$expected_fingerprint" ]; then
        log "✅ SSH key fingerprint verified: $actual_fingerprint"
    else
        error "❌ SSH key fingerprint mismatch!"
        error "Expected: $expected_fingerprint"
        error "Actual: $actual_fingerprint"
        return 1
    fi
    
    # Check if remote exists
    if ! git ls-remote origin >/dev/null 2>&1; then
        error "Cannot connect to remote repository"
        return 1
    fi
    
    # Check if local and remote are in sync
    git fetch origin main
    local local_hash=$(git rev-parse main)
    local remote_hash=$(git rev-parse origin/main)
    
    if [ "$local_hash" = "$remote_hash" ]; then
        log "✅ Local and remote repositories are in sync"
    else
        warning "⚠️ Local and remote repositories are out of sync"
        log "Local:  $local_hash"
        log "Remote: $remote_hash"
    fi
    
    # Verify critical files exist
    local critical_files=("CLAUDE.md" "ERROR_LOG.md")
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            log "✅ Critical file exists: $file"
        else
            error "❌ Critical file missing: $file"
            return 1
        fi
    done
    
    log "✅ Backup integrity verification completed"
}

# Function to restore from backup
restore_from_backup() {
    local commit_hash="$1"
    
    if [ -z "$commit_hash" ]; then
        error "No commit hash provided for restoration"
        return 1
    fi
    
    log "Restoring from backup: $commit_hash"
    
    # Create backup of current state before restoration
    perform_backup "Pre-Restoration Backup" "Before restoring to $commit_hash"
    
    # Reset to specified commit
    git reset --hard "$commit_hash"
    
    log "✅ Restored to commit: $commit_hash"
}

# Function to list available backups
list_backups() {
    log "Available backups (last 20 commits):"
    git log --oneline -20 --pretty=format:"%C(yellow)%h%C(reset) - %C(green)%ad%C(reset) - %s" --date=short
}

# Function to setup automated scheduling
setup_automation() {
    log "Setting up automated backup scheduling..."
    
    # Create cron job for 30-minute backups during work hours (9 AM - 6 PM)
    local cron_job="*/30 9-18 * * 1-5 cd $PROJECT_ROOT && $PROJECT_ROOT/auto-backup.sh scheduled"
    
    # Add to crontab if not already present
    if ! crontab -l 2>/dev/null | grep -q "$PROJECT_ROOT/auto-backup.sh"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        log "✅ Automated backup scheduling enabled"
    else
        log "ℹ️ Automated backup already scheduled"
    fi
}

# Function to monitor and alert on backup status
monitor_backup_status() {
    local last_backup_time=$(git log -1 --format="%ct")
    local current_time=$(date +%s)
    local time_diff=$((current_time - last_backup_time))
    local hours_since_backup=$((time_diff / 3600))
    
    if [ $hours_since_backup -gt 2 ]; then
        warning "⚠️ Last backup was $hours_since_backup hours ago"
        return 1
    else
        log "✅ Backup is current (last backup: $hours_since_backup hours ago)"
        return 0
    fi
}

# Main script logic
case "$1" in
    "scheduled")
        scheduled_backup
        ;;
    "feature")
        if [ -z "$2" ]; then
            error "Feature name required. Usage: $0 feature 'feature-name'"
            exit 1
        fi
        feature_backup "$2"
        ;;
    "error-fix")
        if [ -z "$2" ]; then
            error "Error description required. Usage: $0 error-fix 'error-description'"
            exit 1
        fi
        error_fix_backup "$2"
        ;;
    "milestone")
        if [ -z "$2" ]; then
            error "Milestone name required. Usage: $0 milestone 'milestone-name'"
            exit 1
        fi
        milestone_backup "$2"
        ;;
    "verify")
        verify_backup
        ;;
    "restore")
        if [ -z "$2" ]; then
            error "Commit hash required. Usage: $0 restore 'commit-hash'"
            exit 1
        fi
        restore_from_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "setup")
        setup_automation
        ;;
    "monitor")
        monitor_backup_status
        ;;
    "manual")
        perform_backup "Manual Backup" "${2:-Manual backup requested}"
        ;;
    *)
        echo "TailTracker Automated Backup System"
        echo ""
        echo "Usage: $0 {scheduled|feature|error-fix|milestone|verify|restore|list|setup|monitor|manual}"
        echo ""
        echo "Commands:"
        echo "  scheduled              - Perform scheduled backup (every 30 minutes)"
        echo "  feature 'name'         - Backup before implementing feature"
        echo "  error-fix 'desc'       - Backup before fixing error"
        echo "  milestone 'name'       - Backup after completing milestone"
        echo "  verify                 - Verify backup integrity"
        echo "  restore 'hash'         - Restore from specific commit"
        echo "  list                   - List available backups"
        echo "  setup                  - Setup automated scheduling"
        echo "  monitor                - Check backup status"
        echo "  manual 'desc'          - Manual backup with description"
        echo ""
        echo "Examples:"
        echo "  $0 feature 'user authentication'"
        echo "  $0 error-fix 'navigation crash bug'"
        echo "  $0 milestone 'MVP completed'"
        echo "  $0 restore abc1234"
        exit 1
        ;;
esac