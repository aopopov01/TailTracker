#!/bin/bash

# TailTracker Monitoring Setup Script
# Sets up comprehensive monitoring for Supabase backend

set -e

PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
MONITORING_DIR="$PROJECT_DIR/monitoring"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📊 Setting up TailTracker Backend Monitoring${NC}"

# Create monitoring directories
mkdir -p "$MONITORING_DIR"/{alerts,dashboards,logs,scripts}

echo -e "${YELLOW}📁 Created monitoring directory structure${NC}"

# Setup log aggregation
cat > "$MONITORING_DIR/setup-logging.sql" << 'EOF'
-- TailTracker Logging and Monitoring Setup

-- Create monitoring schema
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Application logs table
CREATE TABLE IF NOT EXISTS monitoring.application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    level VARCHAR(20) NOT NULL,
    service VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    user_id UUID REFERENCES users(id),
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS monitoring.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(20),
    service VARCHAR(100) NOT NULL,
    endpoint VARCHAR(200),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error tracking table
CREATE TABLE IF NOT EXISTS monitoring.error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    service VARCHAR(100) NOT NULL,
    endpoint VARCHAR(200),
    user_id UUID REFERENCES users(id),
    request_data JSONB,
    severity VARCHAR(20) DEFAULT 'error',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health checks table
CREATE TABLE IF NOT EXISTS monitoring.health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    service VARCHAR(100) NOT NULL,
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- healthy, degraded, unhealthy
    response_time_ms INTEGER,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS monitoring.api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    user_agent TEXT,
    ip_address INET,
    subscription_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON monitoring.application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON monitoring.application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_service ON monitoring.application_logs(service);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON monitoring.application_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON monitoring.performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_service ON monitoring.performance_metrics(service);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON monitoring.performance_metrics(endpoint);

CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON monitoring.error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_service ON monitoring.error_logs(service);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON monitoring.error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON monitoring.health_checks(timestamp);
CREATE INDEX IF NOT EXISTS idx_health_checks_service ON monitoring.health_checks(service);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON monitoring.health_checks(status);

CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON monitoring.api_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON monitoring.api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON monitoring.api_usage(endpoint);

-- Function to log application events
CREATE OR REPLACE FUNCTION monitoring.log_application_event(
    p_level VARCHAR(20),
    p_service VARCHAR(100),
    p_message TEXT,
    p_metadata JSONB DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_request_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO monitoring.application_logs (
        level, service, message, metadata, user_id, request_id
    ) VALUES (
        p_level, p_service, p_message, p_metadata, p_user_id, p_request_id
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track API usage
CREATE OR REPLACE FUNCTION monitoring.track_api_usage(
    p_user_id UUID,
    p_endpoint VARCHAR(200),
    p_method VARCHAR(10),
    p_status_code INTEGER,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_subscription_status VARCHAR(20) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO monitoring.api_usage (
        user_id, endpoint, method, status_code, response_time_ms, subscription_status
    ) VALUES (
        p_user_id, p_endpoint, p_method, p_status_code, p_response_time_ms, p_subscription_status
    ) RETURNING id INTO usage_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log errors
CREATE OR REPLACE FUNCTION monitoring.log_error(
    p_error_type VARCHAR(100),
    p_error_message TEXT,
    p_service VARCHAR(100),
    p_stack_trace TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'error'
)
RETURNS UUID AS $$
DECLARE
    error_id UUID;
BEGIN
    INSERT INTO monitoring.error_logs (
        error_type, error_message, service, stack_trace, user_id, severity
    ) VALUES (
        p_error_type, p_error_message, p_service, p_stack_trace, p_user_id, p_severity
    ) RETURNING id INTO error_id;
    
    RETURN error_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record health check
CREATE OR REPLACE FUNCTION monitoring.record_health_check(
    p_service VARCHAR(100),
    p_check_name VARCHAR(100),
    p_status VARCHAR(20),
    p_response_time_ms INTEGER DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    check_id UUID;
BEGIN
    INSERT INTO monitoring.health_checks (
        service, check_name, status, response_time_ms, details
    ) VALUES (
        p_service, p_check_name, p_status, p_response_time_ms, p_details
    ) RETURNING id INTO check_id;
    
    RETURN check_id;
END;
$$ LANGUAGE plpgsql;

-- Clean up old logs (run periodically)
CREATE OR REPLACE FUNCTION monitoring.cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Delete application logs older than 30 days
    DELETE FROM monitoring.application_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete performance metrics older than 7 days (except hourly aggregates)
    DELETE FROM monitoring.performance_metrics 
    WHERE created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete resolved error logs older than 30 days
    DELETE FROM monitoring.error_logs 
    WHERE resolved = TRUE AND created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete health checks older than 7 days
    DELETE FROM monitoring.health_checks 
    WHERE created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete API usage logs older than 90 days
    DELETE FROM monitoring.api_usage 
    WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA monitoring TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA monitoring TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA monitoring TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA monitoring TO authenticated, service_role;
EOF

echo -e "${GREEN}✅ Created logging setup SQL${NC}"

# Create monitoring dashboard configuration
cat > "$MONITORING_DIR/dashboards/supabase-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "TailTracker Backend Monitoring",
    "tags": ["tailtracker", "supabase"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "API Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "avg(monitoring_performance_metrics_response_time_ms) by (endpoint)"
          }
        ]
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(monitoring_error_logs_total[5m])"
          }
        ]
      },
      {
        "id": 3,
        "title": "API Usage by Endpoint",
        "type": "table",
        "targets": [
          {
            "expr": "count by (endpoint) (monitoring_api_usage_total)"
          }
        ]
      },
      {
        "id": 4,
        "title": "Subscription Status Distribution",
        "type": "pie",
        "targets": [
          {
            "expr": "count by (subscription_status) (users)"
          }
        ]
      },
      {
        "id": 5,
        "title": "Database Connection Pool",
        "type": "gauge",
        "targets": [
          {
            "expr": "pg_stat_activity_connections"
          }
        ]
      },
      {
        "id": 6,
        "title": "Storage Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(storage_objects_size_bytes) by (bucket_id)"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

echo -e "${GREEN}✅ Created monitoring dashboard configuration${NC}"

# Create alerting rules
cat > "$MONITORING_DIR/alerts/tailtracker-alerts.yml" << 'EOF'
groups:
- name: tailtracker-backend
  rules:
  - alert: HighErrorRate
    expr: rate(monitoring_error_logs_total[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"

  - alert: SlowAPIResponse
    expr: avg(monitoring_performance_metrics_response_time_ms) > 2000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "API response time is slow"
      description: "Average response time is {{ $value }}ms"

  - alert: DatabaseConnectionsHigh
    expr: pg_stat_activity_connections > 80
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Database connection count is high"
      description: "{{ $value }} active connections"

  - alert: StorageQuotaWarning
    expr: sum(storage_objects_size_bytes) / storage_quota_bytes > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Storage quota is nearly full"
      description: "Storage usage is at {{ $value }}% of quota"

  - alert: PaymentProcessingFailure
    expr: increase(stripe_webhook_events_failed_total[5m]) > 5
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Payment processing failures detected"
      description: "{{ $value }} payment webhook failures in the last 5 minutes"

  - alert: LostPetAlertSystemDown
    expr: up{job="lost-pet-alerts"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Lost pet alert system is down"
      description: "The lost pet alert system is not responding"

  - alert: VaccinationReminderFailure
    expr: increase(notification_scheduler_errors_total[10m]) > 3
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Vaccination reminder system failures"
      description: "{{ $value }} vaccination reminder failures in the last 10 minutes"
EOF

echo -e "${GREEN}✅ Created alerting rules${NC}"

# Create backup script
cat > "$MONITORING_DIR/scripts/backup-database.sh" << 'EOF'
#!/bin/bash

# TailTracker Database Backup Script
# Usage: ./backup-database.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/tailtracker"
PROJECT_DIR=$(dirname "$(dirname "$(dirname "$(readlink -f "$0")")")")

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🗄️  Starting TailTracker database backup for ${ENVIRONMENT}${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR/$ENVIRONMENT"

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

# Backup filename
BACKUP_FILE="$BACKUP_DIR/$ENVIRONMENT/tailtracker_${ENVIRONMENT}_${TIMESTAMP}.sql"

echo -e "${YELLOW}📦 Creating database backup...${NC}"

# Create full database backup
supabase db dump -f "$BACKUP_FILE"

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Database backup created: $BACKUP_FILE${NC}"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}🗜️  Backup compressed: ${BACKUP_FILE}.gz${NC}"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo -e "${GREEN}📊 Backup size: $BACKUP_SIZE${NC}"
    
    # Clean up old backups (keep last 7 days)
    find "$BACKUP_DIR/$ENVIRONMENT" -name "*.gz" -mtime +7 -delete
    echo -e "${GREEN}🧹 Cleaned up old backups${NC}"
    
    # Upload to cloud storage (if configured)
    if [[ -n "$BACKUP_CLOUD_STORAGE" ]]; then
        echo -e "${YELLOW}☁️  Uploading to cloud storage...${NC}"
        # Add your cloud storage upload command here
        # Example: aws s3 cp "${BACKUP_FILE}.gz" "s3://your-backup-bucket/tailtracker/"
    fi
    
else
    echo -e "${RED}❌ Database backup failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
EOF

chmod +x "$MONITORING_DIR/scripts/backup-database.sh"

echo -e "${GREEN}✅ Created backup script${NC}"

# Create log rotation configuration
cat > "$MONITORING_DIR/logrotate.conf" << 'EOF'
# TailTracker Log Rotation Configuration
/var/log/tailtracker/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 www-data www-data
    postrotate
        # Restart log collection service if needed
        systemctl reload rsyslog
    endscript
}

/var/log/supabase/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 postgres postgres
}
EOF

echo -e "${GREEN}✅ Created log rotation configuration${NC}"

# Create monitoring cron jobs
cat > "$MONITORING_DIR/scripts/setup-cron.sh" << 'EOF'
#!/bin/bash

# Setup cron jobs for TailTracker monitoring

# Add cron jobs
(crontab -l 2>/dev/null; echo "# TailTracker Monitoring Jobs") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * $PWD/backup-database.sh production") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * $PWD/backup-database.sh staging") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * curl -f https://your-project.supabase.co/functions/v1/notification-scheduler?action=process-all") | crontab -
(crontab -l 2>/dev/null; echo "0 0 * * * curl -f https://your-project.supabase.co/functions/v1/notification-scheduler?action=cleanup") | crontab -

echo "✅ Cron jobs added for monitoring and backups"
EOF

chmod +x "$MONITORING_DIR/scripts/setup-cron.sh"

echo -e "${GREEN}✅ Created cron setup script${NC}"

echo ""
echo -e "${GREEN}🎉 Monitoring setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Run the logging setup SQL in your database"
echo "2. Configure your monitoring dashboard (Grafana, etc.)"
echo "3. Set up alerting (PagerDuty, Slack, etc.)"
echo "4. Run the cron setup script for automated tasks"
echo "5. Test the backup script"
echo ""
echo -e "${YELLOW}📁 Files created:${NC}"
echo "  - $MONITORING_DIR/setup-logging.sql"
echo "  - $MONITORING_DIR/dashboards/supabase-dashboard.json"
echo "  - $MONITORING_DIR/alerts/tailtracker-alerts.yml"
echo "  - $MONITORING_DIR/scripts/backup-database.sh"
echo "  - $MONITORING_DIR/logrotate.conf"
echo "  - $MONITORING_DIR/scripts/setup-cron.sh"
EOF

chmod +x /home/he_reat/Desktop/Projects/TailTracker/backend/supabase/monitoring/setup-monitoring.sh

echo -e "${GREEN}✅ Created monitoring setup script${NC}"